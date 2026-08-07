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

const { validateUserInput, validateEmail } = require('../src/utils/validator');

describe('validateEmail', () => {
  it('accepts a valid email address', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejects an address with no @', () => {
    expect(validateEmail('notanemail')).toBe(false);
  });

  it('rejects an address with no domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateUserInput', () => {
  const valid = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'Secure1!',
  };

  it('accepts valid input', () => {
    const result = validateUserInput({ ...valid, password: 'Secure123!' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('rejects missing username', () => {
    const result = validateUserInput({ ...valid, username: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBeDefined();
  });

  it('rejects whitespace-only username', () => {
    const result = validateUserInput({ ...valid, username: '   ' });
    expect(result.isValid).toBe(false);
    expect(result.errors.username).toBeDefined();
  });

  it('rejects missing email', () => {
    const result = validateUserInput({ ...valid, email: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('rejects a password shorter than 9 characters', () => {
    const result = validateUserInput({ ...valid, password: 'Ab1!' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toMatch(/9 characters/);
  });

  it('rejects a password with no uppercase letter', () => {
    const result = validateUserInput({ ...valid, password: 'secure123!' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toMatch(/uppercase/);
  });

  it('rejects a password with no number', () => {
    const result = validateUserInput({ ...valid, password: 'SecurePass!' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toMatch(/number/);
  });

  it('rejects a password with no special character', () => {
    const result = validateUserInput({ ...valid, password: 'Secure1234' });
    expect(result.isValid).toBe(false);
    expect(result.errors.password).toMatch(/special/);
  });
});
