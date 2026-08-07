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

async function createUser(email, passwordHash, username) {
  const [id] = await knex('users').insert({
    email,
    password_hash: passwordHash,
    username: username || email,
  });
  return getUserById(id);
}

const USER_FIELDS = [
  'id',
  'email',
  'username',
  'created_at',
  'phase',
  'account_type',
  'messages_remaining',
  'last_reset_date',
  'constraints',
  'goals',
];

function getUserByEmail(email) {
  return knex('users').where({ email }).select(USER_FIELDS).first();
}

function getUserByEmailForAuth(email) {
  return knex('users')
    .where({ email })
    .select([...USER_FIELDS, 'password_hash'])
    .first();
}

function getUserById(id) {
  return knex('users').where({ id }).select(USER_FIELDS).first();
}

async function updateUser(id, changes) {
  await knex('users').where({ id }).update(changes);
  return getUserById(id);
}

async function deleteUser(id) {
  return knex('users').where({ id }).del();
}

async function updateUserConstraints(id, constraints) {
  await knex('users').where({ id }).update({ constraints });
  return getUserById(id);
}

async function updateUserGoals(id, goals) {
  await knex('users').where({ id }).update({ goals });
  return getUserById(id);
}

async function updateUserPhase(id, phase) {
  await knex('users').where({ id }).update({ phase });
  return getUserById(id);
}

async function checkAndResetDailyQuota(userId) {
  const user = await getUserById(userId);
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  if (user.last_reset_date !== today) {
    const tier = await knex('account_tiers')
      .where({ type: user.account_type || 'free' })
      .first();
    const limit = tier?.daily_limit ?? 10;
    await knex('users')
      .where({ id: userId })
      .update({ messages_remaining: limit, last_reset_date: today });
    return { ...user, messages_remaining: limit, last_reset_date: today };
  }
  return user;
}

async function decrementMessagesRemaining(userId) {
  await knex('users').where({ id: userId }).decrement('messages_remaining', 1);
}

async function createInviteToken(token) {
  await knex('invite_tokens').insert({ token });
}

function getInviteToken(token) {
  return knex('invite_tokens').where({ token }).first();
}

async function useInviteToken(token, userId) {
  await knex('invite_tokens')
    .where({ token })
    .update({ used_by: userId, used_at: new Date().toISOString() });
}

function getInviteTokens() {
  return knex('invite_tokens').select('*').orderBy('created_at', 'desc');
}

async function deleteInviteToken(id) {
  return knex('invite_tokens').where({ id }).del();
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserByEmailForAuth,
  getUserById,
  updateUser,
  deleteUser,
  updateUserConstraints,
  updateUserGoals,
  updateUserPhase,
  checkAndResetDailyQuota,
  decrementMessagesRemaining,
  createInviteToken,
  getInviteToken,
  useInviteToken,
  getInviteTokens,
  deleteInviteToken,
};
