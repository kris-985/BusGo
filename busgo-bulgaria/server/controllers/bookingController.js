import { currency } from '../config/constants.js'
import { readDb, writeDb } from '../models/database.js'
import { delay, sendError } from '../utils/http.js'
import { buildSeatMap, routeOnDate, toTrip } from '../utils/routes.js'

export async function listBookings(req, res, next) {
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
}

export async function listAdminBookings(_req, res, next) {
  try {
    await delay()
    const db = await readDb()
    res.json(db.bookings)
  } catch (error) {
    next(error)
  }
}

export async function bookingById(req, res, next) {
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
}

export async function createBooking(req, res, next) {
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
}
