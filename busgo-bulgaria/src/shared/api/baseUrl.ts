function devApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim()
  if (configuredUrl) return configuredUrl

  if (typeof window === 'undefined') return 'http://localhost:3001'

  const { hostname } = window.location
  const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])
  const apiHostname = localHostnames.has(hostname) ? 'localhost' : hostname

  return `${window.location.protocol}//${apiHostname}:3001`
}

export const apiBaseUrl = import.meta.env.PROD ? '' : devApiBaseUrl()
