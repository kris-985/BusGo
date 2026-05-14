# BusGo Bulgaria

BusGo Bulgaria is a web application for searching bus trips, selecting seats, and booking intercity travel across Bulgaria. The project includes a React frontend, an Express API, JWT authentication, MongoDB persistence, and a Netlify serverless adapter for deployment.

## Features

- Search bus routes by origin, destination, and travel date
- View trip details with schedule, pricing, and seat availability
- Interactive seat selection
- User registration, login, and protected account pages
- Booking creation and booking history
- Simulated payment confirmation flow
- User profile and "My Bookings" page
- Admin dashboard for routes, users, and bookings
- REST API with `user` and `admin` roles
- Serverless deployment support through Netlify Functions

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- TanStack React Query
- Zustand
- Tailwind CSS
- Axios

### Backend

- Node.js 20+
- Express 5
- MongoDB
- JWT
- bcryptjs
- serverless-http

## Project Structure

```text
.
|-- busgo-bulgaria/
|   |-- api/                    # Serverless API entry
|   |-- netlify/functions/       # Netlify Functions adapter
|   |-- public/                  # Static assets
|   |-- server/                  # Express API
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- utils/
|   `-- src/                     # React application
|       |-- app/
|       |-- entities/
|       |-- features/
|       |-- pages/
|       `-- shared/
|-- netlify.toml                 # Netlify build, functions, and redirects
|-- package.json                 # Root workspace scripts
`-- package-lock.json
```

## Requirements

- Node.js `>=20`
- npm
- MongoDB instance, local or cloud-hosted

## Environment Configuration

Copy the example environment file:

```bash
cd busgo-bulgaria
cp .env.example .env
```

Fill in the required values:

```env
VITE_API_URL=http://localhost:3001
PORT=3001
MONGODB_URI=mongodb+srv://USER:PASSWORD@HOST/?appName=Cluster0
MONGODB_DB=busgo
JWT_SECRET=change-this-secret
ADMIN_EMAIL=admin@busgo.bg
ADMIN_PASSWORD=change-this-password
```

Environment variables:

- `VITE_API_URL` - backend API URL used by the frontend in development
- `PORT` - Express server port
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB` - MongoDB database name
- `JWT_SECRET` - secret used to sign JWT tokens
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` - initial administrator account credentials

On first startup, the backend creates the required MongoDB indexes, seeds initial route data from `server/db.json` when the routes collection is empty, and creates an admin user if one does not already exist.

## Installation

From the repository root:

```bash
npm install
```

## Running Locally

Start the API server:

```bash
npm run server
```

In a separate terminal, start the frontend application:

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

## Available Scripts

From the repository root:

```bash
npm run dev       # Start the Vite dev server
npm run server    # Start the Express API
npm run build     # Run TypeScript build and Vite production build
```

From `busgo-bulgaria/`:

```bash
npm run dev       # Start the Vite dev server
npm run server    # Start the Express API
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

## Application Routes

- `/` - home page
- `/about` - project information
- `/login` - login and registration
- `/search-results` - trip search results
- `/seat-selection/:tripId` - seat selection
- `/checkout` - booking checkout
- `/success/:bookingId` - successful booking confirmation
- `/my-bookings` - current user's bookings
- `/profile` - user profile
- `/admin` - admin dashboard

## REST API

Development base URL: `http://localhost:3001`

### Public Endpoints

```http
GET  /health
GET  /cities
GET  /routes
GET  /routes/search?from=Sofia&to=Plovdiv&date=2026-05-14
GET  /routes/:id
GET  /routes/:id/seats
GET  /seats/occupancy
POST /auth/signup
POST /auth/login
```

### Authenticated Endpoints

Require `Authorization: Bearer <token>`.

```http
GET  /auth/me
GET  /bookings
POST /bookings
GET  /bookings/:id
POST /payments
```

### Admin Endpoints

Require an admin user.

```http
GET  /admin/routes
GET  /admin/users
GET  /admin/bookings
POST /routes
```

## Deployment

The project is configured for Netlify:

- Build command: `npm --workspace busgo-bulgaria run build`
- Publish directory: `busgo-bulgaria/dist`
- Functions directory: `busgo-bulgaria/netlify/functions`
- Node version: `20`

`netlify.toml` includes redirects that route API requests to `/.netlify/functions/api` and frontend routes to `index.html`.

For production deployment, configure these environment variables in Netlify:

- `MONGODB_URI`
- `MONGODB_DB`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`, if you want to restrict the allowed origin

## Data and Persistence

The backend uses MongoDB as the primary persistence layer. The `server/db.json` file is used as seed data for initial routes and bookings when the database is empty.

Stored data includes:

- `routes` - routes, schedules, prices, seats, and occupied seats
- `bookings` - reservations, passengers, contact details, and total price
- `users` - users, roles, and bcrypt password hashes

## Security

- Passwords are stored as bcrypt hashes
- Protected endpoints use JWT bearer authentication
- Admin endpoints require the `admin` role
- Use a strong `JWT_SECRET` in production
- Do not commit `.env` files or real credentials

## Pre-release Checks

```bash
npm --workspace busgo-bulgaria run lint
npm run build
```

## License

This project is private and does not define a public license.
