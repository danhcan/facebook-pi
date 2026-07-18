import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { historyExporter } from '../services/history-exporter.js';
import { z } from 'zod';
import { createError, asyncHandler } from '../middleware/error-handler.js';

const router = Router();

router.use(authenticate);

const reportSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// GET /api/stats/overview — thống kê tổng quan cho dashboard
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const accountIds = (
    await prisma.facebookAccount.findMany({ where: { userId }, select: { id: true } })
  ).map((a) => a.id);

  const conversationIds = (
    await prisma.conversation.findMany({
      where: { accountId: { in: accountIds } },
      select: { id: true },
    })
  ).map((c) => c.id);

  const [totalConversations, totalMessages, aiResponses, pendingApprovals, knowledgeItems] =
    await Promise.all([
      prisma.conversation.count({ where: { accountId: { in: accountIds } } }),
      prisma.message.count({ where: { conversationId: { in: conversationIds } } }),
      prisma.aiResponse.count({
        where: { message: { conversationId: { in: conversationIds } } },
      }),
      prisma.aiResponse.count({
        where: {
          message: { conversationId: { in: conversationIds } },
          status: 'pending',
        },
      }),
      prisma.knowledgeItem.count({ where: { userId } }),
    ]);

  res.json({
    totalConversations,
    totalMessages,
    aiResponses,
    pendingApprovals,
    knowledgeItems,
  });
}));

// GET /api/stats/activity — hoạt động theo ngày (7 ngày gần nhất)
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const days = parseInt(req.query.days as string) || 7;

  const accountIds = (
    await prisma.facebookAccount.findMany({ where: { userId }, select: { id: true } })
  ).map((a) => a.id);
  const conversationIds = (
    await prisma.conversation.findMany({
      where: { accountId: { in: accountIds } },
      select: { id: true },
    })
  ).map((c) => c.id);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const messages = await prisma.message.findMany({
    where: { conversationId: { in: conversationIds }, createdAt: { gte: since } },
    select: { direction: true, classification: true, createdAt: true },
  });

  // Nhóm theo ngày
  const byDay: Record<string, { date: string; messages: number; ai: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { date: key, messages: 0, ai: 0 };
  }

  for (const m of messages) {
    const key = m.createdAt.toISOString().slice(0, 10);
    if (byDay[key]) {
      byDay[key].messages += 1;
    }
  }

  // AI responses theo ngày
  const aiResponses = await prisma.aiResponse.findMany({
    where: { message: { conversationId: { in: conversationIds } }, createdAt: { gte: since } },
    select: { createdAt: true },
  });
  for (const r of aiResponses) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (byDay[key]) {
      byDay[key].ai += 1;
    }
  }

  res.json({
    period: `${days}d`,
    data: Object.values(byDay),
  });
}));

// POST /api/stats/report — tạo báo cáo
router.post('/report', asyncHandler(async (req: Request, res: Response) => {
  const validation = reportSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const report = await historyExporter.generateReport({
    startDate: new Date(validation.data.startDate),
    endDate: new Date(validation.data.endDate),
    userId: req.user!.userId,
  });

  res.json(report);
}));

export { router as statsRoutes };
