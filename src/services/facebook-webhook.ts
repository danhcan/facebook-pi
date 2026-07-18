import { logger } from '../utils/logger.js';
import { messageQueue } from '../config/queues.js';
import { classifyMessage } from '../utils/classifier.js';

export interface FacebookMessage {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url?: string };
    }>;
  };
}

export interface FacebookMessagingEvent {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: FacebookMessage[];
  }>;
}

export class FacebookWebhookService {
  async processEvent(event: FacebookMessagingEvent): Promise<void> {
    if (event.object !== 'page') {
      logger.warn({ object: event.object }, 'Unknown webhook object type');
      return;
    }
    
    for (const entry of event.entry) {
      for (const messaging of entry.messaging) {
        await this.processMessage(messaging);
      }
    }
  }
  
  private async processMessage(message: FacebookMessage): Promise<void> {
    const { sender, recipient, timestamp, message: msg } = message;
    
    if (!msg.text) {
      logger.info({ mid: msg.mid }, 'Non-text message received, skipping');
      return;
    }
    
    logger.info({
      mid: msg.mid,
      sender: sender.id,
      recipient: recipient.id,
    }, 'Processing incoming message');
    
    // Classify the message
    const classification = classifyMessage(msg.text);
    
    // Add to processing queue
    await messageQueue.add('process-message', {
      messageId: msg.mid,
      senderId: sender.id,
      recipientId: recipient.id,
      content: msg.text,
      classification,
      timestamp,
    }, {
      priority: this.getPriority(classification),
    });
    
    logger.info({
      mid: msg.mid,
      classification,
    }, 'Message queued for processing');
  }
  
  private getPriority(classification: string): number {
    switch (classification) {
      case 'complaint':
        return 1; // Highest priority
      case 'support':
        return 2;
      case 'pricing':
        return 3;
      default:
        return 5;
    }
  }
}

export const facebookWebhookService = new FacebookWebhookService();
