import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const TEST_EMAIL = `ai-test-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let token: string;
let userId: string;
let pendingResponseId: string;
let sentResponseId: string;

async function register(): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'AI Tester',
  });
  token = res.body.token;
  userId = res.body.user.id;
}

async function seed(): Promise<void> {
  const account = await prisma.facebookAccount.create({
    data: {
      userId,
      facebookUserId: `fb_ai_${Date.now()}`,
      displayName: 'AI Demo Page',
      accessToken: 'demo',
      tokenExpiresAt: new Date(Date.now() + 86400000),
      status: 'active',
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      accountId: account.id,
      facebookConversationId: `aiconv_${Date.now()}`,
      participantName: 'Trần Thị B',
      participantFacebookId: 'cust_ai_001',
      status: 'active',
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: 'inbound',
      content: 'Đơn hàng của tôi đang ở đâu?',
      messageType: 'text',
      classification: 'support',
      senderId: 'cust_ai_001',
      status: 'received',
    },
  });

  const r1 = await prisma.aiResponse.create({
    data: {
      messageId: msg1.id,
      content: 'Để kiểm tra tình trạng đơn hàng, bạn vui lòng cung cấp mã đơn hàng.',
      confidence: 0.88,
      status: 'pending',
    },
  });
  pendingResponseId = r1.id;

  const msg2 = await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: 'inbound',
      content: 'Sản phẩm còn hàng không?',
      messageType: 'text',
      classification: 'general',
      senderId: 'cust_ai_002',
      status: 'received',
    },
  });

  const r2 = await prisma.aiResponse.create({
    data: {
      messageId: msg2.id,
      content: 'Sản phẩm này hiện đang có sẵn hàng.',
      confidence: 0.97,
      status: 'sent',
      sentAt: new Date(),
    },
  });
  sentResponseId = r2.id;
}

async function cleanup(): Promise<void> {
  await prisma.aiResponse.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('AI Responses API (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await register();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('GET /api/ai-responses trả danh sách kèm customer + original_message', async () => {
    const res = await request(app)
      .get('/api/ai-responses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.responses.length).toBeGreaterThanOrEqual(2);
    const r = res.body.responses[0];
    expect(r).toHaveProperty('customer');
    expect(r).toHaveProperty('original_message');
    expect(r).toHaveProperty('confidence');
  });

  it('GET /api/ai-responses?status=pending lọc đúng', async () => {
    const res = await request(app)
      .get('/api/ai-responses?status=pending')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.responses.length).toBe(1);
    expect(res.body.responses[0].status).toBe('pending');
  });

  it('GET /api/ai-responses/:id trả chi tiết', async () => {
    const res = await request(app)
      .get(`/api/ai-responses/${pendingResponseId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(pendingResponseId);
    expect(res.body.customer).toBe('Trần Thị B');
  });

  it('PUT /api/ai-responses/:id chỉnh sửa nội dung', async () => {
    const res = await request(app)
      .put(`/api/ai-responses/${pendingResponseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Nội dung đã được chỉnh sửa.' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Nội dung đã được chỉnh sửa.');
  });

  it('POST /api/ai-responses/:id/approve duyệt pending → sent', async () => {
    const res = await request(app)
      .post(`/api/ai-responses/${pendingResponseId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sent');
    expect(res.body.sent_at).toBeTruthy();
  });

  it('POST /approve lại response đã sent → 409', async () => {
    const res = await request(app)
      .post(`/api/ai-responses/${sentResponseId}/approve`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(409);
  });

  it('DELETE /api/ai-responses/:id từ chối (rejected)', async () => {
    // tạo mới pending để reject
    const list = await request(app)
      .get('/api/ai-responses')
      .set('Authorization', `Bearer ${token}`);
    const target = list.body.responses.find((r: any) => r.status === 'pending');
    if (!target) {
      // seed thêm 1 pending
      const msgs = await prisma.message.findMany();
      const r = await prisma.aiResponse.create({
        data: {
          messageId: msgs[0].id,
          content: 'test reject',
          confidence: 0.5,
          status: 'pending',
        },
      });
      const del = await request(app)
        .delete(`/api/ai-responses/${r.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(del.status).toBe(204);
      return;
    }
    const del = await request(app)
      .delete(`/api/ai-responses/${target.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
  });

  it('POST /api/ai-responses/:id/feedback ghi feedback', async () => {
    const res = await request(app)
      .post(`/api/ai-responses/${sentResponseId}/feedback`)
      .set('Authorization', `Bearer ${token}`)
      .send({ feedback: 'positive' });

    expect(res.status).toBe(200);
    expect(res.body.feedback).toBe('positive');
  });

  it('POST /feedback giá trị sai → 400', async () => {
    const res = await request(app)
      .post(`/api/ai-responses/${sentResponseId}/feedback`)
      .set('Authorization', `Bearer ${token}`)
      .send({ feedback: 'bogus' });
    expect(res.status).toBe(400);
  });
});
