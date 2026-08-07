# Clarity Backend

Node.js/Express API server for Clarity. Uses SQLite via Knex.

## Requirements

- Node.js
- The following environment variables must be set:
  - `JWT_SECRET` — used to sign and verify auth tokens
  - `CLAUDE_API_KEY` — Anthropic API key for conversation requests

Set these in a `.env` file in the backend directory, or point to one via `.env.path`.

## Setup

```bash
npm install
npm start
```

Runs on port 3003 by default. Set `PORT` to override.

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | | Register (requires invite token) |
| POST | `/api/users/login` | | Login |
| GET | `/api/users/:id` | yes | Get user |
| PUT | `/api/users/:id` | yes | Update user |
| DELETE | `/api/users/:id` | yes | Delete user |
| GET/PUT | `/api/users/constraints/me` | yes | User constraints |
| GET/PUT | `/api/users/phase/me` | yes | Onboarding phase |
| GET/POST/PUT/DELETE | `/api/goals/*` | yes | Goals |
| GET/POST/PUT/DELETE | `/api/conversations/*` | yes | Conversations and messages |
| GET/POST/PUT/DELETE | `/api/seeds/*` | yes | Seed bank |
| GET/POST/PUT/DELETE | `/api/planner/*` | yes | Planner tasks |
| GET/POST/PUT/DELETE | `/api/notes/*` | yes | Notes |
| GET/POST | `/api/audit/*` | yes | Audit sessions |
| GET | `/api/config/default-constraints` | yes | Default constraints |
| * | `/api/admin/*` | admin | Admin routes |

## Tests

```bash
npm test
```

## Code style

```bash
npm run format
```

## Deployment

See `../deploy/deploy.sh`. The deploy script syncs the backend to the server and restarts the PM2 process.
