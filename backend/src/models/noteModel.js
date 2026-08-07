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

async function getNotesByUserId(userId) {
  return knex('notes').where({ user_id: userId }).orderBy('updated_at', 'desc');
}

async function getNoteById(id) {
  return knex('notes').where({ id }).first();
}

async function createNote(userId, title, body) {
  const [id] = await knex('notes').insert({ user_id: userId, title, body });
  return knex('notes').where({ id }).first();
}

async function updateNote(id, title, body) {
  await knex('notes').where({ id }).update({ title, body, updated_at: knex.fn.now() });
  return knex('notes').where({ id }).first();
}

async function deleteNote(id) {
  return knex('notes').where({ id }).delete();
}

module.exports = { getNotesByUserId, getNoteById, createNote, updateNote, deleteNote };
