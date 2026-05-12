import { readDb } from '../models/database.js'
import { delay, sendError } from '../utils/http.js'

export async function createPayment(req, res, next) {
  try {
    await delay()
    const db = await readDb()
    const booking = db.bookings.find((item) => item.id === req.body.bookingId)
    if (!booking) {
      sendError(res, 404, 'Booking not found')
      return
    }
    if (req.user.role !== 'admin' && booking.userId !== req.user.id) {
      sendError(res, 403, 'You can only pay for your own booking')
      return
    }

    res.json({
      id: `pay-${Date.now()}`,
      bookingId: booking.id,
      createdAt: new Date().toISOString(),
      status: 'SUCCEEDED',
      method: req.body.method,
      amount: booking.total,
      provider: req.body.method === 'CARD' ? 'BusGoPay' : 'Cash',
      providerPaymentId: req.body.method === 'CARD' ? `pay_${Date.now()}` : undefined,
    })
  } catch (error) {
    next(error)
  }
}
