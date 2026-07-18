import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const TEST_EMAIL = `stats-test-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let token: string;
let userId: string;

async function register(): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Stats Tester',
  });
  token = res.body.token;
  userId = res.body.user.id;
}

async function seed(): Promise<void> {
  // 1 knowledge item
  await prisma.knowledgeItem.create({
    data: {
      userId,
      title: 'Bảng giá',
      content: 'Gói cơ bản 100k',
      category: 'pricing',
      tags: '[]',
      isActive: true,
    },
  });

  const account = await prisma.facebookAccount.create({
    data: {
      userId,
      facebookUserId: `fb_stats_${Date.now()}`,
      displayName: 'Stats Page',
      accessToken: 'demo',
      tokenExpiresAt: new Date(Date.now() + 86400000),
      status: 'active',
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      accountId: account.id,
      facebookConversationId: `stconv_${Date.now()}`,
      participantName: 'Khách A',
      participantFacebookId: 'k_1',
      status: 'active',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv.id,
        direction: 'inbound',
        content: 'giá bao nhiêu',
        messageType: 'text',
        classification: 'pricing',
        senderId: 'k_1',
        status: 'received',
      },
      {
        conversationId: conv.id,
        direction: 'outbound',
        content: '100k bạn nhé',
        messageType: 'text',
        senderId: userId,
        status: 'sent',
        sentAt: new Date(),
      },
      {
        conversationId: conv.id,
        direction: 'inbound',
        content: 'khiếu nại về đơn hàng',
        messageType: 'text',
        classification: 'complaint',
        senderId: 'k_2',
        status: 'received',
      },
    ],
  });

  // 1 ai response pending + 1 sent
  const msg = await prisma.message.findFirst({
    where: { conversationId: conv.id, direction: 'inbound' },
  });
  if (msg) {
    await prisma.aiResponse.createMany({
      data: [
        { messageId: msg.id, content: 'reply 1', confidence: 0.9, status: 'pending' },
        { messageId: msg.id, content: 'reply 2', confidence: 0.8, status: 'sent', sentAt: new Date() },
      ],
    });
  }
}

async function cleanup(): Promise<void> {
  await prisma.aiResponse.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.knowledgeItem.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('Stats & History API (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await register();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
  });

  // ── Stats ──

  it('GET /api/stats/overview trả số liệu tổng quan', async () => {
    const res = await request(app)
      .get('/api/stats/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalConversations).toBeGreaterThanOrEqual(1);
    expect(res.body.totalMessages).toBeGreaterThanOrEqual(3);
    expect(res.body.aiResponses).toBeGreaterThanOrEqual(2);
    expect(res.body.pendingApprovals).toBeGreaterThanOrEqual(1);
    expect(res.body.knowledgeItems).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/stats/activity trả dữ liệu theo ngày', async () => {
    const res = await request(app)
      .get('/api/stats/activity?days=7')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(7);
    expect(res.body.data[0]).toHaveProperty('messages');
    expect(res.body.data[0]).toHaveProperty('ai');
    // ngày hôm nay phải có ít nhất 3 messages
    const today = res.body.data[res.body.data.length - 1];
    expect(today.messages).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/stats/report tạo báo cáo', async () => {
    const start = new Date();
    start.setDate(start.getDate() - 1);
    const end = new Date();
    end.setDate(end.getDate() + 1);

    const res = await request(app)
      .post('/api/stats/report')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: start.toISOString(), endDate: end.toISOString() });

    expect(res.status).toBe(200);
    expect(res.body.stats).toBeTruthy();
    expect(res.body.stats.totalMessages).toBeGreaterThanOrEqual(3);
    expect(res.body.stats.aiResponses).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/stats/report sai format date → 400', async () => {
    const res = await request(app)
      .post('/api/stats/report')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: 'not-a-date', endDate: 'bad' });
    expect(res.status).toBe(400);
  });

  // ── History ──

  it('GET /api/history trả danh sách tin nhắn', async () => {
    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(3);
    expect(res.body.messages[0]).toHaveProperty('participant_name');
    expect(res.body.total).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/history?search=giá lọc theo nội dung', async () => {
    const res = await request(app)
      .get(`/api/history?search=${encodeURIComponent('giá')}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(res.body.messages[0].content).toContain('giá');
  });

  it('GET /api/history/export?format=csv trả file CSV', async () => {
    const res = await request(app)
      .get('/api/history/export?format=csv')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('id,participant_name,direction,content');
  });

  it('GET /api/history/export?format=json trả JSON', async () => {
    const res = await request(app)
      .get('/api/history/export?format=json')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    const parsed = JSON.parse(res.text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(3);
  });
});
