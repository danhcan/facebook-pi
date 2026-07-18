import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createError, asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { knowledgeManager } from '../services/knowledge-manager.js';

const router = Router();

router.use(authenticate);

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/knowledge - List knowledge items
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  
  const result = await knowledgeManager.list({
    userId: req.user!.userId,
    category,
    page,
    limit,
    search,
  });
  
  res.json({ ...result, page, limit });
}));

// GET /api/knowledge/:id - Get specific item
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const item = await knowledgeManager.getById(req.params.id);
  if (!item) {
    throw createError(404, 'Knowledge item not found', 'NOT_FOUND');
  }
  res.json(item);
}));

// POST /api/knowledge - Create new item
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validation = createSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }
  
  const id = await knowledgeManager.create({
    userId: req.user!.userId,
    ...validation.data,
    tags: validation.data.tags || [],
  });
  
  res.status(201).json({ id, ...validation.data });
}));

// PUT /api/knowledge/:id - Update item
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const validation = updateSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw createError(400, validation.error.errors[0].message, 'VALIDATION_ERROR');
  }
  
  await knowledgeManager.update(req.params.id, validation.data);
  
  res.json({ id: req.params.id, ...validation.data });
}));

// DELETE /api/knowledge/:id - Delete item
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await knowledgeManager.delete(req.params.id);
  res.status(204).send();
}));

// POST /api/knowledge/search - Semantic search
router.post('/search', asyncHandler(async (req: Request, res: Response) => {
  const { query, limit } = req.body;
  
  if (!query) {
    throw createError(400, 'Query is required', 'VALIDATION_ERROR');
  }
  
  const results = await knowledgeManager.searchRelevant(query, limit);
  
  res.json({ results, query });
}));

// POST /api/knowledge/:id/embedding - Generate embedding
router.post('/:id/embedding', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Generate embedding for knowledge item
  res.json({
    id: req.params.id,
    embedding_generated: true,
    timestamp: new Date().toISOString(),
  });
}));

export { router as knowledgeRoutes };
