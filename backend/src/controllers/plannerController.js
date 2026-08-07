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

const { knex } = require('../db');

class PlannerController {
  async getTasks(req, res) {
    try {
      const userId = req.user.sub;
      const { day } = req.query;
      let query = knex('planner_tasks').where({ user_id: userId });
      if (day !== undefined) {
        query = query.where({ day: day || null });
      }
      const tasks = await query.orderBy('sort_order').orderBy('created_at');
      return res.json(tasks);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async createTask(req, res) {
    try {
      const userId = req.user.sub;
      const { title, day, is_timed, start_time, end_time, sort_order, backlog } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: 'title required' });
      const [id] = await knex('planner_tasks').insert({
        user_id: userId,
        title: title.trim(),
        day: day || null,
        is_timed: is_timed ? 1 : 0,
        start_time: start_time || null,
        end_time: end_time || null,
        sort_order: sort_order || 0,
        backlog: backlog ? 1 : 0,
        completed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      const task = await knex('planner_tasks').where({ id }).first();
      return res.status(201).json(task);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateTask(req, res) {
    try {
      const userId = req.user.sub;
      const id = parseInt(req.params.id, 10);
      const task = await knex('planner_tasks').where({ id, user_id: userId }).first();
      if (!task) return res.status(404).json({ error: 'not found' });
      const allowed = [
        'title',
        'day',
        'is_timed',
        'start_time',
        'end_time',
        'sort_order',
        'completed',
        'comments',
        'backlog',
      ];
      const changes = { updated_at: new Date().toISOString() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          changes[key] = req.body[key];
        }
      }
      if ('day' in req.body && req.body.day === null) changes.day = null;
      await knex('planner_tasks').where({ id }).update(changes);
      const updated = await knex('planner_tasks').where({ id }).first();
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getWeekContext(req, res) {
    try {
      const userId = req.user.sub;
      const today = new Date();
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });

      const [unscheduled, scheduled] = await Promise.all([
        knex('planner_tasks')
          .where({ user_id: userId, completed: 0 })
          .whereNull('day')
          .orderBy('sort_order'),
        knex('planner_tasks')
          .where({ user_id: userId, completed: 0 })
          .whereIn('day', days)
          .orderBy('day')
          .orderBy('is_timed')
          .orderBy('start_time'),
      ]);

      if (!unscheduled.length && !scheduled.length) return res.json({ text: null });

      const lines = ['My task list:'];

      if (unscheduled.length) {
        lines.push('\nUnscheduled');
        for (const t of unscheduled) {
          lines.push(`  - ${t.title}`);
        }
      }

      const byDay = {};
      for (const t of scheduled) {
        if (!byDay[t.day]) byDay[t.day] = [];
        byDay[t.day].push(t);
      }
      const dayLabels = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      for (const day of days) {
        if (!byDay[day]) continue;
        const d = new Date(day + 'T00:00:00');
        lines.push(`\n${dayLabels[d.getDay()]} ${day}`);
        for (const t of byDay[day]) {
          const time = t.is_timed ? ` (${t.start_time}–${t.end_time})` : '';
          lines.push(`  - ${t.title}${time}`);
        }
      }
      return res.json({ text: lines.join('\n') });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteTask(req, res) {
    try {
      const userId = req.user.sub;
      const id = parseInt(req.params.id, 10);
      const task = await knex('planner_tasks').where({ id, user_id: userId }).first();
      if (!task) return res.status(404).json({ error: 'not found' });
      await knex('planner_tasks').where({ id }).delete();
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = PlannerController;
