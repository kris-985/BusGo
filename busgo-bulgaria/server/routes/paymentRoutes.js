import { Router } from 'express'

import { createPayment } from '../controllers/paymentController.js'
import { requireAuth } from '../middleware/auth.js'

export const paymentRouter = Router()

paymentRouter.post('/', requireAuth, createPayment)
