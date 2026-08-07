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

async function createSeed(userId, title, content, packetId = null) {
  const [id] = await knex('seeds').insert({ user_id: userId, title, content, packet_id: packetId });
  return getSeedById(id);
}

function getSeedById(id) {
  return knex('seeds').where({ id }).first();
}

function getSeedsByUserId(userId) {
  return knex('seeds').where({ user_id: userId, archived: false }).orderBy('created_at', 'desc');
}

async function archiveAllSeeds(userId) {
  return knex('seeds').where({ user_id: userId, archived: false }).update({ archived: true });
}

async function archiveSeeds(userId, ids) {
  return knex('seeds')
    .where({ user_id: userId, archived: false })
    .whereIn('id', ids)
    .update({ archived: true });
}

function getSeedsByIds(userId, ids) {
  return knex('seeds')
    .where({ user_id: userId, archived: false })
    .whereIn('id', ids)
    .orderBy('created_at', 'desc');
}

async function updateSeed(id, changes) {
  await knex('seeds')
    .where({ id })
    .update({ ...changes, updated_at: knex.fn.now() });
  return getSeedById(id);
}

async function deleteSeed(id) {
  return knex('seeds').where({ id }).del();
}

async function createPacket(userId, name) {
  const [id] = await knex('seed_packets').insert({ user_id: userId, name });
  return getPacketById(id);
}

function getPacketById(id) {
  return knex('seed_packets').where({ id }).first();
}

function getPacketsByUserId(userId) {
  return knex('seed_packets').where({ user_id: userId }).orderBy('created_at', 'asc');
}

async function updatePacket(id, name) {
  await knex('seed_packets').where({ id }).update({ name });
  return getPacketById(id);
}

async function deletePacket(id) {
  await knex('seeds').where({ packet_id: id }).update({ packet_id: null });
  return knex('seed_packets').where({ id }).del();
}

module.exports = {
  createSeed,
  getSeedById,
  getSeedsByUserId,
  updateSeed,
  deleteSeed,
  archiveAllSeeds,
  archiveSeeds,
  getSeedsByIds,
  createPacket,
  getPacketById,
  getPacketsByUserId,
  updatePacket,
  deletePacket,
};
