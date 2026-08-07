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

const fs = require('fs');
const path = require('path');
const os = require('os');

const envPathFile = path.resolve(__dirname, '../../.env.path');
if (fs.existsSync(envPathFile)) {
  const envPath = fs.readFileSync(envPathFile, 'utf8').trim().replace(/^~/, os.homedir());
  process.loadEnvFile(path.resolve(envPath));
} else {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

module.exports = {
  db: {
    file: process.env.DB_FILE || path.resolve(__dirname, '../data/clarity.db'),
  },
  app: {
    port: process.env.PORT || 3003,
    secret:
      process.env.JWT_SECRET ||
      (() => {
        throw new Error('JWT_SECRET env var is required');
      })(),
  },
  claude: {
    apiKey:
      process.env.CLAUDE_API_KEY ||
      (() => {
        throw new Error('CLAUDE_API_KEY env var is required');
      })(),
  },
};
