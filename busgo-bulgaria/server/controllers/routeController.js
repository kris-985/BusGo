import { readDb, writeDb } from '../models/database.js'
import { localDatePart, normalize, slug, titleCase } from '../utils/format.js'
import { delay, sendError } from '../utils/http.js'
import { buildSeatMap, knownCities, routeOnDate, toAdminRoute, toTrip, uniqueRoutes } from '../utils/routes.js'

export async function listCities(_req, res, next) {
  try {
    const db = await readDb()
    res.json(knownCities(db.routes))
  } catch (error) {
    next(error)
  }
}

export async function listRoutes(_req, res, next) {
  try {
    await delay()
    const db = await readDb()
    res.json(uniqueRoutes(db.routes))
  } catch (error) {
    next(error)
  }
}

export async function listAdminRoutes(_req, res, next) {
  try {
    await delay()
    const db = await readDb()
    res.json(db.routes.map(toAdminRoute))
  } catch (error) {
    next(error)
  }
}

export async function createRoute(req, res, next) {
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
}

export async function searchRoutes(req, res, next) {
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
}

export async function routeById(req, res, next) {
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
}

export async function routeSeats(req, res, next) {
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
