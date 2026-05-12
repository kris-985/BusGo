import { mongoDb, readDb, seedMongoIfNeeded } from '../models/database.js'
import { delay } from '../utils/http.js'

export async function listUsers(_req, res, next) {
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
}

export async function seatOccupancy(_req, res, next) {
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
}
