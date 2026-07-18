import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { accountRoutes } from './routes/accounts.js';
import { conversationRoutes } from './routes/conversations.js';
import { knowledgeRoutes } from './routes/knowledge.js';
import { historyRoutes } from './routes/history.js';
import { webhookRoutes } from './routes/webhook.js';
import { aiResponseRoutes } from './routes/ai-responses.js';
import { statsRoutes } from './routes/stats.js';
import { authRoutes } from './routes/auth.js';

export function createApp(): express.Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/ai-responses', aiResponseRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/webhook', webhookRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
