import { Router } from 'express'

import { createRoute, listRoutes, routeById, routeSeats, searchRoutes } from '../controllers/routeController.js'
import { requireAdmin } from '../middleware/auth.js'

export const routeRouter = Router()

routeRouter.get('/', listRoutes)
routeRouter.post('/', requireAdmin, createRoute)
routeRouter.get('/search', searchRoutes)
routeRouter.get('/:id', routeById)
routeRouter.get('/:id/seats', routeSeats)
