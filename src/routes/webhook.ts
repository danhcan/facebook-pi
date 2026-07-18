import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { facebookWebhookService } from '../services/facebook-webhook.js';
import { FacebookMessagingEvent } from '../services/facebook-webhook.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = Router();

// GET /webhook/facebook - Webhook verification
router.get('/facebook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === config.facebook.webhookVerifyToken) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('Webhook verification failed');
    res.sendStatus(403);
  }
});

// POST /webhook/facebook - Receive messages
router.post('/facebook', asyncHandler(async (req: Request, res: Response) => {
  try {
    const body = req.body as FacebookMessagingEvent;
    
    if (body.object === 'page') {
      await facebookWebhookService.processEvent(body);
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    logger.error({ error }, 'Error processing webhook');
    // Always return 200 to Facebook to prevent retries
    res.status(200).send('EVENT_RECEIVED');
  }
}));

export { router as webhookRoutes };
