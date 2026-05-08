import express from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'

const isWorkspaceCwd = path.basename(process.cwd()) === 'busgo-bulgaria'
const serverDir = path.join(process.cwd(), isWorkspaceCwd ? 'server' : 'busgo-bulgaria/server')
const dbPath = path.join(serverDir, 'db.json')
const isServerlessRuntime = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
const app = express()
const port = Number(process.env.PORT ?? 3001)
const currency = 'BGN'
const operator = { id: 'op-busgo', name: 'BusGo Bulgaria' }
const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const mongoDbName = process.env.MONGODB_DB ?? 'busgo'
const jwtSecret = process.env.JWT_SECRET ?? 'busgo-dev-secret'
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS ?? 5000),
})
let mongoDbPromise

const cityIdByName = new Map([
  ['Sofia', 'sof'],
  ['Plovdiv', 'pld'],
  ['Varna', 'var'],
  ['Burgas', 'bgs'],
  ['Stara Zagora', 'szg'],
])

const cityOrder = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora']
const cityCoordinates = new Map([
  ['Sofia', { lat: 42.6977, lon: 23.3219 }],
  ['Plovdiv', { lat: 42.1354, lon: 24.7453 }],
  ['Varna', { lat: 43.2141, lon: 27.9147 }],
  ['Burgas', { lat: 42.5048, lon: 27.4626 }],
  ['Stara Zagora', { lat: 42.4258, lon: 25.6345 }],
])
const distanceByRoute = new Map([
  ['Sofia-Plovdiv', 146],
  ['Plovdiv-Sofia', 146],
  ['Sofia-Varna', 470],
  ['Varna-Sofia', 470],
  ['Plovdiv-Burgas', 253],
  ['Burgas-Plovdiv', 253],
  ['Varna-Burgas', 133],
  ['Burgas-Varna', 133],
  ['Sofia-Stara Zagora', 231],
  ['Stara Zagora-Sofia', 231],
])
const apiDelayMs = Number(process.env.API_DELAY_MS ?? 500)

app.use((req, _res, next) => {
  const netlifyFunctionPrefix = '/.netlify/functions/api'
  if (req.url.startsWith(netlifyFunctionPrefix)) {
    req.url = req.url.slice(netlifyFunctionPrefix.length) || '/'
  }
  next()
})

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

async function mongoDb() {
  mongoDbPromise ??= client.connect().then(async () => {
    const db = client.db(mongoDbName)
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      db.collection('bookings').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('routes').createIndex({ id: 1 }, { unique: true }),
    ])
    return db
  })

  return mongoDbPromise
}

async function seedMongoIfNeeded(db) {
  const routesCount = await db.collection('routes').countDocuments()
  if (routesCount === 0) {
    const raw = await readFile(dbPath, 'utf8')
    const seed = JSON.parse(raw)
    if (Array.isArray(seed.routes) && seed.routes.length > 0) {
      await db.collection('routes').insertMany(seed.routes)
    }
    if (Array.isArray(seed.bookings) && seed.bookings.length > 0) {
      await db.collection('bookings').insertMany(seed.bookings)
    }
  }

  const adminEmail = normalize(process.env.ADMIN_EMAIL ?? 'admin@busgo.bg')
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123'
  const existingAdmin = await db.collection('users').findOne({ email: adminEmail })
  if (!existingAdmin) {
    await db.collection('users').insertOne({
      id: `u-${Date.now()}-admin`,
      name: 'BusGo Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: 'admin',
      createdAt: new Date().toISOString(),
    })
  }
}

function normalize(value) {
  return String(value ?? '').trim().toLowerCase()
}

function slug(value) {
  return normalize(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleCase(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\p{L}+/gu, (word) => word[0].toLocaleUpperCase() + word.slice(1))
}

function cityByName(name) {
  return {
    id: cityIdByName.get(name) ?? normalize(name).replace(/\s+/g, '-'),
    name,
    countryCode: 'BG',
  }
}

function minutesBetween(startIso, endIso) {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
}

function localDatePart(iso) {
  return String(iso ?? '').slice(0, 10)
}

function isYmd(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))
}

