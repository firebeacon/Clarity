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
const ConversationController = require('../controllers/conversationController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const controller = new ConversationController();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.post('/', controller.createConversation.bind(controller));
router.get('/', controller.getConversations.bind(controller));
router.get('/analytics', controller.getAnalytics.bind(controller));
router.get('/:id', controller.getConversation.bind(controller));
router.put('/:id', controller.updateConversation.bind(controller));
router.delete('/:id', controller.deleteConversation.bind(controller));

// Message routes
router.post('/:id/messages', controller.sendMessage.bind(controller));
router.post('/:id/inject-context', controller.injectContext.bind(controller));

// Seed routes
router.post('/:id/seed', controller.generateSeed.bind(controller));

// Archive routes
router.post('/:id/archive', controller.archiveConversation.bind(controller));

module.exports = router;
