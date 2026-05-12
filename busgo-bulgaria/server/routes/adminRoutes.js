import { Router } from 'express'

import { listUsers } from '../controllers/adminController.js'
import { listAdminBookings } from '../controllers/bookingController.js'
import { listAdminRoutes } from '../controllers/routeController.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.get('/routes', requireAdmin, listAdminRoutes)
adminRouter.get('/users', requireAdmin, listUsers)
adminRouter.get('/bookings', requireAdmin, listAdminBookings)