function routeKey(route) {
  return `${route.fromCity}-${route.toCity}`
}

function pairKey(fromCity, toCity) {
  return `${fromCity}-${toCity}`
}

function roadDistanceKm(fromCity, toCity) {
  const knownDistance = distanceByRoute.get(pairKey(fromCity, toCity))
  if (knownDistance) return knownDistance

  const from = cityCoordinates.get(fromCity)
  const to = cityCoordinates.get(toCity)
  if (!from || !to) return 220

  const earthRadiusKm = 6371
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLon = ((to.lon - from.lon) * Math.PI) / 180
  const fromLat = (from.lat * Math.PI) / 180
  const toLat = (to.lat * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLon / 2) ** 2
  const straightLineKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.max(80, Math.round(straightLineKm * 1.28))
}

function addMinutes(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString()
}

function routeOnDate(route, date) {
  if (!isYmd(date)) return route

  const departureTime = `${date}${String(route.departureTime).slice(10)}`
  return {
    ...route,
    departureTime,
    arrivalTime: addMinutes(departureTime, minutesBetween(route.departureTime, route.arrivalTime)),
  }
}

function demoRouteId(fromCity, toCity, departureTime) {
  const departure = new Date(departureTime)
  const hhmm = departure.toISOString().slice(11, 16).replace(':', '')
  return `bg-${slug(fromCity).slice(0, 12)}-${slug(toCity).slice(0, 12)}-${hhmm}`
}

function ensureCompleteCityRoutes(routes) {
  const byPair = new Set(routes.map((route) => pairKey(route.fromCity, route.toCity)))
  const completeRoutes = [...routes]
  const departures = [
    { hour: 7, minute: 0, seatOffset: 0 },
    { hour: 12, minute: 30, seatOffset: 7 },
    { hour: 18, minute: 0, seatOffset: 13 },
  ]

  for (const fromCity of cityOrder) {
    for (const toCity of cityOrder) {
      if (fromCity === toCity || byPair.has(pairKey(fromCity, toCity))) continue

      const distanceKm = roadDistanceKm(fromCity, toCity)
      const durationMinutes = Math.max(80, Math.round(distanceKm / 72 * 60 + 20))
      const basePrice = Math.round((12 + distanceKm * 0.075) * 10) / 10

      for (const departure of departures) {
        const departureTime = new Date(Date.UTC(2026, 4, 5, departure.hour, departure.minute)).toISOString()
        const availableSeats = Math.max(8, 34 - departure.seatOffset - (distanceKm % 5))
        completeRoutes.push({
          id: demoRouteId(fromCity, toCity, departureTime),
          fromCity,
          toCity,
          departureTime,
          arrivalTime: addMinutes(departureTime, durationMinutes),
          price: Math.round((basePrice + departure.seatOffset * 0.35) * 100) / 100,
          availableSeats,
          totalSeats: 40,
          distanceKm,
        })
      }

      byPair.add(pairKey(fromCity, toCity))
    }
  }

  return completeRoutes
}

function knownCities(routes) {
  const cities = new Map(cityOrder.map((name) => [normalize(name), cityByName(name)]))
  for (const route of routes) {
    for (const name of [route.fromCity, route.toCity]) {
      const city = cityByName(name)
      cities.set(normalize(city.name), city)
    }
  }
  return Array.from(cities.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function toTrip(route) {
  return {
    id: route.id,
    from: cityByName(route.fromCity),
    to: cityByName(route.toCity),
    departureTime: route.departureTime,
    arrivalTime: route.arrivalTime,
    durationMinutes: minutesBetween(route.departureTime, route.arrivalTime),
    operator,
    amenities: ['WIFI', 'POWER', 'AC', 'WC'],
    price: { amount: route.price, currency },
    seatsLeft: route.availableSeats,
  }
}

function toAdminRoute(route) {
  const { occupiedSeatIds: _occupiedSeatIds, ...record } = route
  return record
}

function buildSeatMap(route) {
  const columns = ['A', 'B', 'C', 'D']
  const occupiedSeatIds = new Set(route.occupiedSeatIds ?? [])
  const seats = []

  for (let row = 1; row <= route.totalSeats / columns.length; row += 1) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const label = `${row}${columns[columnIndex]}`
      const id = `${route.id}-${label}`
      seats.push({
        id,
        label,
        row,
        column: columnIndex + 1,
        status: occupiedSeatIds.has(id) ? 'OCCUPIED' : 'FREE',
      })
    }
  }

  return seats
}

