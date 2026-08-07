# Clarity Frontend

Angular 22 frontend for Clarity. Styled with Tailwind CSS.

## Setup

```bash
npm install
npm start
```

Runs on `http://localhost:4200`. Expects the backend at `http://localhost:3003`.

## Build

```bash
npm run build
```

Output goes to `dist/clarity/browser/`.

## Tests

Uses Vitest via the Angular test runner.

```bash
npm test
```

## Code style

```bash
npm run format
```

## Deployment

See `../deploy/deploy.sh`. The deploy script builds the frontend and rsyncs the output to the server.
