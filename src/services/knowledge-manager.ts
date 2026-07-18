import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  category: string;
}

export interface KnowledgeInput {
  userId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface KnowledgeUpdateInput {
  title?: string;
  content?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface KnowledgeListParams {
  userId: string;
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export class KnowledgeManager {
  /**
   * Tìm kiếm tri thức theo từ khóa (keyword-based, không cần vector embedding).
   * Trả về danh sách sắp xếp theo điểm trùng khớp giảm dần.
   */
  async searchRelevant(query: string, limit: number = 3): Promise<KnowledgeSearchResult[]> {
    logger.debug({ query, limit }, 'Searching knowledge base');

    const items = await prisma.knowledgeItem.findMany({
      where: { isActive: true },
    });

    const terms = this.tokenize(query);
    const scored = items
      .map((item) => ({ item, score: this.scoreItem(item, terms) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ item, score }) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      score,
      category: item.category,
    }));
  }

  async create(input: KnowledgeInput): Promise<string> {
    logger.info({ userId: input.userId, title: input.title }, 'Creating knowledge item');
    const item = await prisma.knowledgeItem.create({
      data: {
        userId: input.userId,
        title: input.title,
        content: input.content,
        category: input.category,
        tags: JSON.stringify(input.tags ?? []),
        isActive: true,
      },
    });
    return item.id;
  }

  async update(id: string, input: KnowledgeUpdateInput): Promise<void> {
    logger.info({ id }, 'Updating knowledge item');
    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;
    if (input.category !== undefined) data.category = input.category;
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
    if (input.isActive !== undefined) data.isActive = input.isActive;

    await prisma.knowledgeItem.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    logger.info({ id }, 'Deleting knowledge item');
    await prisma.knowledgeItem.delete({ where: { id } });
  }

  async list(params: KnowledgeListParams): Promise<{ items: any[]; total: number }> {
    const { userId, category, page = 1, limit = 20, search } = params;
    const where: Record<string, unknown> = { userId };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    return {
      items: items.map(this.serialize),
      total,
    };
  }

  async getById(id: string): Promise<any | null> {
    const item = await prisma.knowledgeItem.findUnique({ where: { id } });
    return item ? this.serialize(item) : null;
  }

  // ── helpers ──

  private serialize = (item: any): any => ({
    id: item.id,
    userId: item.userId,
    title: item.title,
    content: item.content,
    category: item.category,
    tags: this.parseTags(item.tags),
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });

  private parseTags(raw: string): string[] {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length > 1);
  }

  private scoreItem(item: { title: string; content: string; tags: string }, terms: string[]): number {
    const haystackTitle = item.title.toLowerCase();
    const haystackContent = item.content.toLowerCase();
    const tags = this.parseTags(item.tags).map((t) => t.toLowerCase());

    let score = 0;
    for (const term of terms) {
      if (haystackTitle.includes(term)) score += 3;
      if (haystackContent.includes(term)) score += 2;
      if (tags.some((t) => t.includes(term))) score += 2;
    }
    return score;
  }
}

export const knowledgeManager = new KnowledgeManager();
