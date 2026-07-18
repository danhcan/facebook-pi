import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

// Force demo mode cho tests (bỏ qua Facebook API thật)
vi.mock('../../src/services/facebook-api.js', async () => {
  const actual = await vi.importActual('../../src/services/facebook-api.js');
  return {
    ...actual,
    isConfigured: () => false,
  };
});

const TEST_EMAIL = `accounts-test-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let token: string;
let userId: string;

async function register(): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Accounts Tester',
  });
  token = res.body.token;
  userId = res.body.user.id;
}

async function cleanup(): Promise<void> {
  const accounts = await prisma.facebookAccount.findMany({ where: { userId } });
  for (const a of accounts) {
    await prisma.conversation.deleteMany({ where: { accountId: a.id } });
  }
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('Accounts API (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await register();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('POST /api/accounts/connect tạo tài khoản demo', async () => {
    const res = await request(app)
      .post('/api/accounts/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'demo_oauth_code_abc',
        redirect_uri: 'http://localhost:5173/accounts',
        display_name: 'Shop Online VN',
        facebook_user_id: 'fb_demo_001',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.display_name).toBe('Shop Online VN');
    expect(res.body.status).toBe('active');
  });

  it('POST /api/accounts/connect trùng → 409', async () => {
    const res = await request(app)
      .post('/api/accounts/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'demo_oauth_code_abc2',
        redirect_uri: 'http://localhost:5173/accounts',
        facebook_user_id: 'fb_demo_001',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ACCOUNT_EXISTS');
  });

  it('GET /api/accounts trả danh sách tài khoản', async () => {
    const res = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.accounts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.accounts[0]).toHaveProperty('display_name');
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/accounts/:id/refresh làm mới token', async () => {
    const list = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${token}`);
    const id = list.body.accounts[0].id;

    const res = await request(app)
      .post(`/api/accounts/${id}/refresh`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
    expect(res.body.token_expires_at).toBeTruthy();
  });

  it('DELETE /api/accounts/:id ngắt kết nối', async () => {
    // tạo thêm 1 account để xóa
    const created = await request(app)
      .post('/api/accounts/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'demo_oauth_code_xyz',
        redirect_uri: 'http://localhost:5173/accounts',
        display_name: 'Page Test 2',
        facebook_user_id: 'fb_demo_002',
      });
    const id = created.body.id;

    const del = await request(app)
      .delete(`/api/accounts/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    // xóa tài khoản không tồn tại → 404
    const del2 = await request(app)
      .delete(`/api/accounts/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del2.status).toBe(404);
  });

  it('GET /api/accounts không token → 401', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(401);
  });
});
