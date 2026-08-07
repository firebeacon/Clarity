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
} = require('../models/seedModel');
const config = require('../config/default');

class SeedController {
  async listSeeds(req, res) {
    try {
      const seeds = await getSeedsByUserId(req.user.sub);
      return res.json(seeds);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updateSeed(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const seed = await getSeedById(id);
      if (!seed) return res.status(404).json({ error: 'not found' });
      if (seed.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });

      const { title, content, packet_id } = req.body;
      const changes = {};
      if (title !== undefined) changes.title = title;
      if (content !== undefined) changes.content = content;
      if (packet_id !== undefined) {
        if (packet_id !== null) {
          const packet = await getPacketById(packet_id);
          if (!packet || packet.user_id !== req.user.sub) {
            return res.status(403).json({ error: 'forbidden' });
          }
        }
        changes.packet_id = packet_id;
      }

      const updated = await updateSeed(id, changes);
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deleteSeed(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const seed = await getSeedById(id);
      if (!seed) return res.status(404).json({ error: 'not found' });
      if (seed.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      await deleteSeed(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async compressSeed(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const seed = await getSeedById(id);
      if (!seed) return res.status(404).json({ error: 'not found' });
      if (seed.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });

      const compressed = await this.callClaudeCompress(seed.content);
      const newSeed = await createSeed(
        req.user.sub,
        `${seed.title} (compressed)`,
        compressed,
        seed.packet_id ?? null,
      );
      return res.status(201).json(newSeed);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async consolidateSeeds(req, res) {
    try {
      const { seedIds } = req.body || {};
      const hasSubset = Array.isArray(seedIds) && seedIds.length > 0;
      const seeds = hasSubset
        ? await getSeedsByIds(req.user.sub, seedIds)
        : await getSeedsByUserId(req.user.sub);
      if (seeds.length < 2) {
        return res.status(400).json({ error: 'at least 2 seeds required' });
      }

      const consolidated = await this.callClaudeConsolidate(seeds);
      if (hasSubset) {
        await archiveSeeds(
          req.user.sub,
          seeds.map((s) => s.id),
        );
      } else {
        await archiveAllSeeds(req.user.sub);
      }

      const now = new Date();
      const title = `Consolidated Seed ${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;
      const newSeed = await createSeed(req.user.sub, title, consolidated, null);
      return res.status(201).json(newSeed);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async callClaudeConsolidate(seeds) {
    const combined = seeds
      .map((s, i) => `--- Seed ${i + 1}: ${s.title} ---\n${s.content}`)
      .join('\n\n');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claude.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system:
          'The following are multiple seeds — compact summaries of state from separate past conversations. Consolidate them into a single compacted seed that preserves everything essential from all of them, removing redundancy and outdated/superseded information where entries conflict (prefer the more recent one). Output only the consolidated seed content, nothing else.',
        messages: [{ role: 'user', content: combined }],
      }),
    });
    const data = await response.json();
    if (data.content?.[0]?.text) return data.content[0].text;
    throw new Error('Claude consolidation failed');
  }

  async callClaudeCompress(content) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.claude.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system:
          'Compress the following seed into the most compact form possible while preserving all essential information and state. Output only the compressed seed content, nothing else.',
        messages: [{ role: 'user', content }],
      }),
    });
    const data = await response.json();
    if (data.content?.[0]?.text) return data.content[0].text;
    throw new Error('Claude compression failed');
  }

  async listPackets(req, res) {
    try {
      const packets = await getPacketsByUserId(req.user.sub);
      return res.json(packets);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async createPacket(req, res) {
    try {
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'name required' });
      const packet = await createPacket(req.user.sub, name.trim());
      return res.status(201).json(packet);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async updatePacket(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'name required' });
      const packet = await getPacketById(id);
      if (!packet) return res.status(404).json({ error: 'not found' });
      if (packet.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      const updated = await updatePacket(id, name.trim());
      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  async deletePacket(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const packet = await getPacketById(id);
      if (!packet) return res.status(404).json({ error: 'not found' });
      if (packet.user_id !== req.user.sub) return res.status(403).json({ error: 'forbidden' });
      await deletePacket(id);
      return res.status(204).send();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}

module.exports = SeedController;
