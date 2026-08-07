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

function getAllUsers() {
  return knex('users')
    .select('id', 'email', 'phase', 'account_type', 'messages_remaining', 'created_at')
    .orderBy('created_at', 'asc');
}

async function updateUser(id, changes) {
  await knex('users').where({ id }).update(changes);
  return knex('users')
    .select('id', 'email', 'phase', 'account_type', 'messages_remaining', 'created_at')
    .where({ id })
    .first();
}

function deleteUser(id) {
  return knex('users').where({ id }).del();
}

async function resetUserData(id) {
  await knex('conversations').where({ user_id: id }).del();
  await knex('goals').where({ user_id: id }).del();
  await knex('users').where({ id }).update({ phase: 1, constraints: null });
}

module.exports = { getAllUsers, updateUser, deleteUser, resetUserData };
