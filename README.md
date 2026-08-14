# Clarity

A tool for constrained, goal oriented conversations with LLMs using Claude API.
Set goals, define constraints, and have conversations that stay anchored.

This software is in development and is by no means finished. Features may be incomplete, broken, or subject to significant change. Use with caution.

## Clanker Scepticism Clause

Be incredibly wary of what information you share with the application. The general suggestion is to use this for managing mundane issues. The people who run
the big AI companies are absolutely exploiting your data for profit. Every message you type ends up on their server and almost certainly becomes part
of a new training data set and probably some sort of profile.

## Structure

```
frontend/   Angular 22 app (Tailwind CSS)
backend/    Node.js/Express API (SQLite)
deploy/     Deployment scripts
```

## Running locally

See `backend/README.md` and `frontend/README.md` for further details relating to each.

## Environment setup

Before starting the backend, create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Then set the required values:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Strong random secret used to sign auth tokens |
| `CLAUDE_API_KEY` | Anthropic API key |
| `DB_FILE` | Path to the SQLite database file (default: `./data/clarity.db`) |
| `PORT` | Port to listen on (default: `3003`) |
| `NODE_ENV` | `development` or `production` |

Optionally, the Mailgun variables (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`) enable login alert emails. `TRUST_PROXY=1` should be set when running behind a reverse proxy.

### Storing .env outside the project

If you prefer to keep the `.env` file outside the project directory (e.g. for security on a server, or if an LLM has access to your work locally and you don't want anything critical getting leaked to the server it speaks to), create `backend/.env.path` containing the absolute path to it:

```
~/path/to/your/.env
```

The backend will read that path and load the file from there instead.

**Start Backend**
```bash
cd backend
npm install
npm start        # http://localhost:3003
```

**Start Frontend**
```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

## Seeding an admin user

Before any user accounts can be created, an admin must exist to generate invite tokens. There is no API for this — seed one directly into the database.

Start the backend at least once first so the database and tables are initialised, then run this from the `backend` directory:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { knex, init } = require('./src/db');
const EMAIL = 'your@email.com';
const PASSWORD = 'yourpassword';
(async () => {
  await init();
  const hash = await bcrypt.hash(PASSWORD, 10);
  await knex('admin_users').insert({ email: EMAIL, password_hash: hash });
  console.log('Admin created:', EMAIL);
  await knex.destroy();
})();
"
```

Then log in at `/admin/login` to generate invite tokens for user registration.

## Configuring audits

Periodic audits won't trigger for a user until an audit question set has been created and assigned to them. Both steps are done through the admin panel at `/admin/users`.

1. Create a question set and add questions to it. Questions have a type (`general` or `goal`) and an answer type (`text` or `scale`).
2. Assign the set to a user along with a period in days (how often the audit recurs).

## Deployment

```bash
./deploy/deploy.sh
```

Requires a configured `deploy/.env`. See `deploy/.env.example`.

## Code style

Prettier is used for formatting across both frontend and backend. Run `npm run format` from either directory to format that part of the codebase.

## License

GNU Affero General Public License v3.0 or later. See `LICENSE`.
Copyright (C) 2026 Gregory Dott.

