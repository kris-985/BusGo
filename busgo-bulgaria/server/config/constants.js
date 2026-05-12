export const currency = 'BGN'

export const operator = { id: 'op-busgo', name: 'BusGo Bulgaria' }

export const cityIdByName = new Map([
  ['Sofia', 'sof'],
  ['Plovdiv', 'pld'],
  ['Varna', 'var'],
  ['Burgas', 'bgs'],
  ['Stara Zagora', 'szg'],
])

export const cityOrder = ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora']

export const cityCoordinates = new Map([
  ['Sofia', { lat: 42.6977, lon: 23.3219 }],
  ['Plovdiv', { lat: 42.1354, lon: 24.7453 }],
  ['Varna', { lat: 43.2141, lon: 27.9147 }],
  ['Burgas', { lat: 42.5048, lon: 27.4626 }],
  ['Stara Zagora', { lat: 42.4258, lon: 25.6345 }],
])

export const distanceByRoute = new Map([
  ['Sofia-Plovdiv', 146],
  ['Plovdiv-Sofia', 146],
  ['Sofia-Varna', 470],
  ['Varna-Sofia', 470],
  ['Plovdiv-Burgas', 253],
  ['Burgas-Plovdiv', 253],
  ['Varna-Burgas', 133],
  ['Burgas-Varna', 133],
  ['Sofia-Stara Zagora', 231],
  ['Stara Zagora-Sofia', 231],
])

export const apiDelayMs = Number(process.env.API_DELAY_MS ?? 500)
