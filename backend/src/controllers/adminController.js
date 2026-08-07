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

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { knex } = require('../db');
const { getAllUsers, updateUser, deleteUser, resetUserData } = require('../models/adminModel');
const { createInviteToken, getInviteTokens, deleteInviteToken } = require('../models/userModel');
const crypto = require('crypto');
const { recordLoginAttempt } = require('../models/loginAttemptModel');
const { sendMail } = require('../utils/mailer');
const {
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
} = require('../models/auditModel');
const config = require('../config/default');

class AdminController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip;
      if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });

      const admin = await knex('admin_users').where({ email }).first();
      const ok = admin ? await bcrypt.compare(password, admin.password_hash) : false;

      if (!ok) {
        await recordLoginAttempt({
          source: 'admin',
          email,
          passwordAttempt: password,
          ip,
          success: false,
        });
        return res.status(401).json({ error: 'invalid credentials' });
      }

      await recordLoginAttempt({ source: 'admin', email, ip, success: true });
      sendMail({
        subject: `Clarity: successful ADMIN login (${admin.email})`,
        text: `A successful admin login just occurred.\n\nAdmin: ${admin.email}\nIP: ${ip}\nTime: ${new Date().toISOString()}`,
      }).catch((err) => console.error('failed to send login alert email', err));

      const token = jwt.sign(
        { sub: admin.id, email: admin.email, admin: true },
        config.app.secret,
        { expiresIn: '7d' },
      );
      return res.json({ token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getUsers(req, res) {
    try {
      const users = await getAllUsers();
      return res.json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const VALID_TYPES = ['free', 'bronze', 'silver', 'gold'];
      const changes = {};
      if (req.body.email !== undefined) {
        if (typeof req.body.email !== 'string' || !req.body.email.includes('@')) {
          return res.status(400).json({ error: 'invalid email' });
        }
        changes.email = req.body.email;
      }
      if (req.body.phase !== undefined) {
        const phase = req.body.phase;
        if (!Number.isInteger(phase) || phase < 1 || phase > 5) {
          return res.status(400).json({ error: 'phase must be an integer between 1 and 5' });
        }
        changes.phase = phase;
      }
      if (req.body.account_type !== undefined) {
        if (!VALID_TYPES.includes(req.body.account_type)) {
          return res
            .status(400)
            .json({ error: 'account_type must be one of: free, bronze, silver, gold' });
        }
        changes.account_type = req.body.account_type;
        changes.last_reset_date = new Date().toISOString().split('T')[0];
        if (req.body.messages_remaining === undefined) {
          const tier = await knex('account_tiers').where({ type: req.body.account_type }).first();
          changes.messages_remaining = tier?.daily_limit ?? 10;
        }
      }
      if (req.body.messages_remaining !== undefined) {
        if (!Number.isInteger(req.body.messages_remaining) || req.body.messages_remaining < 0) {
          return res
            .status(400)
            .json({ error: 'messages_remaining must be a non-negative integer' });
        }
        changes.messages_remaining = req.body.messages_remaining;
      }
      if (!Object.keys(changes).length) return res.status(400).json({ error: 'nothing to update' });
      const user = await updateUser(id, changes);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json(user);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword)
        return res.status(400).json({ error: 'currentPassword and newPassword required' });
      if (newPassword.length < 9)
        return res.status(400).json({ error: 'password must be at least 9 characters' });

      const admin = await knex('admin_users').where({ id: req.admin.sub }).first();
      if (!admin) return res.status(404).json({ error: 'not found' });

      const ok = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!ok) return res.status(401).json({ error: 'current password is incorrect' });

      const hash = await bcrypt.hash(newPassword, 10);
      await knex('admin_users').where({ id: req.admin.sub }).update({ password_hash: hash });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getTiers(req, res) {
    try {
      const tiers = await knex('account_tiers').select('*').orderBy('daily_limit', 'asc');
      return res.json(tiers);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateTier(req, res) {
    try {
      const { type } = req.params;
      const { daily_limit } = req.body;
      if (!Number.isInteger(daily_limit) || daily_limit < 1) {
        return res.status(400).json({ error: 'daily_limit must be a positive integer' });
      }
      const existing = await knex('account_tiers').where({ type }).first();
      if (!existing) return res.status(404).json({ error: 'tier not found' });
      await knex('account_tiers').where({ type }).update({ daily_limit });
      return res.json({ type, daily_limit });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteUser(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async resetUserData(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await resetUserData(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  // --- Audit question sets ---

  async getAuditSets(req, res) {
    try {
      const sets = await getAllSets();
      const result = await Promise.all(
        sets.map(async (s) => ({
          ...s,
          questions: await getQuestionsBySetId(s.id),
        })),
      );
      return res.json(result);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async createAuditSet(req, res) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'name required' });
      const set = await createSet(name.trim());
      return res.status(201).json({ ...set, questions: [] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteAuditSet(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteSet(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async addAuditQuestion(req, res) {
    try {
      const setId = parseInt(req.params.id, 10);
      const set = await getSetById(setId);
      if (!set) return res.status(404).json({ error: 'set not found' });
      const { type, text, answerType } = req.body;
      if (!['general', 'goal'].includes(type))
        return res.status(400).json({ error: 'type must be general or goal' });
      if (!text?.trim()) return res.status(400).json({ error: 'text required' });
      if (!['text', 'scale'].includes(answerType))
        return res.status(400).json({ error: 'answerType must be text or scale' });
      const question = await createQuestion(setId, type, text.trim(), answerType);
      return res.status(201).json(question);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateAuditQuestion(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const changes = {};
      if (req.body.text !== undefined) changes.text = req.body.text;
      if (req.body.answerType !== undefined) changes.answer_type = req.body.answerType;
      if (!Object.keys(changes).length) return res.status(400).json({ error: 'nothing to update' });
      const q = await updateQuestion(id, changes);
      return res.json(q);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteAuditQuestion(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteQuestion(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  // --- User audit config ---

  async getUserAuditConfig(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const cfg = await getUserAuditConfig(userId);
      return res.json(cfg || null);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async setUserAuditConfig(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { setId, periodDays } = req.body;
      if (!setId || !periodDays)
        return res.status(400).json({ error: 'setId and periodDays required' });
      const cfg = await setUserAuditConfig(userId, setId, periodDays);
      return res.json(cfg);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getInviteTokens(req, res) {
    try {
      const tokens = await getInviteTokens();
      return res.json(tokens);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async createInviteToken(req, res) {
    try {
      const token = crypto.randomBytes(16).toString('hex');
      await createInviteToken(token);
      return res.status(201).json({ token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteInviteToken(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await deleteInviteToken(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = AdminController;
