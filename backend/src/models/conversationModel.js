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

async function createConversation(userId, title) {
  const [id] = await knex('conversations').insert({
    user_id: userId,
    title: title || 'New Conversation',
  });
  return getConversationById(id);
}

function getConversationById(id) {
  return knex('conversations').where({ id }).first();
}

function getConversationsByUserId(userId) {
  return knex('conversations')
    .where({ user_id: userId, archived: false })
    .orderBy('updated_at', 'desc');
}

async function updateConversation(id, changes) {
  await knex('conversations')
    .where({ id })
    .update({
      ...changes,
      updated_at: knex.fn.now(),
    });
  return getConversationById(id);
}

async function deleteConversation(id) {
  return knex('conversations').where({ id }).del();
}

async function updateConversationSeed(id, seed) {
  await knex('conversations').where({ id }).update({
    seed,
    updated_at: knex.fn.now(),
  });
  return getConversationById(id);
}

async function archiveConversation(id) {
  await knex('conversations').where({ id }).update({
    archived: true,
    updated_at: knex.fn.now(),
  });
  return getConversationById(id);
}

async function getConversationsWithWordCounts(userId) {
  const conversations = await knex('conversations')
    .where({ user_id: userId, archived: false })
    .orderBy('created_at', 'asc')
    .select('id', 'created_at');

  if (!conversations.length) return [];

  const userMessages = await knex('messages')
    .whereIn(
      'conversation_id',
      conversations.map((c) => c.id),
    )
    .where('role', 'user')
    .select('conversation_id', 'content');

  const wordCountByConv = {};
  const exchangeCountByConv = {};
  userMessages.forEach((msg) => {
    const words = msg.content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    wordCountByConv[msg.conversation_id] = (wordCountByConv[msg.conversation_id] || 0) + words;
    exchangeCountByConv[msg.conversation_id] = (exchangeCountByConv[msg.conversation_id] || 0) + 1;
  });

  return conversations.map((c) => ({
    id: c.id,
    created_at: c.created_at,
    userWordCount: wordCountByConv[c.id] || 0,
    exchangeCount: exchangeCountByConv[c.id] || 0,
  }));
}

module.exports = {
  createConversation,
  getConversationById,
  getConversationsByUserId,
  updateConversation,
  deleteConversation,
  updateConversationSeed,
  archiveConversation,
  getConversationsWithWordCounts,
};
