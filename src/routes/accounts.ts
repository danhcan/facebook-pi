import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { createError, asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { encrypt } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';
import { facebookApi, isConfigured } from '../services/facebook-api.js';

const router = Router();

router.use(authenticate);

const connectSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  redirect_uri: z.string().url('Invalid redirect URI'),
  // Cho phép demo: dữ liệu Facebook giả lập đi kèm
  display_name: z.string().min(1).optional(),
  facebook_user_id: z.string().min(1).optional(),
});

// GET /api/accounts/oauth/url — sinh URL OAuth dialog (real mode)
// Frontend redirect browser tới URL này; sau khi user đồng ý, FB redirect
// về redirect_uri kèm ?code=&state=
router.get('/oauth/url', asyncHandler(async (req: Request, res: Response) => {
  if (!isConfigured()) {
    throw createError(503, 'Facebook chưa cấu hình. Đặt FACEBOOK_APP_ID/SECRET/WEBHOOK_VERIFY_TOKEN trong .env', 'FB_NOT_CONFIGURED');
  }

  const redirectUri = (req.query.redirect_uri as string) || `${req.headers.origin || 'http://localhost:5173'}/accounts/callback`;

  // state = CSRF token: userId + random hex → kiểm tra khi callback
  const state = `${req.user!.userId}.${crypto.randomBytes(16).toString('hex')}`;

  const result = facebookApi.getOAuthUrl(redirectUri, state);

  res.json({ url: result.url, state: result.state, redirect_uri: redirectUri });
}));

// POST /api/accounts/connect — kết nối tài khoản
// Real mode: exchange code → long-lived token → lấy pages → tạo account/page
// Demo mode (fallback): nhận display_name + facebook_user_id giả lập
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
  const validation = connectSchema.safeParse(req.body);
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }

  const { code, redirect_uri, display_name, facebook_user_id } = validation.data;
  const userId = req.user!.userId;

  // ── REAL MODE: exchange code với Facebook ──
  if (isConfigured()) {
    try {
      // 1. exchange code → short-lived user token
      const shortToken = await facebookApi.exchangeCodeForToken(code, redirect_uri);
      // 2. → long-lived (60 ngày)
      const longToken = await facebookApi.getLongLivedUserToken(shortToken);
      // 3. lấy pages
      const pages = await facebookApi.getPages(longToken);

      if (pages.length === 0) {
        throw createError(400, 'Tài khoản Facebook chưa quản lý Page nào. Hãy tạo Page trước.', 'NO_PAGES');
      }

      // 4. tạo FacebookAccount cho mỗi page (lưu page access token, mã hóa)
      const created = [];
      for (const page of pages) {
        const existing = await prisma.facebookAccount.findUnique({
          where: { facebookUserId: page.id },
        });
        if (existing) {
          // Đã kết nối page này (có thể của user khác) → update token
          await prisma.facebookAccount.update({
            where: { id: existing.id },
            data: {
              accessToken: encrypt(page.access_token),
              tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              status: 'active',
              lastSyncAt: new Date(),
              displayName: page.name,
            },
          });
          created.push({ id: existing.id, facebook_user_id: page.id, display_name: page.name, status: 'active', skipped: true });
          continue;
        }

        const account = await prisma.facebookAccount.create({
          data: {
            userId,
            facebookUserId: page.id,
            displayName: page.name,
            accessToken: encrypt(page.access_token),
            tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'active',
            lastSyncAt: new Date(),
          },
        });
        created.push({
          id: account.id,
          facebook_user_id: account.facebookUserId,
          display_name: account.displayName,
          status: account.status,
          connected_at: account.connectedAt.toISOString(),
          last_sync_at: account.lastSyncAt?.toISOString() ?? null,
        });
      }

      logger.info({ userId, pagesCount: created.length }, 'Connected Facebook pages via OAuth');
      // Trả về mảng pages (real mode kết nối nhiều page cùng lúc)
      return res.status(201).json({ accounts: created, total: created.length });
    } catch (err: any) {
      logger.error({ error: err.message }, 'OAuth connect failed');
      throw createError(502, `Kết nối Facebook thất bại: ${err.message}`, 'OAUTH_FAILED');
    }
  }

  // ── DEMO MODE (fallback): mô phỏng kết nối ──
  const fbUserId = facebook_user_id || `fb_${Buffer.from(code).toString('hex').slice(0, 12)}`;
  const displayName = display_name || `Tài khoản Facebook ${fbUserId.slice(-4)}`;

  const existing = await prisma.facebookAccount.findUnique({
    where: { facebookUserId: fbUserId },
  });
  if (existing) {
    throw createError(409, 'Tài khoản đã được kết nối', 'ACCOUNT_EXISTS');
  }

  const accessToken = encrypt(`demo-token:${fbUserId}:${Date.now()}`);
  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

  const account = await prisma.facebookAccount.create({
    data: {
      userId,
      facebookUserId: fbUserId,
      displayName,
      accessToken,
      tokenExpiresAt,
      status: 'active',
      lastSyncAt: new Date(),
    },
  });

  logger.info({ accountId: account.id, fbUserId }, 'Account connected (demo)');

  res.status(201).json({
    id: account.id,
    facebook_user_id: account.facebookUserId,
    display_name: account.displayName,
    status: account.status,
    connected_at: account.connectedAt.toISOString(),
    last_sync_at: account.lastSyncAt?.toISOString() ?? null,
  });
}));

// GET /api/accounts
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;

  const accounts = await prisma.facebookAccount.findMany({
    where,
    orderBy: { connectedAt: 'desc' },
  });

  res.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      facebook_user_id: a.facebookUserId,
      display_name: a.displayName,
      status: a.status,
      connected_at: a.connectedAt.toISOString(),
      last_sync_at: a.lastSyncAt?.toISOString() ?? null,
      token_expires_at: a.tokenExpiresAt.toISOString(),
    })),
    total: accounts.length,
  });
}));

// DELETE /api/accounts/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const account = await prisma.facebookAccount.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!account) {
    throw createError(404, 'Không tìm thấy tài khoản', 'NOT_FOUND');
  }

  await prisma.facebookAccount.delete({ where: { id: account.id } });
  logger.info({ accountId: account.id }, 'Account disconnected');
  res.status(204).send();
}));

// POST /api/accounts/:id/refresh
router.post('/:id/refresh', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const account = await prisma.facebookAccount.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!account) {
    throw createError(404, 'Không tìm thấy tài khoản', 'NOT_FOUND');
  }

  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  await prisma.facebookAccount.update({
    where: { id: account.id },
    data: { status: 'active', tokenExpiresAt, lastSyncAt: new Date() },
  });

  res.json({
    status: 'active',
    token_expires_at: tokenExpiresAt.toISOString(),
  });
}));

// GET /api/accounts/facebook-status — kiểm tra FB đã cấu hình chưa
router.get('/facebook-status', asyncHandler(async (req: Request, res: Response) => {
  res.json({ configured: isConfigured() });
}));

export { router as accountRoutes };
