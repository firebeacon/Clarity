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

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const {
  createConversation,
  getConversationById,
  getConversationsByUserId,
  updateConversation,
  deleteConversation,
  updateConversationSeed,
  archiveConversation,
  getConversationsWithWordCounts,
} = require('../models/conversationModel');
const { createMessage, getMessagesByConversationId } = require('../models/messageModel');
const { getLatestSession } = require('../models/auditModel');
const { createSeed } = require('../models/seedModel');
const {
  checkAndResetDailyQuota,
  decrementMessagesRemaining,
  getUserById,
} = require('../models/userModel');
const config = require('../config/default');

function wrapSessionIntent(rawText) {
  return `[Session Intent]: ${rawText}\n\nIf the conversation drifts from this stated intent for more than 2-3 exchanges, surface it explicitly rather than silently following the drift. Ask whether to redirect back to the intent or to formally update it — if updated, the new statement becomes the anchor going forward.`;
}

class ConversationController {
  async createConversation(req, res) {
    try {
      const userId = req.user.sub;
      const { title } = req.body;
      const conversation = await createConversation(userId, title);
      return res.status(201).json(conversation);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getConversations(req, res) {
    try {
      const userId = req.user.sub;
      const conversations = await getConversationsByUserId(userId);
      return res.json(conversations);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getConversation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const conversation = await getConversationById(id);
      if (!conversation) return res.status(404).json({ error: 'not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      const messages = await getMessagesByConversationId(id);
      return res.json({ ...conversation, messages });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async sendMessage(req, res) {
    try {
      const conversationId = parseInt(req.params.id, 10);
      const { content, role: requestedRole } = req.body;

      if (!content) return res.status(400).json({ error: 'content required' });

      const conversation = await getConversationById(conversationId);
      if (!conversation) return res.status(404).json({ error: 'conversation not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      const savedRole = [
        'constraints',
        'goals',
        'seed-context',
        'audit-context',
        'planner-context',
        'session-intent',
      ].includes(requestedRole)
        ? requestedRole
        : 'user';

      // Only check and decrement quota for real user messages
      if (savedRole === 'user') {
        const user = await checkAndResetDailyQuota(req.user.sub);
        if (!user) return res.status(404).json({ error: 'user not found' });
        if ((user.messages_remaining ?? 0) <= 0) {
          return res
            .status(429)
            .json({ error: 'Daily message limit reached. Your messages will reset tomorrow.' });
        }
      }

      // Get conversation history BEFORE storing the new message
      const existingMessages = await getMessagesByConversationId(conversationId);

      // Inject audit seed into context for every message — always use the latest.
      // Skip when we're explicitly applying audit-context (the seed is the message being sent, injecting would duplicate it).
      if (savedRole !== 'audit-context') {
        const latestAudit = await getLatestSession(req.user.sub);
        if (latestAudit?.analytics_seed) {
          const summaryDate = new Date(latestAudit.completed_at).toLocaleDateString('en-CA');
          const todayDate = new Date().toLocaleDateString('en-CA');
          const auditMsg = {
            role: 'audit-context',
            content: `The following is a summary providing extra context on the current state of my activities and progress. It was made on ${summaryDate}. Today's date is ${todayDate}. Use it as background context for this conversation:\n\n${latestAudit.analytics_seed}`,
          };
          const existingAuditIdx = existingMessages.findIndex((m) => m.role === 'audit-context');
          if (existingAuditIdx >= 0) {
            existingMessages[existingAuditIdx] = auditMsg;
          } else {
            const lastGoalsIdx = existingMessages.reduce(
              (idx, msg, i) => (msg.role === 'goals' ? i : idx),
              -1,
            );
            if (lastGoalsIdx >= 0) {
              existingMessages.splice(lastGoalsIdx + 1, 0, auditMsg);
            } else {
              existingMessages.unshift(auditMsg);
            }
          }
        }
      }

      // Inject upcoming week's planner tasks whenever goals are present in the conversation.
      // Refreshed on every send so the context always reflects the current task list.
      const hasGoals = existingMessages.some((m) => m.role === 'goals') || savedRole === 'goals';
      if (hasGoals && savedRole !== 'planner-context') {
        const plannerText = await this.buildPlannerContext(req.user.sub);
        if (plannerText) {
          const plannerMsg = { role: 'planner-context', content: plannerText };
          const existingPlannerIdx = existingMessages.findIndex(
            (m) => m.role === 'planner-context',
          );
          if (existingPlannerIdx >= 0) {
            existingMessages[existingPlannerIdx] = plannerMsg;
          } else {
            const lastGoalsIdx = existingMessages.reduce(
              (idx, msg, i) => (msg.role === 'goals' ? i : idx),
              -1,
            );
            if (lastGoalsIdx >= 0) {
              existingMessages.splice(lastGoalsIdx + 1, 0, plannerMsg);
            } else {
              existingMessages.push(plannerMsg);
            }
          }
        }
      }

      // For seed-context, stamp with both the seed's original creation time (from the
      // seed bank DB record) and the current insertion time, so the model has full temporal context.
      let messageContent = content;
      if (savedRole === 'seed-context') {
        const appliedAt = new Date().toISOString();
        const { seed_created_at } = req.body;
        let generatedLine = '';
        if (seed_created_at) {
          // SQLite stores timestamps as "YYYY-MM-DD HH:MM:SS" without timezone.
          // Normalize to ISO 8601 UTC before parsing so Node.js doesn't treat it as local time.
          const normalized =
            seed_created_at.endsWith('Z') || seed_created_at.includes('+')
              ? seed_created_at
              : seed_created_at.replace(' ', 'T') + 'Z';
          const genDate = new Date(normalized);
          if (!isNaN(genDate.getTime())) {
            generatedLine = `[Seed generated: ${genDate.toISOString()}]\n`;
          }
        }
        messageContent = `${generatedLine}[Seed applied to conversation: ${appliedAt}]\n[Context: Historical state from sessions prior to the generation date above — not events from today]\n\n${content}`;
      } else if (savedRole === 'session-intent') {
        messageContent = wrapSessionIntent(content);
      }

      // Store user message (with special role if applicable)
      const userMessage = await createMessage(conversationId, savedRole, messageContent);

      // Call Claude API with existing messages + new content
      const claudeResponse = await this.callClaudeAPI(messageContent, existingMessages);

      // Store Claude's response
      const assistantMessage = await createMessage(conversationId, 'assistant', claudeResponse);

      let messagesRemaining;
      if (savedRole === 'user') {
        await decrementMessagesRemaining(req.user.sub);
        const updatedUser = await getUserById(req.user.sub);
        messagesRemaining = updatedUser?.messages_remaining ?? 0;
      }

      // Update conversation timestamp
      await updateConversation(conversationId, {});

      return res.json({
        userMessage,
        assistantMessage,
        ...(messagesRemaining !== undefined ? { messagesRemaining } : {}),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async injectContext(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await getConversationById(conversationId);
      if (!conversation) return res.status(404).json({ error: 'not found' });
      if (conversation.user_id !== req.user.sub)
        return res.status(403).json({ error: 'forbidden' });

      const { blocks } = req.body;
      if (!Array.isArray(blocks) || blocks.length === 0) {
        return res.status(400).json({ error: 'blocks array required' });
      }

      const CONTEXT_ROLES = [
        'constraints',
        'goals',
        'seed-context',
        'audit-context',
        'planner-context',
        'session-intent',
      ];
      const savedMessages = [];

      for (const block of blocks) {
        if (!CONTEXT_ROLES.includes(block.role)) continue;
        let content = block.content;
        if (block.role === 'seed-context' && block.seed_created_at) {
          const appliedAt = new Date().toISOString();
          const normalized =
            block.seed_created_at.endsWith('Z') || block.seed_created_at.includes('+')
              ? block.seed_created_at
              : block.seed_created_at.replace(' ', 'T') + 'Z';
          const genDate = new Date(normalized);
          const generatedLine = !isNaN(genDate.getTime())
            ? `[Seed generated: ${genDate.toISOString()}]\n`
            : '';
          content = `${generatedLine}[Seed applied to conversation: ${appliedAt}]\n[Context: Historical state from sessions prior to the generation date above — not events from today]\n\n${block.content}`;
        } else if (block.role === 'session-intent') {
          content = wrapSessionIntent(block.content);
        }
        const saved = await createMessage(conversationId, block.role, content);
        savedMessages.push(saved);
      }

      const claudeResponse = await this.callClaudeAPI(
        'Please briefly acknowledge this context.',
        savedMessages,
      );
      const assistantMessage = await createMessage(conversationId, 'assistant', claudeResponse);
      await updateConversation(conversationId, {});

      return res.json({ messages: savedMessages, assistantMessage });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async callClaudeAPI(content, existingMessages, systemPrompt = null) {
    try {
      console.log('Making Claude API request with model: claude-sonnet-4-6');

      const CONTEXT_ROLES = new Set([
        'constraints',
        'goals',
        'seed-context',
        'audit-context',
        'planner-context',
        'session-intent',
      ]);
      const CONTEXT_LABELS = {
        constraints: 'Constraints',
        goals: 'Goals',
        'seed-context': 'Conversation Seed',
        'audit-context': 'Activity Summary',
        'planner-context': 'Task List',
        'session-intent': 'Session Intent',
      };

      const filtered = existingMessages.filter((msg) =>
        ['user', 'assistant', ...CONTEXT_ROLES].includes(msg.role),
      );

      // Split into leading context block and the rest of the conversation.
      // Any context messages that appear after real conversation has started
      // are mid-conversation injections and stay in place as individual messages.
      let splitIdx = 0;
      while (splitIdx < filtered.length && CONTEXT_ROLES.has(filtered[splitIdx].role)) {
        splitIdx++;
      }

      const leadingContext = filtered.slice(0, splitIdx);
      const conversationTail = filtered.slice(splitIdx);

      const assembledMessages = [];

      if (leadingContext.length > 0) {
        const preamble = leadingContext
          .map((msg) => `## ${CONTEXT_LABELS[msg.role] || msg.role}\n\n${msg.content}`)
          .join('\n\n---\n\n');
        assembledMessages.push({ role: 'user', content: preamble });
      }

      for (const msg of conversationTail) {
        assembledMessages.push({
          role: CONTEXT_ROLES.has(msg.role) ? 'user' : msg.role,
          content: msg.content,
        });
      }

      assembledMessages.push({ role: 'user', content: content });

      const body = {
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: assembledMessages,
      };

      if (systemPrompt) body.system = systemPrompt;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.claude.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Claude API error: ${response.status} - ${data.error?.message || 'Unknown error'}`,
        );
      }

      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      } else {
        throw new Error('Unexpected response format from Claude API');
      }
    } catch (err) {
      console.error('Claude API error:', err);
      throw err;
    }
  }

  async buildPlannerContext(userId) {
    const { knex } = require('../db');
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

    if (!unscheduled.length && !scheduled.length) return null;

    const lines = ['The following is my task list. Use it as background context:'];

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
      const label = `${dayLabels[d.getDay()]} ${day}`;
      lines.push(`\n${label}`);
      for (const t of byDay[day]) {
        const time = t.is_timed ? ` (${t.start_time}–${t.end_time})` : '';
        lines.push(`  - ${t.title}${time}`);
      }
    }

    return lines.join('\n');
  }

  async updateConversation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { title } = req.body;

      if (!title) return res.status(400).json({ error: 'title required' });

      const conversation = await getConversationById(id);
      if (!conversation) return res.status(404).json({ error: 'not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      const updatedConversation = await updateConversation(id, { title });
      return res.json(updatedConversation);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteConversation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const conversation = await getConversationById(id);
      if (!conversation) return res.status(404).json({ error: 'not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      await deleteConversation(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async generateSeed(req, res) {
    try {
      const conversationId = parseInt(req.params.id, 10);

      const conversation = await getConversationById(conversationId);
      if (!conversation) return res.status(404).json({ error: 'conversation not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      // Get conversation history, excluding dynamic background context from the seed summary.
      // audit-context and planner-context are refreshed automatically each conversation.
      // constraints and goals are kept visible so the LLM can tell what's already established,
      // but it is instructed not to reproduce them in the seed (see system prompt below).
      const existingMessages = await getMessagesByConversationId(conversationId);
      const messagesForSeed = existingMessages.filter(
        (m) => !['audit-context', 'planner-context'].includes(m.role),
      );

      // Fetch current planner tasks so the LLM knows what is already tracked
      const { knex } = require('../db');
      const allTasks = await knex('planner_tasks')
        .where({ user_id: req.user.sub, completed: 0 })
        .orderBy('day')
        .orderBy('start_time');

      const trackedSection =
        allTasks.length > 0
          ? `\n\nCurrently tracked tasks (do NOT propose these again):\n${allTasks
              .map((t) => {
                const loc = t.day
                  ? t.is_timed
                    ? ` (${t.day} ${t.start_time}–${t.end_time})`
                    : ` (${t.day})`
                  : ' (unscheduled)';
                return `- ${t.title}${loc}`;
              })
              .join('\n')}`
          : '\n\nCurrently tracked tasks: none';

      const seedSystemPrompt = `Output the raw seed content — a compact summary of the conversation state. No headers, labels, preamble, or formatting wrappers. Just the content itself.

The following are automatically injected at the start of every conversation and do NOT need to be in the seed:
- Constraints and axioms
- Goals
- The task/planner list
- Audit or analytics summaries
- Session intent (tracked separately with its own history)

Do not reproduce any of these. The seed should only capture what emerged from the actual conversation itself — decisions reached, things discovered, progress made, understanding gained. The exception: if a genuinely new goal or constraint arose during the conversation that is not already covered by the existing goals/constraints messages, include that in the seed since it won't be re-injected automatically.

The seed captures STATE only. Tasks, to-dos, commitments, and scheduled items belong in an external task list and must NOT appear in the seed text itself. If something is clearly an action item or thing to be done, exclude it from the seed text. When the line between state and task is blurry, lean toward omitting from the seed text.

Tasks are handled separately: if the conversation mentions any tasks, commitments, to-dos, or scheduled items that are NOT already in the tracked tasks list below, you MUST report them by appending this block at the very end of your response, after the seed text. This is required — do not skip it if new tasks exist:

TASKS_JSON_BEGIN
[{"title":"...","day":"YYYY-MM-DD or null","start_time":"HH:MM or null","end_time":"HH:MM or null"}]
TASKS_JSON_END

Rules for the JSON block:
- Only include tasks genuinely absent from the tracked list.
- day must be a specific YYYY-MM-DD date if known, otherwise the string "null".
- start_time and end_time must be HH:MM (24h) if known, otherwise the string "null".
- A task has start_time only if end_time is also known; never include one without the other.
- If no new tasks exist, omit the block entirely.${trackedSection}`;

      let seedContent =
        'Generate a concise seed containing everything important discussed, reflecting the most up to date state of everything';
      const { intentResolved, resolutionReason } = req.body;
      if (typeof intentResolved === 'boolean') {
        seedContent +=
          `\n\nThe user was asked whether they resolved their stated session intent for this conversation. Answer: ${intentResolved ? 'Yes' : 'No'}.` +
          (!intentResolved && resolutionReason
            ? ` Reason it wasn't resolved: ${resolutionReason}`
            : '') +
          `\n\nIf unresolved, note this as an open thread in the seed so it carries forward.`;
      }
      const claudeResponse = await this.callClaudeAPI(
        seedContent,
        messagesForSeed,
        seedSystemPrompt,
      );

      // Extract proposed tasks block if present
      let seedText = claudeResponse;
      let proposedTasks = [];
      const jsonMatch = claudeResponse.match(/TASKS_JSON_BEGIN\s*([\s\S]*?)\s*TASKS_JSON_END/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          proposedTasks = parsed
            .map((t) => ({
              title: String(t.title || '').trim(),
              day: t.day && t.day !== 'null' ? t.day : null,
              start_time: t.start_time && t.start_time !== 'null' ? t.start_time : null,
              end_time: t.end_time && t.end_time !== 'null' ? t.end_time : null,
            }))
            .filter((t) => t.title);
        } catch (e) {
          console.error('Failed to parse proposed tasks JSON:', e);
        }
        seedText = claudeResponse
          .replace(/\s*TASKS_JSON_BEGIN[\s\S]*?TASKS_JSON_END\s*$/, '')
          .trim();
      }

      // Auto-name with timestamp; user can rename via the frontend dialog
      const now = new Date();
      const autoTitle = `Seed ${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;

      // Auto-save to seed bank (clean content, no embedded timestamps)
      const bankSeed = await createSeed(req.user.sub, autoTitle, seedText);

      // Store seed in conversation and save a marker message
      const updatedConversation = await updateConversationSeed(conversationId, seedText);
      const seedMarker = await createMessage(conversationId, 'seed', seedText);

      return res.json({
        seed: seedText,
        autoTitle,
        bankSeedId: bankSeed.id,
        conversation: updatedConversation,
        seedMarker,
        proposedTasks,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getAnalytics(req, res) {
    try {
      const userId = req.user.sub;
      const conversations = await getConversationsWithWordCounts(userId);
      return res.json({ conversations });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async archiveConversation(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const conversation = await getConversationById(id);
      if (!conversation) return res.status(404).json({ error: 'not found' });

      // Check ownership
      if (conversation.user_id !== req.user.sub) {
        return res.status(403).json({ error: 'forbidden' });
      }

      const archivedConversation = await archiveConversation(id);
      return res.json(archivedConversation);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = ConversationController;
