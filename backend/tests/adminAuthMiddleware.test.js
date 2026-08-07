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

const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../src/middlewares/adminAuthMiddleware');

const SECRET = 'test-secret';

function makeReq(authHeader) {
  return { headers: { authorization: authHeader } };
}

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('authenticateAdmin middleware', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(makeReq(undefined), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(makeReq('Bearer not-a-valid-token'), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with the wrong secret', async () => {
    const token = jwt.sign({ sub: 1, email: 'a@b.com', admin: true }, 'wrong-secret');
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(makeReq(`Bearer ${token}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a valid token that lacks the admin flag', async () => {
    const token = jwt.sign({ sub: 1, email: 'user@example.com' }, SECRET);
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(makeReq(`Bearer ${token}`), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', async () => {
    const token = jwt.sign({ sub: 1, admin: true }, SECRET, { expiresIn: -1 });
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(makeReq(`Bearer ${token}`), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and sets req.admin for a valid admin token', async () => {
    const token = jwt.sign({ sub: 7, email: 'admin@example.com', admin: true }, SECRET);
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();
    await authenticateAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.admin.sub).toBe(7);
    expect(req.admin.admin).toBe(true);
  });
});
