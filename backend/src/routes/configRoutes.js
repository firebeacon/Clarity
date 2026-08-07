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
const { knex } = require('../db');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/default-constraints', authenticate, async (req, res) => {
  try {
    const text = await knex('app_config').where({ key: 'default_constraints' }).first();
    const source = await knex('app_config').where({ key: 'default_constraints_source' }).first();
    return res.json({
      constraints: text?.value || '',
      source: source?.value || '',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
});

module.exports = () => router;
