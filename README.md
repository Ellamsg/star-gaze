# my-website

Full-stack starter with a Next.js frontend and an Express backend.

```
my-website/
├── frontend/   Next.js 16 + TypeScript + Tailwind CSS v4 (App Router, src/ dir)
└── backend/    Node + Express + TypeScript (REST API)
```

## Requirements

- Node.js 20+ (built with v22)

## Getting started

Install dependencies once per project:

```bash
cd frontend && npm install
cd ../backend && npm install
```

Then run each in its own terminal.

### Frontend

```bash
cd frontend
npm run dev
```

Runs on http://localhost:3000

### Backend

```bash
cd backend
npm run dev
```

Runs on http://localhost:4000

## API

| Method | Endpoint      | Description           |
| ------ | ------------- | --------------------- |
| GET    | `/api/health` | Health check + uptime |
| GET    | `/api/hello`  | Sample JSON response  |

Test it:

```bash
curl http://localhost:4000/api/health
```

## Calling the API from the frontend

The backend allows browser requests from `http://localhost:3000` (see `backend/.env`).
Create `frontend/.env.local` to point the frontend at it:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Then in a component:

```tsx
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hello`);
const data = await res.json();
```

## Backend scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start with hot reload (tsx watch)    |
| `npm run build`     | Compile TypeScript to `dist/`        |
| `npm start`         | Run the compiled build               |
| `npm run typecheck` | Type-check without emitting files    |

## Environment variables

Backend (`backend/.env`, see `.env.example`):

| Variable      | Default                 | Description                       |
| ------------- | ----------------------- | --------------------------------- |
| `PORT`        | `4000`                  | Port the API listens on           |
| `NODE_ENV`    | `development`           | Runtime environment               |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated allowed origins   |
