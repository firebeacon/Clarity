# Clarity

A tool for constrained, goal oriented conversations with LLMs using Claude API.
Set goals, define constraints, and have conversations that stay anchored.

## Structure

```
frontend/   Angular 22 app (Tailwind CSS)
backend/    Node.js/Express API (SQLite)
deploy/     Deployment scripts
```

## Running locally

**Backend**
```bash
cd backend
npm install
npm start        # http://localhost:3003
```

**Frontend**
```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

See `backend/README.md` and `frontend/README.md` for environment setup and further details.

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

