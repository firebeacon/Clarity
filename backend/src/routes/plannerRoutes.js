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
const PlannerController = require('../controllers/plannerController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const ctrl = new PlannerController();

router.get('/tasks/week-context', authenticate, ctrl.getWeekContext.bind(ctrl));
router.get('/tasks', authenticate, ctrl.getTasks.bind(ctrl));
router.post('/tasks', authenticate, ctrl.createTask.bind(ctrl));
router.put('/tasks/:id', authenticate, ctrl.updateTask.bind(ctrl));
router.delete('/tasks/:id', authenticate, ctrl.deleteTask.bind(ctrl));

module.exports = router;
