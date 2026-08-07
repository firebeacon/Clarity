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

const sanitize = require('../src/middlewares/sanitizeMiddleware');

function run(body) {
  const req = { body };
  const res = {};
  const next = jest.fn();
  sanitize(req, res, next);
  return { req, next };
}

describe('sanitizeMiddleware', () => {
  it('calls next()', () => {
    const { next } = run({ field: 'hello' });
    expect(next).toHaveBeenCalled();
  });

  it('strips HTML tags from string fields', () => {
    const { req } = run({ field: '<b>bold</b>' });
    expect(req.body.field).toBe('bold');
  });

  it('strips script tags', () => {
    const { req } = run({ field: '<script>alert(1)</script>text' });
    expect(req.body.field).toBe('text');
  });

  it('leaves plain strings unchanged', () => {
    const { req } = run({ field: 'just text' });
    expect(req.body.field).toBe('just text');
  });

  it('sanitizes nested object fields', () => {
    const { req } = run({ outer: { inner: '<em>hi</em>' } });
    expect(req.body.outer.inner).toBe('hi');
  });

  it('sanitizes each string inside an array', () => {
    const { req } = run({ items: ['<b>one</b>', '<i>two</i>'] });
    expect(req.body.items).toEqual(['one', 'two']);
  });

  it('leaves numeric values unchanged', () => {
    const { req } = run({ count: 42 });
    expect(req.body.count).toBe(42);
  });

  it('leaves null values unchanged', () => {
    const { req } = run({ field: null });
    expect(req.body.field).toBeNull();
  });

  it('does not modify req.body when body is not an object', () => {
    const req = { body: 'raw string' };
    const next = jest.fn();
    sanitize(req, {}, next);
    expect(req.body).toBe('raw string');
    expect(next).toHaveBeenCalled();
  });
});
