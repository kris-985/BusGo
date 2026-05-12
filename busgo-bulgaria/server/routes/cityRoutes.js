import { Router } from 'express'

import { listCities } from '../controllers/routeController.js'

export const cityRouter = Router()

cityRouter.get('/', listCities)
