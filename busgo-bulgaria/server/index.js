import express from 'express'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, 'db.json')
const app = express()
const port = Number(process.env.PORT ?? 3001)
const currency = 'BGN'
const operator = { id: 'op-busgo', name: 'BusGo Bulgaria' }

const cityIdByName = new Map([
  ['Sofia', 'sof'],
  ['Plovdiv', 'pld'],
  ['Varna', 'var'],
  ['Burgas', 'bgs'],
  ['Stara Zagora', 'szg'],
])

const cityOrder = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora']
const distanceByRoute = new Map([
  ['Sofia-Plovdiv', 146],
  ['Sofia-Varna', 470],
  ['Plovdiv-Burgas', 253],
  ['Varna-Burgas', 133],
  ['Sofia-Stara Zagora', 231],
])
const apiDelayMs = Number(process.env.API_DELAY_MS ?? 500)

app.use(express.json())
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

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

function routeKey(route) {
  return `${route.fromCity}-${route.toCity}`
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
        status: occupiedSeatIds.has(id) ? 'Occupied' : 'Free',
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
  const raw = await readFile(dbPath, 'utf8')
  const db = JSON.parse(raw)
  db.bookings ??= []
  db.routes = db.routes.map((route) => {
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
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
}

function sendError(res, status, message) {
  res.status(status).json({ message })
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

app.get('/admin/routes', async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(db.routes.map(toAdminRoute))
  } catch (error) {
    next(error)
  }
})

app.post('/routes', async (req, res, next) => {
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
    const matches = dateMatches.length > 0 ? dateMatches : directMatches
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
    res.json(toTrip(route))
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

app.get('/bookings', async (_req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    res.json(db.bookings)
  } catch (error) {
    next(error)
  }
})

app.get('/bookings/:id', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const booking = db.bookings.find((item) => item.id === req.params.id)
    if (!booking) {
      sendError(res, 404, 'Booking not found')
      return
    }
    res.json(booking)
  } catch (error) {
    next(error)
  }
})

app.post('/bookings', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const { tripId, seatIds, passengers, contactEmail, contactPhone, paymentMethod } = req.body
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

    const trip = toTrip(route)
    const normalizedPassengers = uniqueSeatIds.map((_, index) => ({
      id: `p-${Date.now()}-${index}`,
      ...(passengers?.[index] ?? { firstName: '', lastName: '', type: 'ADULT' }),
    }))
    const totalAmount = uniqueSeatIds.length * trip.price.amount
    const booking = {
      id: `b-${Date.now()}`,
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

app.post('/payments', async (req, res, next) => {
  try {
    await delay()
    const db = await readDb()
    const booking = db.bookings.find((item) => item.id === req.body.bookingId)
    if (!booking) {
      sendError(res, 404, 'Booking not found')
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
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`BusGo API listening on http://localhost:${port}`)
})
