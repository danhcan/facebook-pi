import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { aiResponder } from './ai-responder.js';
import { knowledgeManager } from './knowledge-manager.js';
import { sendToCustomer } from './message-sender.js';
import { callEscalationService } from './call-escalation.js';

export interface ProcessMessageInput {
  messageId: string;
  accountId?: string;
  conversationId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  classification: string;
  timestamp: number;
  autoReplyMode?: 'automatic' | 'manual' | 'mixed';
}

export class MessageProcessor {
  async process(input: ProcessMessageInput): Promise<void> {
    const {
      messageId,
      accountId,
      conversationId,
      senderId,
      recipientId,
      content,
      classification,
      timestamp,
      autoReplyMode = 'automatic',
    } = input;

    logger.info(
      { messageId, senderId, classification, autoReplyMode },
      'Processing message'
    );

    try {
      // 0. Resolve accountId từ recipientId nếu thiếu (webhook flow)
      let resolvedAccountId = accountId;
      if (!resolvedAccountId) {
        const account = await prisma.facebookAccount.findFirst({
          where: { facebookUserId: recipientId },
        });
        if (!account) {
          logger.warn({ recipientId }, 'No account found for recipient, skipping');
          return;
        }
        resolvedAccountId = account.id;
      }

      // 1. Tìm hoặc tạo conversation
      let convId = conversationId;
      if (!convId) {
        const conv = await prisma.conversation.findFirst({
          where: { accountId: resolvedAccountId, participantFacebookId: senderId },
        });
        convId = conv?.id;
      }

      if (!convId) {
        // Tạo conversation mới
        const conv = await prisma.conversation.create({
          data: {
            accountId: resolvedAccountId,
            facebookConversationId: `${resolvedAccountId}_${senderId}_${messageId}`,
            participantName: `Khách ${senderId.slice(-4)}`,
            participantFacebookId: senderId,
            status: 'active',
            autoReplyMode,
          },
        });
        convId = conv.id;
      }

      // 2. Lưu tin nhắn inbound
      const message = await prisma.message.create({
        data: {
          conversationId: convId,
          direction: 'inbound',
          content,
          messageType: 'text',
          classification,
          senderId,
          facebookMessageId: messageId,
          status: 'received',
          createdAt: new Date(timestamp),
        },
      });

      // 3. Tìm tri thức liên quan
      const knowledgeResults = await knowledgeManager.searchRelevant(content, 1);
      const knowledgeContext = knowledgeResults[0]?.content;

      // 4. Sinh câu trả lời AI (với LLM integration)
      const aiResponse = await aiResponder.generateResponse({
        content,
        classification: classification as any,
        knowledgeContext,
        conversationId: convId,
      });

      // 5. Lưu AiResponse với monitoring data
      const saved = await prisma.aiResponse.create({
        data: {
          messageId: message.id,
          content: aiResponse.content,
          confidence: aiResponse.confidence,
          status: 'pending',
          provider: aiResponse.provider,
          modelUsed: aiResponse.modelUsed,
          tokensUsed: aiResponse.tokensUsed,
          latencyMs: aiResponse.latencyMs,
        },
      });

      // 5a. Check if escalation needed (low confidence → Zalo call)
      if (aiResponse.needsEscalation) {
        const hasPending = await callEscalationService.hasPendingRequest(convId);

        if (!hasPending) {
          const conv = await prisma.conversation.findUnique({
            where: { id: convId },
            select: { participantName: true, participantFacebookId: true },
          });

          if (conv) {
            // Create Zalo call request
            await callEscalationService.createCallRequest({
              conversationId: convId,
              customerId: conv.participantFacebookId,
              customerName: conv.participantName,
              reason: 'low_confidence',
              confidence: aiResponse.confidence,
            });

            // Send confirmation message to customer
            const priority =
              aiResponse.confidence < 0.3
                ? 'urgent'
                : aiResponse.confidence < 0.5
                ? 'high'
                : 'normal';
            const confirmMsg = callEscalationService.getConfirmationMessage(priority);

            await sendToCustomer(resolvedAccountId, senderId, confirmMsg);
            await prisma.message.create({
              data: {
                conversationId: convId,
                direction: 'outbound',
                content: confirmMsg,
                messageType: 'text',
                senderId: recipientId,
                status: 'sent',
                sentAt: new Date(),
              },
            });

            logger.info(
              { responseId: saved.id, confidence: aiResponse.confidence },
              'Call escalation triggered'
            );
          }
        }
      }

      // 6. Nếu chế độ automatic → tự gửi (đánh dấu sent + tạo message outbound)
      if (autoReplyMode === 'automatic') {
        // Gửi qua Facebook Send API (real mode) hoặc skip (demo mode)
        const fbMessageId = await sendToCustomer(
          resolvedAccountId,
          senderId,
          aiResponse.content
        );
        await prisma.aiResponse.update({
          where: { id: saved.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        await prisma.message.create({
          data: {
            conversationId: convId,
            direction: 'outbound',
            content: aiResponse.content,
            messageType: 'text',
            senderId: recipientId,
            facebookMessageId: fbMessageId || undefined,
            status: 'sent',
            sentAt: new Date(),
          },
        });
        logger.info({ responseId: saved.id, fbMessageId }, 'AI auto-reply sent');
      } else {
        logger.info({ responseId: saved.id }, 'AI response pending approval');
      }
    } catch (error) {
      logger.error({ messageId, error }, 'Failed to process message');
      throw error;
    }
  }
}

export const messageProcessor = new MessageProcessor();
