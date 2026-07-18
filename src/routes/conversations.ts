import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { createError, asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { sendToCustomer } from '../services/message-sender.js';

const router = Router();

router.use(authenticate);

// GET /api/conversations — danh sách cuộc trò chuyện của user
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const accountId = req.query.account_id as string | undefined;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  // Lọc conversations thuộc các account của user
  const accountWhere: Record<string, unknown> = { userId };
  const where: Record<string, unknown> = { account: accountWhere };
  if (accountId) where.accountId = accountId;
  if (status) where.status = status;
  if (search) {
    where.participantName = { contains: search };
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  // Lấy last_message + message_count cho từng conversation
  const enriched = await Promise.all(
    conversations.map(async (c) => {
      const [lastMsg, count] = await Promise.all([
        prisma.message.findFirst({
          where: { conversationId: c.id },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.message.count({ where: { conversationId: c.id } }),
      ]);
      return {
        id: c.id,
        account_id: c.accountId,
        facebook_conversation_id: c.facebookConversationId,
        participant_name: c.participantName,
        participant_facebook_id: c.participantFacebookId,
        status: c.status,
        auto_reply_mode: c.autoReplyMode,
        message_count: count,
        last_message: lastMsg
          ? {
              content: lastMsg.content,
              direction: lastMsg.direction,
              created_at: lastMsg.createdAt.toISOString(),
            }
          : null,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      };
    })
  );

  res.json({ conversations: enriched, total, page, limit });
}));

// GET /api/conversations/:id/messages — lịch sử tin nhắn
router.get('/:id/messages', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, account: { userId } },
  });
  if (!conversation) {
    throw createError(404, 'Không tìm thấy cuộc trò chuyện', 'NOT_FOUND');
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      direction: m.direction,
      content: m.content,
      message_type: m.messageType,
      classification: m.classification,
      sender_id: m.senderId,
      status: m.status,
      created_at: m.createdAt.toISOString(),
      sent_at: m.sentAt?.toISOString() ?? null,
    })),
    has_more: messages.length === limit,
  });
}));

const replySchema = z.object({
  content: z.string().min(1, 'Nội dung không được để trống'),
});

// POST /api/conversations/:id/reply — gửi tin nhắn thủ công (demo: lưu outbound, không gọi FB)
router.post('/:id/reply', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validation = replySchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, account: { userId } },
  });
  if (!conversation) {
    throw createError(404, 'Không tìm thấy cuộc trò chuyện', 'NOT_FOUND');
  }

  // Gửi qua Facebook Send API (real mode) — demo mode trả null, vẫn lưu DB
  let fbMessageId: string | null = null;
  try {
    fbMessageId = await sendToCustomer(
      conversation.accountId,
      conversation.participantFacebookId,
      validation.data.content
    );
  } catch (err: any) {
    // Gửi thất bại vẫn lưu DB (demo mode hoặc lỗi FB)
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: 'outbound',
      content: validation.data.content,
      messageType: 'text',
      senderId: userId,
      facebookMessageId: fbMessageId || undefined,
      status: 'sent',
      sentAt: new Date(),
    },
  });

  // Cập nhật updatedAt của conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() },
  });

  res.status(201).json({
    id: message.id,
    direction: message.direction,
    content: message.content,
    status: message.status,
    sent_at: message.sentAt?.toISOString(),
  });
}));

const settingsSchema = z.object({
  auto_reply_mode: z.enum(['automatic', 'manual', 'mixed']),
});

// PUT /api/conversations/:id/settings — cập nhật chế độ trả lời
router.put('/:id/settings', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validation = settingsSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: req.params.id, account: { userId } },
  });
  if (!conversation) {
    throw createError(404, 'Không tìm thấy cuộc trò chuyện', 'NOT_FOUND');
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { autoReplyMode: validation.data.auto_reply_mode },
  });

  res.json({
    id: conversation.id,
    auto_reply_mode: validation.data.auto_reply_mode,
  });
}));

export { router as conversationRoutes };
