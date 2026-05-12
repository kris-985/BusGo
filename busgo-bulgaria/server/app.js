import express from 'express'

import { adminRouter } from './routes/adminRoutes.js'
import { authRouter } from './routes/authRoutes.js'
import { bookingRouter } from './routes/bookingRoutes.js'
import { cityRouter } from './routes/cityRoutes.js'
import { paymentRouter } from './routes/paymentRoutes.js'
import { routeRouter } from './routes/routeRoutes.js'
import { seatRouter } from './routes/seatRoutes.js'

const app = express()

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

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/auth', authRouter)
app.use('/cities', cityRouter)
app.use('/routes', routeRouter)
app.use('/admin', adminRouter)
app.use('/seats', seatRouter)
app.use('/bookings', bookingRouter)
app.use('/payments', paymentRouter)

app.use((error, _req, res, _next) => {
  console.error(error)
  const status = Number.isInteger(error.status) ? error.status : 500
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : error.message,
  })
})

export default app
