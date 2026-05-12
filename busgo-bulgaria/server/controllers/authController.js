import bcrypt from 'bcryptjs'

import { mongoDb, seedMongoIfNeeded } from '../models/database.js'
import { publicUser, signUserToken } from '../middleware/auth.js'
import { normalize, titleCase } from '../utils/format.js'
import { delay, sendError } from '../utils/http.js'

export async function signup(req, res, next) {
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
}

export async function login(req, res, next) {
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
}

export function me(req, res) {
  res.json(publicUser(req.user))
}
