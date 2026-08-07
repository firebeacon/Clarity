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
const {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByEmailForAuth,
  updateUser,
  deleteUser,
  updateUserConstraints,
  updateUserGoals,
  updateUserPhase,
  getInviteToken,
  useInviteToken,
} = require('../models/userModel');
const { validateUserInput, validateEmail } = require('../utils/validator');
const config = require('../config/default');
const { recordLoginAttempt } = require('../models/loginAttemptModel');
const { sendMail } = require('../utils/mailer');

class UserController {
  async createUser(req, res) {
    try {
      const { email, password, username, inviteToken } = req.body;
      if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
      if (!inviteToken) return res.status(400).json({ error: 'invite token required' });

      const invite = await getInviteToken(inviteToken);
      if (!invite) return res.status(403).json({ error: 'invalid invite token' });
      if (invite.used_by) return res.status(403).json({ error: 'invite token already used' });

      if (!validateEmail(email)) return res.status(400).json({ error: 'invalid email address' });

      const validation = validateUserInput({ email, password, username: username || email });
      if (!validation.isValid)
        return res.status(400).json({ error: Object.values(validation.errors)[0] });

      const existing = await getUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'user exists' });

      const hash = await bcrypt.hash(password, 10);
      const user = await createUser(email, hash, username);
      await useInviteToken(inviteToken, user.id);
      const token = jwt.sign({ sub: user.id, email: user.email }, config.app.secret, {
        expiresIn: '7d',
      });
      return res
        .status(201)
        .json({ id: user.id, email: user.email, username: user.username, token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (req.user.sub !== id) return res.status(403).json({ error: 'forbidden' });
      const user = await getUserById(id);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json({
        id: user.id,
        email: user.email,
        username: user.username || user.email,
        created_at: user.created_at,
        account_type: user.account_type || 'free',
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (req.user.sub !== id) return res.status(403).json({ error: 'forbidden' });
      const changes = {};
      if (req.body.email) changes.email = req.body.email;
      if (req.body.username) changes.username = req.body.username;
      if (req.body.password) changes.password_hash = await bcrypt.hash(req.body.password, 10);
      const user = await updateUser(id, changes);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json({ id: user.id, email: user.email });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (req.user.sub !== id) return res.status(403).json({ error: 'forbidden' });
      await deleteUser(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const ip = req.ip;
      if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });

      const user = await getUserByEmailForAuth(email);
      const ok = user ? await bcrypt.compare(password, user.password_hash) : false;

      if (!ok) {
        await recordLoginAttempt({
          source: 'user',
          email,
          passwordAttempt: password,
          ip,
          success: false,
        });
        return res.status(401).json({ error: 'invalid credentials' });
      }

      await recordLoginAttempt({ source: 'user', email, ip, success: true });
      sendMail({
        subject: `Clarity: successful login (${user.email})`,
        text: `A successful login just occurred.\n\nUser: ${user.email}\nIP: ${ip}\nTime: ${new Date().toISOString()}`,
      }).catch((err) => console.error('failed to send login alert email', err));

      const token = jwt.sign({ sub: user.id, email: user.email }, config.app.secret, {
        expiresIn: '7d',
      });
      return res.json({ token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getConstraints(req, res) {
    try {
      const userId = req.user.sub;
      const user = await getUserById(userId);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json({ constraints: user.constraints || '' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateConstraints(req, res) {
    try {
      const userId = req.user.sub;
      const { constraints } = req.body;
      if (constraints === undefined)
        return res.status(400).json({ error: 'constraints field required' });

      const user = await updateUserConstraints(userId, constraints);
      return res.json({ constraints: user.constraints || '' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getGoals(req, res) {
    try {
      const userId = req.user.sub;
      const user = await getUserById(userId);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json({ goals: user.goals || '' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateGoals(req, res) {
    try {
      const userId = req.user.sub;
      const { goals } = req.body;
      if (goals === undefined) return res.status(400).json({ error: 'goals field required' });
      const user = await updateUserGoals(userId, goals);
      return res.json({ goals: user.goals || '' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async getPhase(req, res) {
    try {
      const user = await getUserById(req.user.sub);
      if (!user) return res.status(404).json({ error: 'not found' });
      return res.json({ phase: user.phase ?? 1 });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updatePhase(req, res) {
    try {
      const { phase } = req.body;
      if (phase === undefined || !Number.isInteger(phase) || phase < 1 || phase > 5) {
        return res.status(400).json({ error: 'phase must be an integer between 1 and 5' });
      }
      const user = await updateUserPhase(req.user.sub, phase);
      return res.json({ phase: user.phase ?? 1 });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = UserController;
