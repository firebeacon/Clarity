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

jest.mock('../src/config/default', () => ({
  app: { secret: 'test-secret', port: 3003 },
  claude: { apiKey: 'test-key' },
  db: { file: ':memory:' },
}));

const { maskPassword } = require('../src/jobs/loginDigest');

describe('maskPassword', () => {
  it('returns empty string for an empty string', () => {
    expect(maskPassword('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(maskPassword(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(maskPassword(undefined)).toBe('');
  });

  it('masks a single character fully', () => {
    expect(maskPassword('a')).toBe('*');
  });

  it('masks two characters fully', () => {
    expect(maskPassword('ab')).toBe('**');
  });

  it('shows first and last character for a three-character password', () => {
    expect(maskPassword('abc')).toBe('a*c');
  });

  it('shows first and last character with stars in between for a longer password', () => {
    expect(maskPassword('password123')).toBe('p*********3');
  });

  it('middle stars count matches the hidden characters', () => {
    const pw = 'Secret1!x';
    const result = maskPassword(pw);
    expect(result[0]).toBe(pw[0]);
    expect(result[result.length - 1]).toBe(pw[pw.length - 1]);
    expect(result.length).toBe(pw.length);
    expect(result.slice(1, -1)).toBe('*'.repeat(pw.length - 2));
  });
});
