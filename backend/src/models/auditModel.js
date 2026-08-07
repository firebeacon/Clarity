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

// --- Question sets ---

async function getAllSets() {
  return knex('audit_question_sets').orderBy('created_at', 'asc');
}

async function getSetById(id) {
  return knex('audit_question_sets').where({ id }).first();
}

async function createSet(name) {
  const [id] = await knex('audit_question_sets').insert({ name });
  return getSetById(id);
}

async function deleteSet(id) {
  return knex('audit_question_sets').where({ id }).del();
}

// --- Questions ---

async function getQuestionsBySetId(setId) {
  return knex('audit_questions').where({ set_id: setId }).orderBy('ordinal', 'asc');
}

async function createQuestion(setId, type, text, answerType) {
  const [row] = await knex('audit_questions').where({ set_id: setId }).max('ordinal as max');
  const ordinal = (row.max ?? -1) + 1;
  const [id] = await knex('audit_questions').insert({
    set_id: setId,
    type,
    text,
    answer_type: answerType,
    ordinal,
  });
  return knex('audit_questions').where({ id }).first();
}

async function updateQuestion(id, changes) {
  await knex('audit_questions').where({ id }).update(changes);
  return knex('audit_questions').where({ id }).first();
}

async function deleteQuestion(id) {
  return knex('audit_questions').where({ id }).del();
}

// --- User audit config ---

async function getUserAuditConfig(userId) {
  return knex('user_audit_config').where({ user_id: userId }).first();
}

async function setUserAuditConfig(userId, setId, periodDays) {
  const existing = await getUserAuditConfig(userId);
  if (existing) {
    await knex('user_audit_config')
      .where({ user_id: userId })
      .update({ set_id: setId, period_days: periodDays });
  } else {
    await knex('user_audit_config').insert({
      user_id: userId,
      set_id: setId,
      period_days: periodDays,
    });
  }
  return getUserAuditConfig(userId);
}

// --- Audit sessions ---

async function getLatestSession(userId) {
  return knex('audit_sessions').where({ user_id: userId }).orderBy('completed_at', 'desc').first();
}

async function getSessionWithAnswers(sessionId) {
  const session = await knex('audit_sessions').where({ id: sessionId }).first();
  if (!session) return null;
  const answers = await knex('audit_answers')
    .join('audit_questions', 'audit_answers.question_id', 'audit_questions.id')
    .where('audit_answers.session_id', sessionId)
    .select(
      'audit_answers.*',
      'audit_questions.text as question_text',
      'audit_questions.type as question_type',
      'audit_questions.answer_type',
    )
    .orderBy('audit_questions.ordinal', 'asc');
  return { ...session, answers };
}

async function createSession(userId, analyticsSeed) {
  const [id] = await knex('audit_sessions').insert({
    user_id: userId,
    analytics_seed: analyticsSeed,
  });
  return knex('audit_sessions').where({ id }).first();
}

async function saveAnswers(sessionId, answers) {
  if (!answers.length) return;
  return knex('audit_answers').insert(
    answers.map((a) => ({
      session_id: sessionId,
      question_id: a.questionId,
      goal_id: a.goalId || null,
      goal_content: a.goalContent || null,
      answer_text: a.answerText || null,
      answer_scale: a.answerScale ?? null,
    })),
  );
}

module.exports = {
  getAllSets,
  getSetById,
  createSet,
  deleteSet,
  getQuestionsBySetId,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getUserAuditConfig,
  setUserAuditConfig,
  getLatestSession,
  getSessionWithAnswers,
  createSession,
  saveAnswers,
};
