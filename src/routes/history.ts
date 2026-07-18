import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/history — danh sách tin nhắn (lọc theo thời gian + tìm kiếm)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const search = req.query.search as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

  const accountIds = (
    await prisma.facebookAccount.findMany({ where: { userId }, select: { id: true } })
  ).map((a) => a.id);
  const conversationIds = (
    await prisma.conversation.findMany({
      where: { accountId: { in: accountIds } },
      select: { id: true, participantName: true },
    })
  );

  if (conversationIds.length === 0) {
    res.json({ messages: [], total: 0, page, limit });
    return;
  }

  const where: Record<string, unknown> = {
    conversationId: { in: conversationIds.map((c) => c.id) },
  };
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as any).gte = new Date(from);
    if (to) (where.createdAt as any).lte = new Date(to);
  }
  if (search) {
    where.content = { contains: search };
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  const nameMap = new Map(conversationIds.map((c) => [c.id, c.participantName]));

  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      conversation_id: m.conversationId,
      participant_name: nameMap.get(m.conversationId) ?? null,
      direction: m.direction,
      content: m.content,
      classification: m.classification,
      status: m.status,
      created_at: m.createdAt.toISOString(),
      sent_at: m.sentAt?.toISOString() ?? null,
    })),
    total,
    page,
    limit,
  });
}));

// GET /api/history/export — xuất CSV/JSON đồng bộ (demo, không queue)
router.get('/export', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const format = (req.query.format as string) || 'csv';
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const accountIds = (
    await prisma.facebookAccount.findMany({ where: { userId }, select: { id: true } })
  ).map((a) => a.id);
  const conversationIds = (
    await prisma.conversation.findMany({
      where: { accountId: { in: accountIds } },
      select: { id: true, participantName: true },
    })
  );

  if (conversationIds.length === 0) {
    if (format === 'json') {
      res.type('application/json').send([]);
      return;
    }
    res.type('text/csv').send('id,participant_name,direction,content,classification,created_at\n');
    return;
  }

  const where: Record<string, unknown> = {
    conversationId: { in: conversationIds.map((c) => c.id) },
  };
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as any).gte = new Date(from);
    if (to) (where.createdAt as any).lte = new Date(to);
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  const nameMap = new Map(conversationIds.map((c) => [c.id, c.participantName]));

  const rows = messages.map((m) => ({
    id: m.id,
    participant_name: nameMap.get(m.conversationId) ?? '',
    direction: m.direction,
    content: m.content,
    classification: m.classification ?? '',
    created_at: m.createdAt.toISOString(),
  }));

  if (format === 'json') {
    res.type('application/json').attachment('history.json').send(JSON.stringify(rows, null, 2));
    return;
  }

  // CSV
  const headers = ['id', 'participant_name', 'direction', 'content', 'classification', 'created_at'];
  const csvLines = [headers.join(',')];
  for (const r of rows) {
    csvLines.push(
      headers
        .map((h) => `"${String((r as any)[h] ?? '').replace(/"/g, '""')}"`)
        .join(',')
    );
  }
  res.type('text/csv').attachment('history.csv').send(csvLines.join('\n'));
}));

export { router as historyRoutes };
