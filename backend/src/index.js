// Copyright (C) 2026 Gregory Dott
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

const express = require('express');
const cors = require('cors');
const { init } = require('./db');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const goalRoutes = require('./routes/goalRoutes');
const configRoutes = require('./routes/configRoutes');
const adminRoutes = require('./routes/adminRoutes');
const auditRoutes = require('./routes/auditRoutes');
const seedRoutes = require('./routes/seedRoutes');
const plannerRoutes = require('./routes/plannerRoutes');
const noteRoutes = require('./routes/noteRoutes');
const config = require('./config/default');
const sanitize = require('./middlewares/sanitizeMiddleware');
const helmet = require('helmet');
const { scheduleDailyDigest } = require('./jobs/loginDigest');

const app = express();
const PORT = process.env.PORT || 3003;

// Trust the first hop proxy (e.g. reverse proxy/load balancer) so req.ip reflects
// the real client IP for rate limiting and login-attempt logging, not the proxy's IP.
if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());
app.use(sanitize);

// Initialize DB then start server
(async () => {
  try {
    await init();
    console.log('Database (sqlite) initialized');
  } catch (err) {
    console.error('DB init error', err);
    process.exit(1);
  }

  // Routes
  app.use('/api/users', userRoutes());
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/goals', goalRoutes());
  app.use('/api/config', configRoutes());
  app.use('/api/admin', adminRoutes());
  app.use('/api/audit', auditRoutes());
  app.use('/api/seeds', seedRoutes);
  app.use('/api/planner', plannerRoutes);
  app.use('/api/notes', noteRoutes());

  scheduleDailyDigest();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})();
