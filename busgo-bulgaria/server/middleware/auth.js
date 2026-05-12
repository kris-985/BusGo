import jwt from 'jsonwebtoken'

import { mongoDb } from '../models/database.js'
import { sendError } from '../utils/http.js'

const jwtSecret = process.env.JWT_SECRET ?? 'busgo-dev-secret'

export function publicUser(user) {
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

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' })
}

export async function currentUser(req) {
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

export async function requireAuth(req, res, next) {
  const user = await currentUser(req)
  if (!user) {
    sendError(res, 401, 'Login required')
    return
  }
  req.user = user
  next()
}

export async function requireAdmin(req, res, next) {
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
