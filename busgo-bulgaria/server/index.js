import 'dotenv/config'

import app from './app.js'

const isServerlessRuntime = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
const port = Number(process.env.PORT ?? 3001)

if (!isServerlessRuntime) {
  app.listen(port, () => {
    console.log(`BusGo API listening on http://localhost:${port}`)
  })
}

export default app
