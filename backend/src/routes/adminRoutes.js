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
const AdminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/adminAuthMiddleware');

const router = express.Router();
const ctrl = new AdminController();

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too many attempts, try again later' },
});

router.post('/login', adminLoginLimiter, ctrl.login.bind(ctrl));
router.get('/users', authenticateAdmin, ctrl.getUsers.bind(ctrl));
router.put('/users/:id', authenticateAdmin, ctrl.updateUser.bind(ctrl));
router.delete('/users/:id', authenticateAdmin, ctrl.deleteUser.bind(ctrl));
router.post('/users/:id/reset', authenticateAdmin, ctrl.resetUserData.bind(ctrl));
router.get('/users/:id/audit-config', authenticateAdmin, ctrl.getUserAuditConfig.bind(ctrl));
router.put('/users/:id/audit-config', authenticateAdmin, ctrl.setUserAuditConfig.bind(ctrl));

router.get('/audit-sets', authenticateAdmin, ctrl.getAuditSets.bind(ctrl));
router.post('/audit-sets', authenticateAdmin, ctrl.createAuditSet.bind(ctrl));
router.delete('/audit-sets/:id', authenticateAdmin, ctrl.deleteAuditSet.bind(ctrl));
router.post('/audit-sets/:id/questions', authenticateAdmin, ctrl.addAuditQuestion.bind(ctrl));
router.put('/audit-questions/:id', authenticateAdmin, ctrl.updateAuditQuestion.bind(ctrl));
router.delete('/audit-questions/:id', authenticateAdmin, ctrl.deleteAuditQuestion.bind(ctrl));

router.get('/tiers', authenticateAdmin, ctrl.getTiers.bind(ctrl));
router.put('/tiers/:type', authenticateAdmin, ctrl.updateTier.bind(ctrl));

router.put('/password', authenticateAdmin, ctrl.changePassword.bind(ctrl));

router.get('/invite-tokens', authenticateAdmin, ctrl.getInviteTokens.bind(ctrl));
router.post('/invite-tokens', authenticateAdmin, ctrl.createInviteToken.bind(ctrl));
router.delete('/invite-tokens/:id', authenticateAdmin, ctrl.deleteInviteToken.bind(ctrl));

module.exports = () => router;
