import { apiDelayMs } from '../config/constants.js'

export function sendError(res, status, message) {
  res.status(status).json({ message })
}

export function delay(ms = apiDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
