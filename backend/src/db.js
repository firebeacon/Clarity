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

const path = require('path');
const fs = require('fs');
const knexLib = require('knex');
const bcrypt = require('bcryptjs');
const config = require('./config/default');

const DEFAULT_CONSTRAINTS = `This conversation operates under the following constraints:

1. Concision. Be concise. Get to the point. Don't waste words. No filler.
2. Zero sycophancy at all costs.
3. Flag uncertainty.`;

const dbFile = config.db.file;

const knex = knexLib({
  client: 'sqlite3',
  connection: { filename: dbFile },
  useNullAsDefault: true,
  pool: { afterCreate: (conn, cb) => cb(null, conn) },
});

async function init() {
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const exists = await knex.schema.hasTable('users');
  if (!exists) {
    await knex.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('email').notNullable().unique();
      t.string('password_hash').notNullable();
      t.text('constraints');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  } else {
    // Add constraints column if it doesn't exist
    const hasConstraintsColumn = await knex.schema.hasColumn('users', 'constraints');
    if (!hasConstraintsColumn) {
      await knex.schema.alterTable('users', (t) => {
        t.text('constraints');
      });
    }
    const hasGoalsColumn = await knex.schema.hasColumn('users', 'goals');
    if (!hasGoalsColumn) {
      await knex.schema.alterTable('users', (t) => {
        t.text('goals');
      });
    }
    const hasPhaseColumn = await knex.schema.hasColumn('users', 'phase');
    if (!hasPhaseColumn) {
      await knex.schema.alterTable('users', (t) => {
        t.integer('phase').defaultTo(1);
      });
    }
    const hasAccountTypeColumn = await knex.schema.hasColumn('users', 'account_type');
    if (!hasAccountTypeColumn) {
      await knex.schema.alterTable('users', (t) => {
        t.string('account_type').defaultTo('free');
        t.integer('messages_remaining').defaultTo(10);
        t.string('last_reset_date').nullable();
      });
    }
    const hasUsernameColumn = await knex.schema.hasColumn('users', 'username');
    if (!hasUsernameColumn) {
      await knex.schema.alterTable('users', (t) => {
        t.string('username').nullable();
      });
      await knex('users')
        .whereNull('username')
        .orWhere('username', '')
        .update(knex.raw('username = email'));
    }
  }

  const conversationsExists = await knex.schema.hasTable('conversations');
  if (!conversationsExists) {
    await knex.schema.createTable('conversations', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title');
      t.text('seed');
      t.boolean('archived').defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    // Add seed column if it doesn't exist
    const hasSeedColumn = await knex.schema.hasColumn('conversations', 'seed');
    if (!hasSeedColumn) {
      await knex.schema.alterTable('conversations', (t) => {
        t.text('seed');
      });
    }
    // Add archived column if it doesn't exist
    const hasArchivedColumn = await knex.schema.hasColumn('conversations', 'archived');
    if (!hasArchivedColumn) {
      await knex.schema.alterTable('conversations', (t) => {
        t.boolean('archived').defaultTo(false);
      });
    }
  }

  const goalsExists = await knex.schema.hasTable('goals');
  if (!goalsExists) {
    await knex.schema.createTable('goals', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.text('content').notNullable();
      t.integer('ordinal').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const goalCommentsExists = await knex.schema.hasTable('goal_comments');
  if (!goalCommentsExists) {
    await knex.schema.createTable('goal_comments', (t) => {
      t.increments('id').primary();
      t.integer('goal_id').references('id').inTable('goals').onDelete('CASCADE');
      t.text('content').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const messagesExists = await knex.schema.hasTable('messages');
  if (!messagesExists) {
    await knex.schema.createTable('messages', (t) => {
      t.increments('id').primary();
      t.integer('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
      t.string('role').notNullable();
      t.text('content').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  } else {
    // Migrate away from enum CHECK constraint so role can hold values beyond 'user'/'assistant'
    const [row] = await knex.raw(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='messages'",
    );
    if (row && row.sql && /check/i.test(row.sql)) {
      await knex.raw(`CREATE TABLE messages_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      await knex.raw('INSERT INTO messages_new SELECT * FROM messages');
      await knex.raw('DROP TABLE messages');
      await knex.raw('ALTER TABLE messages_new RENAME TO messages');
    }
  }

  const appConfigExists = await knex.schema.hasTable('app_config');
  if (!appConfigExists) {
    await knex.schema.createTable('app_config', (t) => {
      t.string('key').primary();
      t.text('value').notNullable();
    });
  }

  // Seed default constraints
  const existing = await knex('app_config').where({ key: 'default_constraints' }).first();
  if (!existing) {
    await knex('app_config').insert({
      key: 'default_constraints',
      value: DEFAULT_CONSTRAINTS,
    });
  } else {
    await knex('app_config')
      .where({ key: 'default_constraints' })
      .update({ value: DEFAULT_CONSTRAINTS });
  }

  await knex('app_config').where({ key: 'default_constraints_source' }).del();

  const adminUsersExists = await knex.schema.hasTable('admin_users');
  if (!adminUsersExists) {
    await knex.schema.createTable('admin_users', (t) => {
      t.increments('id').primary();
      t.string('email').notNullable().unique();
      t.string('password_hash').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const auditQuestionSetsExists = await knex.schema.hasTable('audit_question_sets');
  if (!auditQuestionSetsExists) {
    await knex.schema.createTable('audit_question_sets', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const auditQuestionsExists = await knex.schema.hasTable('audit_questions');
  if (!auditQuestionsExists) {
    await knex.schema.createTable('audit_questions', (t) => {
      t.increments('id').primary();
      t.integer('set_id').references('id').inTable('audit_question_sets').onDelete('CASCADE');
      t.string('type').notNullable(); // 'general' | 'goal'
      t.text('text').notNullable();
      t.string('answer_type').notNullable().defaultTo('text'); // 'text' | 'scale'
      t.integer('ordinal').notNullable().defaultTo(0);
    });
  }

  const userAuditConfigExists = await knex.schema.hasTable('user_audit_config');
  if (!userAuditConfigExists) {
    await knex.schema.createTable('user_audit_config', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
      t.integer('set_id')
        .references('id')
        .inTable('audit_question_sets')
        .onDelete('SET NULL')
        .nullable();
      t.integer('period_days').notNullable().defaultTo(7);
    });
  }

  const auditSessionsExists = await knex.schema.hasTable('audit_sessions');
  if (!auditSessionsExists) {
    await knex.schema.createTable('audit_sessions', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.text('analytics_seed').nullable();
      t.timestamp('completed_at').defaultTo(knex.fn.now());
    });
  }

  const auditAnswersExists = await knex.schema.hasTable('audit_answers');
  if (!auditAnswersExists) {
    await knex.schema.createTable('audit_answers', (t) => {
      t.increments('id').primary();
      t.integer('session_id').references('id').inTable('audit_sessions').onDelete('CASCADE');
      t.integer('question_id').references('id').inTable('audit_questions').onDelete('CASCADE');
      t.integer('goal_id').nullable();
      t.text('goal_content').nullable();
      t.text('answer_text').nullable();
      t.integer('answer_scale').nullable();
    });
  } else {
    const hasGoalContent = await knex.schema.hasColumn('audit_answers', 'goal_content');
    if (!hasGoalContent) {
      await knex.schema.alterTable('audit_answers', (t) => t.text('goal_content').nullable());
    }
  }

  const seedPacketsExists = await knex.schema.hasTable('seed_packets');
  if (!seedPacketsExists) {
    await knex.schema.createTable('seed_packets', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('name').notNullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const accountTiersExists = await knex.schema.hasTable('account_tiers');
  if (!accountTiersExists) {
    await knex.schema.createTable('account_tiers', (t) => {
      t.string('type').primary();
      t.integer('daily_limit').notNullable();
    });
    await knex('account_tiers').insert([
      { type: 'free', daily_limit: 10 },
      { type: 'bronze', daily_limit: 20 },
      { type: 'silver', daily_limit: 35 },
      { type: 'gold', daily_limit: 100 },
    ]);
  }

  const seedsExists = await knex.schema.hasTable('seeds');
  if (!seedsExists) {
    await knex.schema.createTable('seeds', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.integer('packet_id')
        .references('id')
        .inTable('seed_packets')
        .onDelete('SET NULL')
        .nullable();
      t.string('title').notNullable().defaultTo('Untitled Seed');
      t.text('content').notNullable();
      t.boolean('archived').defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    const hasSeedArchivedColumn = await knex.schema.hasColumn('seeds', 'archived');
    if (!hasSeedArchivedColumn) {
      await knex.schema.alterTable('seeds', (t) => {
        t.boolean('archived').defaultTo(false);
      });
    }
  }

  const inviteTokensExists = await knex.schema.hasTable('invite_tokens');
  if (!inviteTokensExists) {
    await knex.schema.createTable('invite_tokens', (t) => {
      t.increments('id').primary();
      t.string('token').notNullable().unique();
      t.integer('used_by').references('id').inTable('users').onDelete('SET NULL').nullable();
      t.timestamp('used_at').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const notesExists = await knex.schema.hasTable('notes');
  if (!notesExists) {
    await knex.schema.createTable('notes', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title').notNullable();
      t.text('body').defaultTo('');
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const loginAttemptsExists = await knex.schema.hasTable('login_attempts');
  if (!loginAttemptsExists) {
    await knex.schema.createTable('login_attempts', (t) => {
      t.increments('id').primary();
      t.string('source').notNullable(); // 'user' | 'admin'
      t.string('email').nullable();
      t.string('password_attempt').nullable();
      t.string('ip').nullable();
      t.boolean('success').notNullable().defaultTo(false);
      t.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const plannerTasksExists = await knex.schema.hasTable('planner_tasks');
  if (!plannerTasksExists) {
    await knex.schema.createTable('planner_tasks', (t) => {
      t.increments('id').primary();
      t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      t.string('title').notNullable();
      t.string('day').nullable(); // ISO date "YYYY-MM-DD", null = general todo
      t.boolean('is_timed').defaultTo(false);
      t.string('start_time').nullable(); // "HH:MM"
      t.string('end_time').nullable(); // "HH:MM"
      t.integer('sort_order').defaultTo(0);
      t.boolean('completed').defaultTo(false);
      t.text('comments').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
      t.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  } else {
    const hasComments = await knex.schema.hasColumn('planner_tasks', 'comments');
    if (!hasComments) {
      await knex.schema.alterTable('planner_tasks', (t) => {
        t.text('comments').nullable();
      });
    }
    const hasBacklog = await knex.schema.hasColumn('planner_tasks', 'backlog');
    if (!hasBacklog) {
      await knex.schema.alterTable('planner_tasks', (t) => {
        t.boolean('backlog').defaultTo(false);
      });
    }
  }
}

module.exports = { knex, init };
