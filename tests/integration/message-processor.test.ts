import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { aiResponder } from '../../src/services/ai-responder.js';
import { messageProcessor } from '../../src/services/message-processor.js';
import { prisma } from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const TEST_EMAIL = `mp-test-${Date.now()}@test.com`;
let userId: string;
let accountId: string;

async function seed(): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, name: 'MP Tester', passwordHash },
  });
  userId = user.id;

  const account = await prisma.facebookAccount.create({
    data: {
      userId,
      facebookUserId: 'fb_mp_recipient',
      displayName: 'MP Page',
      accessToken: 'demo',
      tokenExpiresAt: new Date(Date.now() + 86400000),
      status: 'active',
    },
  });
  accountId = account.id;
}

async function cleanup(): Promise<void> {
  await prisma.aiResponse.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.knowledgeItem.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('AI responder (rule-based)', () => {
  it('pricing classification sinh câu trả lời về giá', async () => {
    const r = await aiResponder.generateResponse({
      content: 'Sản phẩm giá bao nhiêu?',
      classification: 'pricing',
    });
    expect(r.content.length).toBeGreaterThan(10);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.id).toBeTruthy();
  });

  it('có knowledgeContext → confidence cao hơn và nhắc context', async () => {
    const r = await aiResponder.generateResponse({
      content: 'giá bao nhiêu',
      classification: 'pricing',
      knowledgeContext: 'Gói cơ bản 100k/tháng.',
    });
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
    expect(r.content).toContain('Gói cơ bản 100k');
  });

  it('complaint classification sinh câu xin lỗi', async () => {
    const r = await aiResponder.generateResponse({
      content: 'Tôi muốn khiếu nại',
      classification: 'complaint',
    });
    expect(r.content.toLowerCase()).toMatch(/tiếc|xin lỗi|sorry/i);
  });
});

describe('Message processor (lưu DB)', () => {
  beforeAll(async () => {
    await cleanup();
    await seed();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('process với accountId tạo conversation + message + aiResponse + (automatic) outbound', async () => {
    await messageProcessor.process({
      messageId: `mid_${Date.now()}`,
      accountId,
      senderId: 'cust_mp_1',
      recipientId: 'fb_mp_recipient',
      content: 'giá bao nhiêu vậy shop',
      classification: 'pricing',
      timestamp: Date.now(),
      autoReplyMode: 'automatic',
    });

    const conv = await prisma.conversation.findFirst({
      where: { accountId, participantFacebookId: 'cust_mp_1' },
    });
    expect(conv).toBeTruthy();

    const messages = await prisma.message.findMany({ where: { conversationId: conv!.id } });
    // 1 inbound + 1 outbound (auto)
    expect(messages.length).toBe(2);
    expect(messages.some((m) => m.direction === 'inbound')).toBe(true);
    expect(messages.some((m) => m.direction === 'outbound')).toBe(true);

    const aiResponses = await prisma.aiResponse.findMany({
      where: { message: { conversationId: conv!.id } },
    });
    expect(aiResponses.length).toBe(1);
    expect(aiResponses[0].status).toBe('sent');
  });

  it('process chế độ manual → aiResponse pending, không tạo outbound', async () => {
    await messageProcessor.process({
      messageId: `mid2_${Date.now()}`,
      accountId,
      senderId: 'cust_mp_2',
      recipientId: 'fb_mp_recipient',
      content: 'tôi cần hỗ trợ',
      classification: 'support',
      timestamp: Date.now(),
      autoReplyMode: 'manual',
    });

    const conv = await prisma.conversation.findFirst({
      where: { accountId, participantFacebookId: 'cust_mp_2' },
    });
    const messages = await prisma.message.findMany({ where: { conversationId: conv!.id } });
    // chỉ 1 inbound
    expect(messages.length).toBe(1);
    expect(messages[0].direction).toBe('inbound');

    const aiResponses = await prisma.aiResponse.findMany({
      where: { message: { conversationId: conv!.id } },
    });
    expect(aiResponses[0].status).toBe('pending');
  });

  it('process reuse conversation cho cùng sender', async () => {
    const before = await prisma.conversation.count({
      where: { accountId, participantFacebookId: 'cust_mp_1' },
    });
    await messageProcessor.process({
      messageId: `mid3_${Date.now()}`,
      accountId,
      senderId: 'cust_mp_1',
      recipientId: 'fb_mp_recipient',
      content: 'cảm ơn shop',
      classification: 'general',
      timestamp: Date.now(),
      autoReplyMode: 'automatic',
    });
    const after = await prisma.conversation.count({
      where: { accountId, participantFacebookId: 'cust_mp_1' },
    });
    expect(after).toBe(before); // không tạo conversation mới
  });
});
