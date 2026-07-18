import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export interface ExportOptions {
  format: 'json' | 'csv';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export class HistoryExporter {
  async exportConversations(options: ExportOptions): Promise<Buffer> {
    const { format, startDate, endDate, userId } = options;

    logger.info({ format, startDate, endDate, userId }, 'Starting export');

    const conversations = await this.queryMessages(startDate, endDate, userId);

    if (format === 'json') {
      return this.exportJson(conversations);
    } else {
      return this.exportCsv(conversations);
    }
  }

  private async queryMessages(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<any[]> {
    if (!userId) return [];

    const accountIds = (
      await prisma.facebookAccount.findMany({ where: { userId }, select: { id: true } })
    ).map((a) => a.id);
    const conversationIds = (
      await prisma.conversation.findMany({
        where: { accountId: { in: accountIds } },
        select: { id: true, participantName: true },
      })
    );

    if (conversationIds.length === 0) return [];

    const where: Record<string, unknown> = {
      conversationId: { in: conversationIds.map((c) => c.id) },
    };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as any).gte = startDate;
      if (endDate) (where.createdAt as any).lte = endDate;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    const nameMap = new Map(conversationIds.map((c) => [c.id, c.participantName]));

    return messages.map((m) => ({
      id: m.id,
      sender_id: m.senderId,
      content: m.content,
      created_at: m.createdAt.toISOString(),
      participant_name: nameMap.get(m.conversationId) ?? '',
      direction: m.direction,
      classification: m.classification ?? '',
    }));
  }

  private exportJson(data: any[]): Buffer {
    const json = JSON.stringify(data, null, 2);
    return Buffer.from(json, 'utf-8');
  }

  private exportCsv(data: any[]): Buffer {
    if (data.length === 0) {
      return Buffer.from('id,sender_id,content,created_at\n', 'utf-8');
    }

    const headers = ['id', 'sender_id', 'content', 'created_at'];
    const rows = data.map((item) =>
      headers.map((h) => `"${String(item[h] || '').replace(/"/g, '""')}"`).join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    return Buffer.from(csv, 'utf-8');
  }

  async generateReport(options: {
    startDate: Date;
    endDate: Date;
    userId?: string;
  }): Promise<any> {
    logger.info({ options }, 'Generating report');

    if (!options.userId) {
      return {
        period: { start: options.startDate, end: options.endDate },
        stats: {
          totalConversations: 0,
          aiResponses: 0,
          userEdited: 0,
          avgConfidence: 0,
        },
      };
    }

    const accountIds = (
      await prisma.facebookAccount.findMany({
        where: { userId: options.userId },
        select: { id: true },
      })
    ).map((a) => a.id);
    const conversationIds = (
      await prisma.conversation.findMany({
        where: { accountId: { in: accountIds } },
        select: { id: true },
      })
    ).map((c) => c.id);

    const where: Record<string, unknown> = {
      conversationId: { in: conversationIds },
      createdAt: { gte: options.startDate, lte: options.endDate },
    };

    const [totalMessages, aiResponses, userEdited, aiAgg] = await Promise.all([
      prisma.message.count({ where }),
      prisma.aiResponse.count({
        where: {
          message: { conversationId: { in: conversationIds } },
          createdAt: { gte: options.startDate, lte: options.endDate },
        },
      }),
      prisma.aiResponse.count({
        where: {
          message: { conversationId: { in: conversationIds } },
          approvedBy: { not: null },
          createdAt: { gte: options.startDate, lte: options.endDate },
        },
      }),
      prisma.aiResponse.aggregate({
        where: {
          message: { conversationId: { in: conversationIds } },
          createdAt: { gte: options.startDate, lte: options.endDate },
        },
        _avg: { confidence: true },
      }),
    ]);

    return {
      period: { start: options.startDate, end: options.endDate },
      stats: {
        totalMessages,
        aiResponses,
        userEdited,
        avgConfidence: aiAgg._avg.confidence ?? 0,
      },
    };
  }
}

export const historyExporter = new HistoryExporter();
