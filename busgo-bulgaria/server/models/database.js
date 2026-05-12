import { readFile } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

import { ensureCompleteCityRoutes, initialOccupiedSeatIds } from '../utils/routes.js'
import { normalize } from '../utils/format.js'

const isWorkspaceCwd = path.basename(process.cwd()) === 'busgo-bulgaria'
const serverDir = path.join(process.cwd(), isWorkspaceCwd ? 'server' : 'busgo-bulgaria/server')
const dbPath = path.join(serverDir, 'db.json')
const mongoUri = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017'
const mongoDbName = process.env.MONGODB_DB ?? 'busgo'
const client = new MongoClient(mongoUri, {
  serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS ?? 5000),
})
let mongoDbPromise

export async function mongoDb() {
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

export async function seedMongoIfNeeded(db) {
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

export async function readDb() {
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

export async function writeDb(db) {
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
