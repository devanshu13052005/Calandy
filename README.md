# Calendly Clone

Full-stack scheduling app with an admin panel (event types, availability, meetings) and public booking pages.

## Stack

- **Frontend:** React (Vite), React Router, Axios, TailwindCSS
- **Backend:** Node.js, Express, PostgreSQL (`pg`)
- **Email:** Nodemailer (Gmail SMTP)
- **Deploy:** Vercel (client) + Render (server)

## Setup

### 1. Environment

Copy root `.env.example` to `.env` and fill in:

- `DATABASE_URL` — Supabase PostgreSQL connection string
- `GMAIL_USER` / `GMAIL_APP_PASS` — Google App Password for SMTP
- `APP_URL` — `http://localhost:5173` for local dev
- `PORT` — `5000`

Copy `client/.env.example` to `client/.env`:

- `VITE_API_URL=http://localhost:5000/api`
- `VITE_APP_URL=http://localhost:5173`

### 2. Database

```bash
cd server
npm install
npm run migrate
npm run seed
```

### 3. Run locally

```bash
# Terminal 1 — API
cd server && npm start

# Terminal 2 — Frontend
cd client && npm install && npm run dev
```

- Admin: http://localhost:5173/
- Public booking: http://localhost:5173/30-min-call

## Seed data

- User: John Doe (`john@example.com`)
- Event types: `15-min-chat`, `30-min-call`, `1-hour-session`
- Mon–Fri 9:00–17:00 availability
- Sample upcoming and past bookings

## Deploy

### Render (backend)

- Build: `cd server && npm install`
- Start: `node server.js`
- Set env vars from `.env.example`
- Run migrate/seed once via shell or release command

### Vercel (frontend)

- Root: `client`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_API_URL`, `VITE_APP_URL` (production URLs)

Update server `APP_URL` and CORS to match your Vercel domain.
