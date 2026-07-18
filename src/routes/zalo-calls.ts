import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/zalo-calls
 * List Zalo call requests with optional filters
 */
router.get('/', authenticate, async (req, res: Response) => {
  try {
    const { status, priority, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (priority && priority !== 'all') where.priority = priority;

    const calls = await prisma.zaloCallRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      skip: parseInt(offset as string, 10),
      include: {
        conversation: {
          select: {
            id: true,
            participantName: true,
            participantFacebookId: true,
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const total = await prisma.zaloCallRequest.count({ where });

    // Get pending count for badge
    const pendingCount = await prisma.zaloCallRequest.count({
      where: { status: 'pending' },
    });

    res.json({
      calls,
      total,
      pendingCount,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to list zalo calls');
    res.status(500).json({ error: 'Failed to fetch call requests' });
  }
});

/**
 * GET /api/zalo-calls/:id
 * Get single call request details
 */
router.get('/:id', authenticate, async (req, res: Response) => {
  try {
    const call = await prisma.zaloCallRequest.findUnique({
      where: { id: req.params.id },
      include: {
        conversation: {
          select: {
            id: true,
            participantName: true,
            participantFacebookId: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: { direction: true, content: true, createdAt: true },
            },
          },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!call) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    res.json(call);
  } catch (error) {
    logger.error({ error }, 'Failed to get zalo call');
    res.status(500).json({ error: 'Failed to fetch call request' });
  }
});

/**
 * POST /api/zalo-calls/:id/assign
 * Assign call request to current user
 */
router.post('/:id/assign', authenticate, async (req, res: Response) => {
  try {
    const call = await prisma.zaloCallRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!call) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (call.status !== 'pending') {
      return res.status(400).json({
        error: 'Call request is not pending',
        currentStatus: call.status,
      });
    }

    const updated = await prisma.zaloCallRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'assigned',
        assignedTo: req.user!.userId,
        assignedAt: new Date(),
      },
      include: {
        conversation: {
          select: { participantName: true, participantFacebookId: true },
        },
      },
    });

    logger.info(
      { callId: call.id, assignedTo: req.user!.userId },
      'Zalo call assigned'
    );

    res.json({
      message: 'Call request assigned successfully',
      call: updated,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to assign zalo call');
    res.status(500).json({ error: 'Failed to assign call request' });
  }
});

/**
 * POST /api/zalo-calls/:id/complete
 * Mark call as completed with notes
 */
router.post('/:id/complete', authenticate, async (req, res: Response) => {
  try {
    const { notes } = req.body;

    const call = await prisma.zaloCallRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!call) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (call.status !== 'assigned') {
      return res.status(400).json({
        error: 'Call request must be assigned before completing',
        currentStatus: call.status,
      });
    }

    const updated = await prisma.zaloCallRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        notes: notes || null,
        completedAt: new Date(),
      },
    });

    logger.info({ callId: call.id, notes: !!notes }, 'Zalo call completed');

    res.json({
      message: 'Call request completed successfully',
      call: updated,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to complete zalo call');
    res.status(500).json({ error: 'Failed to complete call request' });
  }
});

/**
 * POST /api/zalo-calls/:id/cancel
 * Cancel call request
 */
router.post('/:id/cancel', authenticate, async (req, res: Response) => {
  try {
    const { reason } = req.body;

    const call = await prisma.zaloCallRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!call) {
      return res.status(404).json({ error: 'Call request not found' });
    }

    if (call.status === 'completed' || call.status === 'cancelled') {
      return res.status(400).json({
        error: 'Cannot cancel completed or already cancelled request',
        currentStatus: call.status,
      });
    }

    const updated = await prisma.zaloCallRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : null,
        completedAt: new Date(),
      },
    });

    logger.info({ callId: call.id, reason }, 'Zalo call cancelled');

    res.json({
      message: 'Call request cancelled',
      call: updated,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to cancel zalo call');
    res.status(500).json({ error: 'Failed to cancel call request' });
  }
});

export default router;
