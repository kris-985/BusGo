import { Router } from 'express'

import { bookingById, createBooking, listBookings } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/auth.js'

export const bookingRouter = Router()

bookingRouter.get('/', requireAuth, listBookings)
bookingRouter.post('/', requireAuth, createBooking)
bookingRouter.get('/:id', requireAuth, bookingById)
