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

jest.mock('../src/models/userModel');
jest.mock('../src/models/loginAttemptModel');
jest.mock('../src/utils/mailer', () => ({ sendMail: jest.fn().mockResolvedValue() }));

const bcrypt = require('bcryptjs');
const userModel = require('../src/models/userModel');
const { recordLoginAttempt } = require('../src/models/loginAttemptModel');
const UserController = require('../src/controllers/userController');

const ctrl = new UserController();

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

// --- createUser ---

describe('createUser', () => {
  it('returns 400 when email or password is missing', async () => {
    const res = makeRes();
    await ctrl.createUser({ body: { inviteToken: 'tok' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when invite token is missing', async () => {
    const res = makeRes();
    await ctrl.createUser({ body: { email: 'a@b.com', password: 'Secure1!' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when invite token does not exist', async () => {
    userModel.getInviteToken.mockResolvedValue(null);
    const res = makeRes();
    await ctrl.createUser(
      { body: { email: 'a@b.com', password: 'Secure1!x', inviteToken: 'bad' } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid invite token' });
  });

  it('returns 403 when invite token is already used', async () => {
    userModel.getInviteToken.mockResolvedValue({ token: 'tok', used_by: 5 });
    const res = makeRes();
    await ctrl.createUser(
      { body: { email: 'a@b.com', password: 'Secure1!x', inviteToken: 'tok' } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'invite token already used' });
  });

  it('returns 409 when email is already registered', async () => {
    userModel.getInviteToken.mockResolvedValue({ token: 'tok', used_by: null });
    userModel.getUserByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });
    const res = makeRes();
    await ctrl.createUser(
      { body: { email: 'a@b.com', password: 'Secure1!x', inviteToken: 'tok' } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 201 with token on successful registration', async () => {
    userModel.getInviteToken.mockResolvedValue({ token: 'tok', used_by: null });
    userModel.getUserByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue({ id: 1, email: 'a@b.com', username: 'a@b.com' });
    userModel.useInviteToken.mockResolvedValue();
    const res = makeRes();
    await ctrl.createUser(
      { body: { email: 'a@b.com', password: 'Secure1!x', inviteToken: 'tok' } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.token).toBeDefined();
    expect(body.email).toBe('a@b.com');
  });
});

// --- loginUser ---

describe('loginUser', () => {
  it('returns 400 when email or password is missing', async () => {
    const res = makeRes();
    await ctrl.loginUser({ body: {}, ip: '127.0.0.1' }, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 for an unknown email', async () => {
    userModel.getUserByEmailForAuth.mockResolvedValue(null);
    recordLoginAttempt.mockResolvedValue();
    const res = makeRes();
    await ctrl.loginUser({ body: { email: 'x@x.com', password: 'wrong' }, ip: '127.0.0.1' }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(recordLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it('returns 401 for a wrong password', async () => {
    userModel.getUserByEmailForAuth.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      password_hash: await bcrypt.hash('correct', 10),
    });
    recordLoginAttempt.mockResolvedValue();
    const res = makeRes();
    await ctrl.loginUser(
      { body: { email: 'a@b.com', password: 'wrong' }, ip: '127.0.0.1' },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns a token on correct credentials', async () => {
    const hash = await bcrypt.hash('Secure1!x', 10);
    userModel.getUserByEmailForAuth.mockResolvedValue({
      id: 2,
      email: 'a@b.com',
      password_hash: hash,
    });
    recordLoginAttempt.mockResolvedValue();
    const res = makeRes();
    await ctrl.loginUser(
      { body: { email: 'a@b.com', password: 'Secure1!x' }, ip: '127.0.0.1' },
      res,
    );
    expect(res.status).not.toHaveBeenCalledWith(401);
    const body = res.json.mock.calls[0][0];
    expect(body.token).toBeDefined();
  });
});

// --- getUser ---

describe('getUser', () => {
  it('returns 403 when the authenticated user requests another user', async () => {
    const res = makeRes();
    await ctrl.getUser({ params: { id: '2' }, user: { sub: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 404 when the user does not exist', async () => {
    userModel.getUserById.mockResolvedValue(null);
    const res = makeRes();
    await ctrl.getUser({ params: { id: '1' }, user: { sub: 1 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the user on success', async () => {
    userModel.getUserById.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      username: 'alice',
      created_at: '2026-01-01',
      account_type: 'free',
    });
    const res = makeRes();
    await ctrl.getUser({ params: { id: '1' }, user: { sub: 1 } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
  });
});

// --- updatePhase ---

describe('updatePhase', () => {
  it.each([undefined, 0, 6, 'two'])(
    'returns 400 for invalid phase value %s',
    async (phase) => {
      const res = makeRes();
      await ctrl.updatePhase({ body: { phase }, user: { sub: 1 } }, res);
      expect(res.status).toHaveBeenCalledWith(400);
    },
  );

  it('returns updated phase on success', async () => {
    userModel.updateUserPhase.mockResolvedValue({ phase: 3 });
    const res = makeRes();
    await ctrl.updatePhase({ body: { phase: 3 }, user: { sub: 1 } }, res);
    expect(res.json).toHaveBeenCalledWith({ phase: 3 });
  });
});
