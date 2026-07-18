import { logger } from '../utils/logger.js';
import { messageQueue } from '../config/queues.js';
import { prisma } from '../config/prisma.js';
import { decrypt } from '../utils/encryption.js';

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

  private async processMessage(messaging: FacebookMessage): Promise<void> {
    const { sender, recipient, message: msg } = messaging;

    // Skip if no text and no attachments
    if (!msg.text && !msg.attachments) {
      logger.info({ mid: msg.mid }, 'Empty message received, skipping');
      return;
    }

    const senderId = sender.id;
    const recipientId = recipient.id; // Page ID
    const text = msg.text || '[Attachment]';
    const mid = msg.mid;

    logger.info({ mid, senderId, recipientId }, 'Processing incoming message');

    try {
      // 1. Find FacebookAccount by pageId (recipientId)
      const account = await prisma.facebookAccount.findFirst({
        where: { facebookUserId: recipientId, status: 'active' },
      });

      if (!account) {
        logger.warn({ recipientId }, 'Received message for unknown page');
        return;
      }

      // 2. Find or create Conversation
      // facebookConversationId phải unique - kết hợp accountId + participantFacebookId
      const facebookConversationId = `${account.id}_${senderId}`;

      let conversation = await prisma.conversation.findUnique({
        where: { facebookConversationId },
      });

      if (!conversation) {
        // Get sender info from Facebook
        let senderName = 'Facebook User';
        try {
          const userInfo = await this.getSenderInfo(account.id, senderId);
          senderName = userInfo.name;
        } catch (err) {
          logger.warn({ senderId }, 'Failed to get sender info');
        }

        conversation = await prisma.conversation.create({
          data: {
            accountId: account.id,
            facebookConversationId,
            participantName: senderName,
            participantFacebookId: senderId,
            status: 'active',
          },
        });

        logger.info({ conversationId: conversation.id }, 'Created new conversation');
      }

      // 3. Create Message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'inbound',
          content: text,
          messageType: msg.attachments ? 'attachment' : 'text',
          senderId,
          facebookMessageId: mid,
          status: 'received',
        },
      });

      // 4. Queue message for AI processing
      if (messageQueue) {
        await messageQueue.add('process-message', {
          messageId: message.id,
          conversationId: conversation.id,
        });
        logger.info({ messageId: message.id }, 'Message queued for AI processing');
      } else {
        logger.warn({ messageId: message.id }, 'Queue unavailable, message not processed');
      }
    } catch (error: any) {
      logger.error({ error: error.message, senderId }, 'Failed to process message');
    }
  }

  /**
   * Get sender info (name, profile pic) from Facebook
   */
  private async getSenderInfo(
    accountId: string,
    senderId: string
  ): Promise<{ name: string; profilePic?: string }> {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return { name: 'Facebook User' };
    }

    // Decrypt page token
    const pageToken = decrypt(account.accessToken);

    // Call Facebook Graph API
    const params = new URLSearchParams({
      access_token: pageToken,
      fields: 'first_name,last_name,profile_pic',
    });

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${senderId}?${params.toString()}`
      );
      const data: any = await res.json();

      if (data.error) {
        logger.warn({ error: data.error }, 'Failed to get sender info');
        return { name: 'Facebook User' };
      }

      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      return {
        name: name || 'Facebook User',
        profilePic: data.profile_pic,
      };
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting sender info');
      return { name: 'Facebook User' };
    }
  }
}

export const facebookWebhookService = new FacebookWebhookService();
