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

const {
  getNotesByUserId,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} = require('../models/noteModel');

class NoteController {
  async getNotes(req, res) {
    try {
      const notes = await getNotesByUserId(req.user.sub);
      return res.json(notes);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async createNote(req, res) {
    try {
      const { title, body } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'title required' });
      const note = await createNote(req.user.sub, title.trim(), body ?? '');
      return res.status(201).json(note);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateNote(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const note = await getNoteById(id);
      if (!note) return res.status(404).json({ error: 'not found' });
      if (note.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      const { title, body } = req.body;
      if (!title?.trim()) return res.status(400).json({ error: 'title required' });
      const updated = await updateNote(id, title.trim(), body ?? '');
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteNote(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const note = await getNoteById(id);
      if (!note) return res.status(404).json({ error: 'not found' });
      if (note.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      await deleteNote(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = NoteController;
