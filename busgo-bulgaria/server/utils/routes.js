import { cityCoordinates, cityOrder, currency, distanceByRoute, operator } from '../config/constants.js'
import { cityByName, isYmd, normalize, slug } from './format.js'
import { addMinutes, minutesBetween } from './time.js'

export function routeKey(route) {
  return `${route.fromCity}-${route.toCity}`
}

export function pairKey(fromCity, toCity) {
  return `${fromCity}-${toCity}`
}

export function roadDistanceKm(fromCity, toCity) {
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

export function routeOnDate(route, date) {
  if (!isYmd(date)) return route

  const departureTime = `${date}${String(route.departureTime).slice(10)}`
  return {
    ...route,
    departureTime,
    arrivalTime: addMinutes(departureTime, minutesBetween(route.departureTime, route.arrivalTime)),
  }
}

export function demoRouteId(fromCity, toCity, departureTime) {
  const departure = new Date(departureTime)
  const hhmm = departure.toISOString().slice(11, 16).replace(':', '')
  return `bg-${slug(fromCity).slice(0, 12)}-${slug(toCity).slice(0, 12)}-${hhmm}`
}

export function ensureCompleteCityRoutes(routes) {
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

export function knownCities(routes) {
  const cities = new Map(cityOrder.map((name) => [normalize(name), cityByName(name)]))
  for (const route of routes) {
    for (const name of [route.fromCity, route.toCity]) {
      const city = cityByName(name)
      cities.set(normalize(city.name), city)
    }
  }
  return Array.from(cities.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function toTrip(route) {
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

export function toAdminRoute(route) {
  const { occupiedSeatIds: _occupiedSeatIds, ...record } = route
  return record
}

export function buildSeatMap(route) {
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

export function initialOccupiedSeatIds(route) {
  const occupiedCount = Math.max(0, route.totalSeats - route.availableSeats)
  return buildSeatMap({ ...route, occupiedSeatIds: [] })
    .slice(0, occupiedCount)
    .map((seat) => seat.id)
}

export function uniqueRoutes(routes) {
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