function initialOccupiedSeatIds(route) {
  const occupiedCount = Math.max(0, route.totalSeats - route.availableSeats)
  return buildSeatMap({ ...route, occupiedSeatIds: [] })
    .slice(0, occupiedCount)
    .map((seat) => seat.id)
}

async function readDb() {
  const mongo = await mongoDb()
  await seedMongoIfNeeded(mongo)
  const [routes, bookings] = await Promise.all([
    mongo.collection('routes').find({}, { projection: { _id: 0 } }).toArray(),
    mongo.collection('bookings').find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray(),
  ])
  const db = { routes, bookings }
  db.bookings ??= []
  db.routes = ensureCompleteCityRoutes(db.routes).map((route) => {
    const occupiedSeatIds = Array.isArray(route.occupiedSeatIds)
      ? route.occupiedSeatIds
      : initialOccupiedSeatIds(route)
    return {
      ...route,
      occupiedSeatIds,
      availableSeats: Math.max(0, route.totalSeats - occupiedSeatIds.length),
    }
  })
  return db
}

async function writeDb(db) {
  const mongo = await mongoDb()
  await Promise.all([
    mongo.collection('routes').deleteMany({}),
    mongo.collection('bookings').deleteMany({}),
  ])
  await Promise.all([
    db.routes.length ? mongo.collection('routes').insertMany(db.routes) : Promise.resolve(),
    db.bookings.length ? mongo.collection('bookings').insertMany(db.bookings) : Promise.resolve(),
  ])
}

function sendError(res, status, message) {
  res.status(status).json({ message })
}

function publicUser(user) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      }
    : null
}

function fallbackAssistantReply(message) {
  const text = normalize(message)
  if (text.includes('ticket') || text.includes('bilet') || text.includes('билет') || text.includes('купи')) {
    return 'Да. Най-бързият път е: отвори Search, избери откъде и докъде пътуваш, избери маршрут, после свободни места и продължи към checkout. Ако ми кажеш градовете и дата, ще те насоча по-конкретно.'
  }
  if (text.includes('login') || text.includes('register') || text.includes('регист') || text.includes('вход')) {
    return 'За покупка ти трябва профил. Отвори Login, избери Sign up за нов акаунт или Login, ако вече имаш регистрация. След вход можеш да довършиш резервацията.'
  }
  if (text.includes('admin')) {
    return 'Admin панелът е само за потребители с role admin. Там можеш да следиш маршрути, потребители, резервации и приходи.'
  }
  if (text.includes('seat') || text.includes('място') || text.includes('места')) {
    return 'След избран маршрут отвори картата на местата. Зелените са свободни, червените са заети. Можеш да избереш едно или няколко свободни места преди checkout.'
  }
  if (text.includes('маршрут') || text.includes('route') || text.includes('пътувам') || text.includes('до ')) {
    return 'Мога да помогна с маршрут, но ми трябват поне град на тръгване и град на пристигане. Например: "София до Варна утре" или "Пловдив до Бургас".'
  }
  return 'Кажи ми какво искаш да направиш: да намериш маршрут, да купиш билет, да избереш места или да провериш профил/резервация. Ако дадеш градове и дата, ще бъда по-точен.'
}

async function assistantReply({ message }) {
  return {
    reply: fallbackAssistantReply(message),
    mode: 'local',
  }
}

function signUserToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' })
}

async function currentUser(req) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null

  try {
    const payload = jwt.verify(token, jwtSecret)
    const mongo = await mongoDb()
    return await mongo.collection('users').findOne(
      { id: payload.sub },
      { projection: { _id: 0 } },
    )
  } catch {
    return null
  }
}

