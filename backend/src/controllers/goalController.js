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
  getGoalsByUserId,
  getGoalById,
  createGoal,
  deleteGoal,
  updateGoalOrdinals,
  updateGoalContent,
  addGoalComment,
} = require('../models/goalModel');

class GoalController {
  async getGoals(req, res) {
    try {
      const goals = await getGoalsByUserId(req.user.sub);
      return res.json(goals);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async addGoal(req, res) {
    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'content required' });
      const goal = await createGoal(req.user.sub, content.trim());
      return res.status(201).json(goal);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteGoal(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const goal = await getGoalById(id);
      if (!goal) return res.status(404).json({ error: 'not found' });
      if (goal.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      await deleteGoal(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async reorderGoals(req, res) {
    try {
      const { updates } = req.body; // [{id, ordinal}]
      if (!Array.isArray(updates)) return res.status(400).json({ error: 'updates array required' });
      for (const { id } of updates) {
        const goal = await getGoalById(id);
        if (!goal || goal.user_id !== req.user.sub)
          return res.status(403).json({ error: 'forbidden' });
      }
      await updateGoalOrdinals(updates);
      return res.json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateGoal(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'content required' });
      const goal = await getGoalById(id);
      if (!goal) return res.status(404).json({ error: 'not found' });
      if (goal.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      const updated = await updateGoalContent(id, content.trim());
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async addComment(req, res) {
    try {
      const goalId = parseInt(req.params.id, 10);
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'content required' });
      const goal = await getGoalById(goalId);
      if (!goal) return res.status(404).json({ error: 'not found' });
      if (goal.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      const comment = await addGoalComment(goalId, content.trim());
      return res.status(201).json(comment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = GoalController;
