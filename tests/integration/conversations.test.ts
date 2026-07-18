import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const TEST_EMAIL = `conv-test-${Date.now()}@test.com`;
const TEST_PASSWORD = 'password123';

let token: string;
let userId: string;
let accountId: string;
let conversationId: string;

async function register(): Promise<void> {
  const res = await request(app).post('/api/auth/register').send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    name: 'Conv Tester',
  });
  token = res.body.token;
  userId = res.body.user.id;
}

async function seed(): Promise<void> {
  const account = await prisma.facebookAccount.create({
    data: {
      userId,
      facebookUserId: `fb_conv_${Date.now()}`,
      displayName: 'Conv Demo Page',
      accessToken: 'demo',
      tokenExpiresAt: new Date(Date.now() + 86400000),
      status: 'active',
    },
  });
  accountId = account.id;

  const conv = await prisma.conversation.create({
    data: {
      accountId,
      facebookConversationId: `conv_${Date.now()}`,
      participantName: 'Nguyễn Văn A',
      participantFacebookId: 'cust_001',
      status: 'active',
      autoReplyMode: 'automatic',
    },
  });
  conversationId = conv.id;

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv.id,
        direction: 'inbound',
        content: 'Giá bao nhiêu?',
        messageType: 'text',
        classification: 'pricing',
        senderId: 'cust_001',
        status: 'received',
      },
      {
        conversationId: conv.id,
        direction: 'outbound',
        content: 'Chào bạn, sản phẩm giá 100k.',
        messageType: 'text',
        senderId: userId,
        status: 'sent',
        sentAt: new Date(),
      },
    ],
  });
}

async function cleanup(): Promise<void> {
  await prisma.message.deleteMany({});
  await prisma.aiResponse.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('Conversations API (integration)', () => {
  beforeAll(async () => {
    await cleanup();
    await register();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('GET /api/conversations trả danh sách kèm last_message + count', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThanOrEqual(1);
    const c = res.body.conversations[0];
    expect(c.participant_name).toBe('Nguyễn Văn A');
    expect(c.message_count).toBe(2);
    expect(c.last_message).toBeTruthy();
    expect(c.last_message.content).toBe('Chào bạn, sản phẩm giá 100k.');
  });

  it('GET /api/conversations?search=Nguyễn lọc theo tên', async () => {
    const res = await request(app)
      .get(`/api/conversations?search=${encodeURIComponent('Nguyễn')}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.conversations.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/conversations/:id/messages trả lịch sử tin nhắn', async () => {
    const res = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages.length).toBe(2);
    expect(res.body.messages[0].direction).toBe('inbound');
    expect(res.body.messages[1].direction).toBe('outbound');
  });

  it('POST /api/conversations/:id/reply gửi tin nhắn outbound', async () => {
    const res = await request(app)
      .post(`/api/conversations/${conversationId}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Cảm ơn bạn đã quan tâm!' });

    expect(res.status).toBe(201);
    expect(res.body.direction).toBe('outbound');
    expect(res.body.status).toBe('sent');

    // verify count tăng
    const msgs = await request(app)
      .get(`/api/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(msgs.body.messages.length).toBe(3);
  });

  it('PUT /api/conversations/:id/settings đổi sang manual', async () => {
    const res = await request(app)
      .put(`/api/conversations/${conversationId}/settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ auto_reply_mode: 'manual' });

    expect(res.status).toBe(200);
    expect(res.body.auto_reply_mode).toBe('manual');
  });

  it('PUT settings với mode sai → 400', async () => {
    const res = await request(app)
      .put(`/api/conversations/${conversationId}/settings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ auto_reply_mode: 'bogus' });
    expect(res.status).toBe(400);
  });

  it('GET conversation không tồn tại → 404', async () => {
    const res = await request(app)
      .get('/api/conversations/nonexistent-id/messages')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