async function requireAuth(req, res, next) {
  const user = await currentUser(req)
  if (!user) {
    sendError(res, 401, 'Login required')
    return
  }
  req.user = user
  next()
}

async function requireAdmin(req, res, next) {
  const user = await currentUser(req)
  if (!user) {
    sendError(res, 401, 'Login required')
    return
  }
  if (user.role !== 'admin') {
    sendError(res, 403, 'Admin role required')
    return
  }
  req.user = user
  next()
}

function delay(ms = apiDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function uniqueRoutes(routes) {
  const byPair = new Map()
  for (const route of routes) {
    const key = routeKey(route)
    if (byPair.has(key)) continue
    byPair.set(key, {
      id: `route-${cityByName(route.fromCity).id}-${cityByName(route.toCity).id}`,
      from: cityByName(route.fromCity),
      to: cityByName(route.toCity),
      distanceKm: route.distanceKm ?? distanceByRoute.get(key),
      estimatedDurationMinutes: minutesBetween(route.departureTime, route.arrivalTime),
    })
  }
  return Array.from(byPair.values())
}

function createRouteId(db, route) {
  const departure = new Date(route.departureTime)
  const ymd = departure.toISOString().slice(0, 10).replaceAll('-', '')
  const hm = departure.toISOString().slice(11, 16).replace(':', '')
  const baseId = `bg-${slug(route.fromCity).slice(0, 12)}-${slug(route.toCity).slice(0, 12)}-${ymd}-${hm}`
  let candidate = baseId
  let suffix = 2

  while (db.routes.some((item) => item.id === candidate)) {
    candidate = `${baseId}-${suffix}`
    suffix += 1
  }

  return candidate
}

function parseCreateRouteInput(body) {
  const fromCity = titleCase(body.fromCity)
  const toCity = titleCase(body.toCity)
  const departureTime = String(body.departureTime ?? '')
  const arrivalTime = String(body.arrivalTime ?? '')
  const price = Number(body.price)
  const totalSeats = Number(body.totalSeats)
  const distanceKm = body.distanceKm === undefined || body.distanceKm === ''
    ? undefined
    : Number(body.distanceKm)
  const departureMs = Date.parse(departureTime)
  const arrivalMs = Date.parse(arrivalTime)

  if (!fromCity || !toCity) return { error: 'Origin and destination are required' }
  if (normalize(fromCity) === normalize(toCity)) return { error: 'Origin and destination must be different' }
  if (!Number.isFinite(departureMs) || !Number.isFinite(arrivalMs)) {
    return { error: 'Departure and arrival times are required' }
  }
  if (arrivalMs <= departureMs) return { error: 'Arrival must be after departure' }
  if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be greater than zero' }
  if (!Number.isInteger(totalSeats) || totalSeats < 4 || totalSeats > 80 || totalSeats % 4 !== 0) {
    return { error: 'Total seats must be a multiple of 4 between 4 and 80' }
  }
  if (distanceKm !== undefined && (!Number.isFinite(distanceKm) || distanceKm <= 0)) {
    return { error: 'Distance must be greater than zero' }
  }

  return {
    route: {
      fromCity,
      toCity,
      departureTime,
      arrivalTime,
      price: Math.round(price * 100) / 100,
      totalSeats,
      availableSeats: totalSeats,
      occupiedSeatIds: [],
      ...(distanceKm === undefined ? {} : { distanceKm: Math.round(distanceKm) }),
    },
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/auth/signup', async (req, res, next) => {
  try {
    await delay()
    const name = titleCase(req.body.name)
    const email = normalize(req.body.email)
    const password = String(req.body.password ?? '')

    if (!name) {
      sendError(res, 422, 'Name is required')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      sendError(res, 422, 'Valid email is required')
      return
    }
    if (password.length < 6) {
      sendError(res, 422, 'Password must be at least 6 characters')
      return
    }

    const mongo = await mongoDb()
    await seedMongoIfNeeded(mongo)
    const existingUser = await mongo.collection('users').findOne({ email })
    if (existingUser) {
      sendError(res, 409, 'Email is already registered')
      return
    }

    const user = {
      id: `u-${Date.now()}`,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'user',
      createdAt: new Date().toISOString(),
    }
    await mongo.collection('users').insertOne(user)
    res.status(201).json({ token: signUserToken(user), user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.post('/auth/login', async (req, res, next) => {
  try {
    await delay()
    const email = normalize(req.body.email)
    const password = String(req.body.password ?? '')
    const mongo = await mongoDb()
    await seedMongoIfNeeded(mongo)
    const user = await mongo.collection('users').findOne({ email }, { projection: { _id: 0 } })
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !passwordOk) {
      sendError(res, 401, 'Invalid email or password')
      return
    }

    res.json({ token: signUserToken(user), user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.get('/auth/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user))
})

app.post('/assistant', async (req, res, next) => {
  try {
    await delay(150)
    const message = String(req.body.message ?? '').trim()
    const currentPath = String(req.body.currentPath ?? '/')

    if (!message) {
      sendError(res, 422, 'Message is required')
      return
    }

    const result = await assistantReply({ message, currentPath })
    res.json(result)
  } catch (error) {
    next(error)
  }
})

app.get('/cities', async (_req, res, next) => {
  try {
    const db = await readDb()
    res.json(knownCities(db.routes))
  } catch (error) {
    next(error)
  }
})

app.get('/routes', async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(uniqueRoutes(db.routes))
  } catch (error) {
    next(error)
  }
})

app.get('/admin/routes', requireAdmin, async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(db.routes.map(toAdminRoute))
  } catch (error) {
    next(error)
  }
})

app.post('/routes', requireAdmin, async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const parsed = parseCreateRouteInput(req.body)
    if (parsed.error) {
      sendError(res, 422, parsed.error)
      return
    }

    const route = {
      id: createRouteId(db, parsed.route),
      ...parsed.route,
    }

    db.routes.push(route)
    await writeDb(db)
    res.status(201).json(toTrip(route))
  } catch (error) {
    next(error)
  }
})

app.get('/routes/search', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const from = normalize(req.query.from)
    const to = normalize(req.query.to)
    const date = normalize(req.query.date)
    const directMatches = db.routes.filter(
      (route) => normalize(route.fromCity) === from && normalize(route.toCity) === to,
    )
    const dateMatches = date
      ? directMatches.filter((route) => localDatePart(route.departureTime) === date)
      : directMatches
    const matches = dateMatches.length > 0 ? dateMatches : directMatches.map((route) => routeOnDate(route, date))
    console.debug('[BusGo API] /routes/search', {
      from: req.query.from,
      to: req.query.to,
      date: req.query.date,
      matches: matches.length,
      usedDateFallback: dateMatches.length === 0 && directMatches.length > 0,
    })
    res.json(matches.map(toTrip))
  } catch (error) {
    next(error)
  }
})

app.get('/routes/:id', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const route = db.routes.find((item) => item.id === req.params.id)
    if (!route) {
      sendError(res, 404, 'Trip not found')
      return
    }
    res.json(toTrip(routeOnDate(route, req.query.date)))
  } catch (error) {
    next(error)
  }
})

