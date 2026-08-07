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
const SeedController = require('../controllers/seedController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const controller = new SeedController();

router.use(authenticate);

// Packet routes (must come before /:id to avoid conflicts)
router.get('/packets', controller.listPackets.bind(controller));
router.post('/packets', controller.createPacket.bind(controller));
router.put('/packets/:id', controller.updatePacket.bind(controller));
router.delete('/packets/:id', controller.deletePacket.bind(controller));

// Seed routes
router.post('/consolidate', controller.consolidateSeeds.bind(controller));
router.get('/', controller.listSeeds.bind(controller));
router.put('/:id', controller.updateSeed.bind(controller));
router.delete('/:id', controller.deleteSeed.bind(controller));
router.post('/:id/compress', controller.compressSeed.bind(controller));

module.exports = router;
