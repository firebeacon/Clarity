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
const NoteController = require('../controllers/noteController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();
const ctrl = new NoteController();

router.get('/me', authenticate, ctrl.getNotes.bind(ctrl));
router.post('/me', authenticate, ctrl.createNote.bind(ctrl));
router.put('/:id', authenticate, ctrl.updateNote.bind(ctrl));
router.delete('/:id', authenticate, ctrl.deleteNote.bind(ctrl));

module.exports = () => router;