app.get('/routes/:id/seats', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const route = db.routes.find((item) => item.id === req.params.id)
    if (!route) {
      sendError(res, 404, 'Trip not found')
      return
    }
    res.json({
      tripId: route.id,
      updatedAt: new Date().toISOString(),
      seats: buildSeatMap(route),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/seats/occupancy', async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(
      db.routes.map((route) => {
        const occupiedSeats = route.occupiedSeatIds.length
        return {
          tripId: route.id,
          route: `${route.fromCity} - ${route.toCity}`,
          departureTime: route.departureTime,
          totalSeats: route.totalSeats,
          occupiedSeats,
          freeSeats: route.availableSeats,
          occupancyRate: Math.round((occupiedSeats / route.totalSeats) * 100),
        }
      }),
    )
  } catch (error) {
    next(error)
  }
})

app.get('/admin/users', requireAdmin, async (_req, res, next) => {
  try {
    await delay()
    const mongo = await mongoDb()
    await seedMongoIfNeeded(mongo)
    const users = await mongo.collection('users')
      .find({}, { projection: { _id: 0, passwordHash: 0 } })
      .sort({ role: 1, createdAt: -1 })
      .toArray()
    res.json(users)
  } catch (error) {
    next(error)
  }
})

app.get('/admin/bookings', requireAdmin, async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(db.bookings)
  } catch (error) {
    next(error)
  }
})

