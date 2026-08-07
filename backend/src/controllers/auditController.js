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
  getUserAuditConfig,
  getQuestionsBySetId,
  getLatestSession,
  getSessionWithAnswers,
  createSession,
  saveAnswers,
} = require('../models/auditModel');
const { getGoalsByUserId } = require('../models/goalModel');
const { knex } = require('../db');
const config = require('../config/default');

class AuditController {
  // GET /api/audit/due
  // Returns { due: bool, config: {...}, questions: [...], goals: [...] }
  async getDue(req, res) {
    try {
      const userId = req.user.sub;
      const auditConfig = await getUserAuditConfig(userId);

      if (!auditConfig || !auditConfig.set_id) {
        return res.json({ due: false });
      }

      const latestSession = await getLatestSession(userId);
      const user = await knex('users').where({ id: userId }).first();

      const periodMs = auditConfig.period_days * 24 * 60 * 60 * 1000;
      const referenceDate = latestSession
        ? new Date(
            latestSession.completed_at + (latestSession.completed_at.endsWith('Z') ? '' : 'Z'),
          )
        : new Date(user.created_at + (user.created_at.endsWith('Z') ? '' : 'Z'));

      const due = Date.now() - referenceDate.getTime() >= periodMs;
      const force = req.query.force === 'true';

      if (!due && !force) {
        return res.json({ due: false });
      }

      const questions = await getQuestionsBySetId(auditConfig.set_id);
      const goals = await getGoalsByUserId(userId);

      return res.json({
        due: true,
        config: auditConfig,
        questions,
        goals,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  // POST /api/audit/submit
  // Body: { answers: [{ questionId, goalId?, answerText?, answerScale? }] }
  async submit(req, res) {
    try {
      const userId = req.user.sub;
      const { answers } = req.body;
      if (!Array.isArray(answers)) {
        return res.status(400).json({ error: 'answers array required' });
      }

      // Fetch questions + goals to build the seed prompt
      const auditConfig = await getUserAuditConfig(userId);
      const questions = auditConfig?.set_id ? await getQuestionsBySetId(auditConfig.set_id) : [];
      const goals = await getGoalsByUserId(userId);

      const goalMap = new Map(goals.map((g) => [g.id, g.content]));
      const validQuestionIds = new Set(questions.map((q) => q.id));

      for (const a of answers) {
        if (a.goalId != null && !goalMap.has(a.goalId)) {
          return res.status(403).json({ error: 'forbidden' });
        }
        if (!validQuestionIds.has(a.questionId)) {
          return res.status(403).json({ error: 'forbidden' });
        }
      }

      const enrichedAnswers = answers.map((a) => ({
        ...a,
        goalContent: a.goalId ? goalMap.get(a.goalId) || null : null,
      }));

      const analyticsSeed = await this.generateAnalyticsSeed(questions, goals, answers);
      const session = await createSession(userId, analyticsSeed);
      await saveAnswers(session.id, enrichedAnswers);

      const full = await getSessionWithAnswers(session.id);
      return res.json(full);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  // GET /api/audit/latest
  async getLatest(req, res) {
    try {
      const userId = req.user.sub;
      const latest = await getLatestSession(userId);
      if (!latest) return res.json(null);
      const full = await getSessionWithAnswers(latest.id);
      return res.json(full);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async generateAnalyticsSeed(questions, goals, answers) {
    try {
      const answerMap = new Map(answers.map((a) => [`${a.questionId}_${a.goalId || ''}`, a]));

      const generalQs = questions.filter((q) => q.type === 'general');
      const goalQs = questions.filter((q) => q.type === 'goal');

      let context = 'The following is a self-audit completed by the user.\n\n';

      if (generalQs.length) {
        context += 'GENERAL QUESTIONS:\n';
        for (const q of generalQs) {
          const ans = answerMap.get(`${q.id}_`);
          const answerStr = ans
            ? q.answer_type === 'scale'
              ? `${ans.answerScale}/5`
              : ans.answerText || '(no answer)'
            : '(no answer)';
          context += `Q: ${q.text}\nA: ${answerStr}\n\n`;
        }
      }

      if (goalQs.length && goals.length) {
        context += 'GOAL-SPECIFIC QUESTIONS:\n';
        for (const goal of goals) {
          context += `\nGoal: "${goal.content}"\n`;
          for (const q of goalQs) {
            const ans = answerMap.get(`${q.id}_${goal.id}`);
            const answerStr = ans
              ? q.answer_type === 'scale'
                ? `${ans.answerScale}/5`
                : ans.answerText || '(no answer)'
              : '(no answer)';
            context += `Q: ${q.text}\nA: ${answerStr}\n`;
          }
        }
      }

      const prompt = `${context}\n\nThe above is a self-audit. Write a compact summary of what was reported. Report only what is there — do not infer, embellish, or impose structure beyond what the answers contain. If answers are sparse, negative, or mixed, reflect that accurately. No headers or formatting, just 2-4 sentences of plain prose.`;

      const auditSummarySysPrompt =
        'You are summarising a self-audit. Compress faithfully: report only what is in the source material. Do not infer progress or momentum beyond what is stated. Do not add framing that was not present in the answers. Do not flatter the input or the user.';

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.claude.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 512,
          system: auditSummarySysPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      if (data.content?.[0]?.text) return data.content[0].text;
      return context; // fallback to raw Q&A if Claude fails
    } catch (err) {
      console.error('Failed to generate analytics seed:', err);
      return null;
    }
  }
}

module.exports = AuditController;
