import { Router } from 'express'

import { seatOccupancy } from '../controllers/adminController.js'

export const seatRouter = Router()

seatRouter.get('/occupancy', seatOccupancy)
