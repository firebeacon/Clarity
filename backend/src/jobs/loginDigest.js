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

const cron = require('node-cron');
const { getAttemptsSince } = require('../models/loginAttemptModel');
const { sendMail } = require('../utils/mailer');

function maskPassword(pw) {
  if (!pw) return '';
  if (pw.length <= 2) return '*'.repeat(pw.length);
  return pw[0] + '*'.repeat(pw.length - 2) + pw[pw.length - 1];
}

function formatAttempt(a) {
  return `[${a.created_at}] source=${a.source} ip=${a.ip} email=${a.email} password=${maskPassword(a.password_attempt)}`;
}

async function sendDailyDigest() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const attempts = await getAttemptsSince(since);

  const text =
    attempts.length === 0
      ? `No failed login attempts in the last 24 hours.`
      : `${attempts.length} failed login attempt(s) in the last 24 hours:\n\n${attempts.map(formatAttempt).join('\n')}`;

  await sendMail({
    subject: `Clarity: daily login attempt summary (${attempts.length})`,
    text,
  });
}

function scheduleDailyDigest() {
  // Runs once a day at 08:00 server time.
  cron.schedule('0 8 * * *', () => {
    sendDailyDigest().catch((err) => console.error('failed to send daily login digest', err));
  });
}

module.exports = { scheduleDailyDigest, maskPassword };
