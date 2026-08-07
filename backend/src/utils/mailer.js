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

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN;
const MAILGUN_API_BASE = process.env.MAILGUN_API_BASE || 'https://api.mailgun.net';
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;
const ALERT_EMAIL_FROM =
  process.env.ALERT_EMAIL_FROM || `Clarity <alerts@${MAILGUN_DOMAIN || 'example.com'}>`;

async function sendMail({ subject, text }) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !ALERT_EMAIL_TO) {
    console.error(
      'mailer: missing MAILGUN_API_KEY, MAILGUN_DOMAIN, or ALERT_EMAIL_TO env vars — email not sent:',
      subject,
    );
    return;
  }

  const body = new URLSearchParams({
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject,
    text,
  });

  try {
    const res = await fetch(`${MAILGUN_API_BASE}/v3/${MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`api:${MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      console.error('mailer: mailgun send failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('mailer: mailgun send error', err);
  }
}

module.exports = { sendMail };
