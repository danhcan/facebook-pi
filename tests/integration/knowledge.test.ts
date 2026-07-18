import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

// Integration test cho Knowledge API — dùng SQLite dev.db thật
// Cleanup riêng để không xài data seed

const TEST_EMAIL = `knowledge-test-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let token: string;
let userId: string;

async function register(): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Knowledge Tester',
  });
  token = res.body.token;
  userId = res.body.user.id;
}

async function cleanup(): Promise<void> {
  await prisma.knowledgeItem.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('Knowledge API (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await register();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('POST /api/knowledge tạo item và trả 201', async () => {
    const res = await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bảng giá dịch vụ',
        content: 'Gói cơ bản: 100k/tháng. Gói nâng cao: 500k/tháng.',
        category: 'pricing',
        tags: ['giá', 'bảng giá'],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.title).toBe('Bảng giá dịch vụ');
  });

  it('GET /api/knowledge trả danh sách item của user', async () => {
    // tạo thêm 1 item
    await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Chính sách đổi trả',
        content: 'Đổi trả trong 7 ngày.',
        category: 'policy',
        tags: ['đổi trả'],
      });

    const res = await request(app)
      .get('/api/knowledge')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    // serialize đúng field
    expect(res.body.items[0]).toHaveProperty('title');
    expect(res.body.items[0]).toHaveProperty('tags');
    expect(Array.isArray(res.body.items[0].tags)).toBe(true);
  });

  it('GET /api/knowledge?search=giá lọc theo từ khóa', async () => {
    const res = await request(app)
      .get(`/api/knowledge?search=${encodeURIComponent('giá')}`)
      .set('Authorization', `Bearer ${token}`);

    if (res.status !== 200) console.log('SEARCH FAIL', res.status, JSON.stringify(res.body));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].title).toContain('giá');
  });

  it('PUT /api/knowledge/:id cập nhật title', async () => {
    const created = await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tạm', content: 'Nội dung', category: 'faq', tags: [] });
    const id = created.body.id;

    const res = await request(app)
      .put(`/api/knowledge/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Đã sửa tiêu đề' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Đã sửa tiêu đề');

    const get = await request(app)
      .get(`/api/knowledge/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.title).toBe('Đã sửa tiêu đề');
  });

  it('DELETE /api/knowledge/:id xóa item', async () => {
    const created = await request(app)
      .post('/api/knowledge')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Xóa tôi', content: 'Nội dung', category: 'faq', tags: [] });
    const id = created.body.id;

    const del = await request(app)
      .delete(`/api/knowledge/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/knowledge/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  it('GET /api/knowledge không token → 401', async () => {
    const res = await request(app).get('/api/knowledge');
    expect(res.status).toBe(401);
  });

  it('POST /api/knowledge/search tìm tri thức liên quan', async () => {
    const res = await request(app)
      .post('/api/knowledge/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'giá bao nhiêu', limit: 5 });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    // phải tìm thấy item "Bảng giá dịch vụ"
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);
    expect(res.body.results[0].title).toContain('giá');
  });
});
