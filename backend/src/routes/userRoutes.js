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
const rateLimit = require('express-rate-limit');
const UserController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const userController = new UserController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many attempts, try again later' },
});

router.post('/register', authLimiter, userController.createUser.bind(userController));
router.post('/login', authLimiter, userController.loginUser.bind(userController));
router.get('/:id', authenticate, userController.getUser.bind(userController));
router.put('/:id', authenticate, userController.updateUser.bind(userController));
router.delete('/:id', authenticate, userController.deleteUser.bind(userController));

// Constraints routes (require authentication)
router.get('/constraints/me', authenticate, userController.getConstraints.bind(userController));
router.put('/constraints/me', authenticate, userController.updateConstraints.bind(userController));

// Goals routes (require authentication)
router.get('/goals/me', authenticate, userController.getGoals.bind(userController));
router.put('/goals/me', authenticate, userController.updateGoals.bind(userController));

// Phase routes (require authentication)
router.get('/phase/me', authenticate, userController.getPhase.bind(userController));
router.put('/phase/me', authenticate, userController.updatePhase.bind(userController));

module.exports = () => router;
