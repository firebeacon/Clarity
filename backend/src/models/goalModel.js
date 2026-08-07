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

async function getGoalsByUserId(userId) {
  const goals = await knex('goals').where({ user_id: userId }).orderBy('ordinal', 'asc');
  if (goals.length === 0) return [];
  const comments = await knex('goal_comments')
    .whereIn(
      'goal_id',
      goals.map((g) => g.id),
    )
    .orderBy('created_at', 'asc');
  return goals.map((g) => ({ ...g, comments: comments.filter((c) => c.goal_id === g.id) }));
}

async function getGoalById(id) {
  return knex('goals').where({ id }).first();
}

async function createGoal(userId, content) {
  const [row] = await knex('goals').where({ user_id: userId }).max('ordinal as max');
  const nextOrdinal = (row.max ?? -1) + 1;
  const [id] = await knex('goals').insert({ user_id: userId, content, ordinal: nextOrdinal });
  return { ...(await getGoalById(id)), comments: [] };
}

async function deleteGoal(id) {
  return knex('goals').where({ id }).del();
}

async function updateGoalOrdinals(updates) {
  for (const { id, ordinal } of updates) {
    await knex('goals').where({ id }).update({ ordinal });
  }
}

async function updateGoalContent(id, content) {
  await knex('goals').where({ id }).update({ content });
  return getGoalById(id);
}

async function addGoalComment(goalId, content) {
  const [id] = await knex('goal_comments').insert({ goal_id: goalId, content });
  return knex('goal_comments').where({ id }).first();
}

module.exports = {
  getGoalsByUserId,
  getGoalById,
  createGoal,
  deleteGoal,
  updateGoalOrdinals,
  updateGoalContent,
  addGoalComment,
};