app.get('/bookings', requireAuth, async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const bookings = req.user.role === 'admin'
      ? db.bookings
      : db.bookings.filter((booking) => booking.userId === req.user.id)
    res.json(bookings)
  } catch (error) {
    next(error)
  }
})

app.get('/bookings/:id', requireAuth, async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const booking = db.bookings.find((item) => item.id === req.params.id)
    if (!booking) {
      sendError(res, 404, 'Booking not found')
      return
    }
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      sendError(res, 403, 'You can only view your own bookings')
      return
    }
    res.json(booking)
  } catch (error) {
    next(error)
  }
})

app.post('/bookings', requireAuth, async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const { tripId, travelDate, seatIds, passengers, contactEmail, contactPhone, paymentMethod } = req.body
    const route = db.routes.find((item) => item.id === tripId)
    if (!route) {
      sendError(res, 404, 'Trip not found')
      return
    }

    const uniqueSeatIds = Array.from(new Set(Array.isArray(seatIds) ? seatIds : [])).filter(Boolean)
    if (uniqueSeatIds.length === 0) {
      sendError(res, 422, 'No seats selected')
      return
    }

    const validSeatIds = new Set(buildSeatMap(route).map((seat) => seat.id))
    const occupiedSeatIds = new Set(route.occupiedSeatIds)
    for (const seatId of uniqueSeatIds) {
      if (!validSeatIds.has(seatId)) {
        sendError(res, 404, `Seat not found: ${seatId}`)
        return
      }
      if (occupiedSeatIds.has(seatId)) {
        const label = seatId.split('-').at(-1) ?? seatId
        sendError(res, 409, `Seat already occupied: ${label}`)
        return
      }
    }

    for (const seatId of uniqueSeatIds) occupiedSeatIds.add(seatId)
    route.occupiedSeatIds = Array.from(occupiedSeatIds)
    route.availableSeats = Math.max(0, route.totalSeats - route.occupiedSeatIds.length)

    const trip = toTrip(routeOnDate(route, travelDate))
    const normalizedPassengers = uniqueSeatIds.map((_, index) => ({
      id: `p-${Date.now()}-${index}`,
      ...(passengers?.[index] ?? { firstName: '', lastName: '', type: 'ADULT' }),
    }))
    const totalAmount = uniqueSeatIds.length * trip.price.amount
    const booking = {
      id: `b-${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      trip,
      seatIds: uniqueSeatIds,
      passengers: normalizedPassengers,
      total: { amount: Math.round(totalAmount * 100) / 100, currency },
      paymentMethod,
      contactEmail,
      contactPhone,
    }

    db.bookings.unshift(booking)
    await writeDb(db)
    res.status(201).json(booking)
  } catch (error) {
    next(error)
  }
})

app.post('/payments', requireAuth, async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const booking = db.bookings.find((item) => item.id === req.body.bookingId)
    if (!booking) {
      sendError(res, 404, 'Booking not found')
      return
    }
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      sendError(res, 403, 'You can only pay for your own booking')
      return
    }

    res.json({
      id: `pay-${Date.now()}`,
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      status: 'SUCCEEDED',
      method: req.body.method,
      amount: booking.total,
      provider: req.body.method === 'CARD' ? 'BusGoPay' : 'Cash',
      providerPaymentId: req.body.method === 'CARD' ? `pay_${Date.now()}` : undefined,
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  const status = Number.isInteger(error.status) ? error.status : 500
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : error.message,
  })
})

if (!isServerlessRuntime) {
  app.listen(port, () => {
    console.log(`BusGo API listening on http://localhost:${port}`)
  })
}

export default app
