import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { createError, asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { sendToCustomer } from '../services/message-sender.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.use(authenticate);

const updateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// GET /api/ai-responses — danh sách câu trả lời AI
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const where: Record<string, unknown> = {
    message: { conversation: { account: { userId } } },
  };
  if (status) where.status = status;

  const [responses, total] = await Promise.all([
    prisma.aiResponse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        message: {
          include: {
            conversation: { select: { participantName: true } },
          },
        },
      },
    }),
    prisma.aiResponse.count({ where }),
  ]);

  res.json({
    responses: responses.map((r) => ({
      id: r.id,
      message_id: r.messageId,
      content: r.content,
      confidence: r.confidence,
      status: r.status,
      approved_by: r.approvedBy,
      approved_at: r.approvedAt?.toISOString() ?? null,
      sent_at: r.sentAt?.toISOString() ?? null,
      feedback: r.feedback,
      created_at: r.createdAt.toISOString(),
      // Thông tin phụ để UI hiển thị
      customer: r.message.conversation.participantName,
      original_message: r.message.content,
      message_classification: r.message.classification,
    })),
    total,
    page,
    limit,
  });
}));

// GET /api/ai-responses/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const r = await prisma.aiResponse.findFirst({
    where: { id: req.params.id, message: { conversation: { account: { userId } } } },
    include: { message: { include: { conversation: { select: { participantName: true } } } } },
  });
  if (!r) {
    throw createError(404, 'Không tìm thấy phản hồi', 'NOT_FOUND');
  }
  res.json({
    id: r.id,
    message_id: r.messageId,
    content: r.content,
    confidence: r.confidence,
    status: r.status,
    approved_by: r.approvedBy,
    approved_at: r.approvedAt?.toISOString() ?? null,
    sent_at: r.sentAt?.toISOString() ?? null,
    feedback: r.feedback,
    created_at: r.createdAt.toISOString(),
    customer: r.message.conversation.participantName,
    original_message: r.message.content,
    message_classification: r.message.classification,
  });
}));

// POST /api/ai-responses/:id/approve — duyệt và gửi (demo: mark sent)
router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const r = await prisma.aiResponse.findFirst({
    where: { id: req.params.id, message: { conversation: { account: { userId } } } },
  });
  if (!r) {
    throw createError(404, 'Không tìm thấy phản hồi', 'NOT_FOUND');
  }
  if (r.status !== 'pending') {
    throw createError(409, 'Chỉ phản hồi đang chờ mới được duyệt', 'NOT_PENDING');
  }

  const originalMessage = await prisma.message.findUnique({
    where: { id: r.messageId },
    select: {
      conversationId: true,
      conversation: {
        select: { id: true, participantFacebookId: true, accountId: true },
      },
    },
  });
  if (!originalMessage) {
    throw createError(500, 'Tin nhắn gốc không tồn tại', 'ORPHAN_MESSAGE');
  }

  // Gửi qua Facebook Send API (real mode) — demo mode trả null, vẫn lưu DB
  let fbMessageId: string | null = null;
  try {
    fbMessageId = await sendToCustomer(
      originalMessage.conversation.accountId,
      originalMessage.conversation.participantFacebookId,
      r.content
    );
  } catch (err: any) {
    logger.warn({ aiResponseId: r.id, error: err.message }, 'Send failed on approve, saving DB only');
  }

  const updated = await prisma.aiResponse.update({
    where: { id: r.id },
    data: {
      status: 'sent',
      approvedBy: userId,
      approvedAt: new Date(),
      sentAt: new Date(),
    },
  });

  // Tạo tin nhắn outbound (lưu DB; real mode có facebookMessageId)
  await prisma.message.create({
    data: {
      conversationId: originalMessage.conversationId,
      direction: 'outbound',
      content: r.content,
      messageType: 'text',
      senderId: userId,
      facebookMessageId: fbMessageId || undefined,
      status: 'sent',
      sentAt: new Date(),
    },
  });

  res.json({
    id: updated.id,
    status: updated.status,
    approved_at: updated.approvedAt?.toISOString(),
    sent_at: updated.sentAt?.toISOString(),
  });
}));

// PUT /api/ai-responses/:id — chỉnh sửa nội dung
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validation = updateSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const r = await prisma.aiResponse.findFirst({
    where: { id: req.params.id, message: { conversation: { account: { userId } } } },
  });
  if (!r) {
    throw createError(404, 'Không tìm thấy phản hồi', 'NOT_FOUND');
  }

  const updated = await prisma.aiResponse.update({
    where: { id: r.id },
    data: { content: validation.data.content },
  });

  res.json({
    id: updated.id,
    content: updated.content,
    status: updated.status,
  });
}));

// DELETE /api/ai-responses/:id — từ chối
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const r = await prisma.aiResponse.findFirst({
    where: { id: req.params.id, message: { conversation: { account: { userId } } } },
  });
  if (!r) {
    throw createError(404, 'Không tìm thấy phản hồi', 'NOT_FOUND');
  }

  await prisma.aiResponse.update({
    where: { id: r.id },
    data: { status: 'rejected' },
  });

  res.status(204).send();
}));

// POST /api/ai-responses/:id/feedback
router.post('/:id/feedback', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { feedback } = req.body;
  if (!['positive', 'negative', 'neutral'].includes(feedback)) {
    throw createError(400, 'Invalid feedback value', 'VALIDATION_ERROR');
  }

  const r = await prisma.aiResponse.findFirst({
    where: { id: req.params.id, message: { conversation: { account: { userId } } } },
  });
  if (!r) {
    throw createError(404, 'Không tìm thấy phản hồi', 'NOT_FOUND');
  }

  await prisma.aiResponse.update({
    where: { id: r.id },
    data: { feedback },
  });

  res.json({
    id: r.id,
    feedback,
    recorded_at: new Date().toISOString(),
  });
}));

export { router as aiResponseRoutes };
