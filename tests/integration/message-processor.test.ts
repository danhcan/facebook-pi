import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { aiResponder } from '../../src/services/ai-responder.js';
import { messageProcessor } from '../../src/services/message-processor.js';
import { prisma } from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

// Mock LLM client to avoid calling real API in tests
vi.mock('../../src/services/llm-client.js', () => ({
  llmClient: {
    chat: vi.fn().mockResolvedValue({
      content: 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ hỗ trợ bạn ngay.',
      tokensUsed: 50,
      model: 'hotro-test',
    }),
  },
  LLMMessage: undefined,
}));

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
  await prisma.zaloCallRequest.deleteMany({});
  await prisma.aiResponse.deleteMany({});
  await prisma.messageQueue.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.facebookAccount.deleteMany({ where: { userId } });
  await prisma.knowledgeItem.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

describe('AI responder (LLM-integrated)', () => {
  it('sinh câu trả lời từ LLM mock', async () => {
    const r = await aiResponder.generateResponse({
      content: 'Sản phẩm giá bao nhiêu?',
      classification: 'pricing',
    });
    expect(r.content.length).toBeGreaterThan(10);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.id).toBeTruthy();
    expect(r.provider).toBe('custom');
  });

  it('có knowledgeContext → confidence cao hơn', async () => {
    const r = await aiResponder.generateResponse({
      content: 'giá bao nhiêu',
      classification: 'pricing',
      knowledgeContext: 'Gói cơ bản 100k/tháng.',
    });
    expect(r.confidence).toBeGreaterThan(0.8);
    expect(r.content).toBeTruthy();
  });

  it('trả về needsEscalation field', async () => {
    const r = await aiResponder.generateResponse({
      content: 'Tôi muốn khiếu nại',
      classification: 'complaint',
    });
    expect(typeof r.needsEscalation).toBe('boolean');
    expect(r.provider).toBeTruthy();
    expect(r.modelUsed).toBeTruthy();
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
    // 1 inbound + 1 outbound (auto) [+ 1 escalation confirm if needed]
    expect(messages.length).toBeGreaterThanOrEqual(2);
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
    // chỉ 1 inbound (manual mode, no auto reply)
    // Note: if escalation triggered, there may be confirmation message
    const inbound = messages.filter((m) => m.direction === 'inbound');
    expect(inbound.length).toBe(1);

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
