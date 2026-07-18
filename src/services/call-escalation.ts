import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { websocketService } from './websocket.js';

export interface CreateCallRequestInput {
  conversationId: string;
  customerId: string;
  customerName: string;
  reason: string;
  confidence?: number;
}

export interface CallRequestResult {
  id: string;
  created: boolean;
}

/**
 * Service to handle escalation to Zalo calls when AI confidence is low
 */
export class CallEscalationService {
  /**
   * Create a Zalo call request based on AI confidence
   */
  async createCallRequest(input: CreateCallRequestInput): Promise<CallRequestResult> {
    const { conversationId, customerId, customerName, reason, confidence = 0 } = input;

    try {
      // Determine priority based on confidence and reason
      const priority = this.determinePriority(confidence, reason);

      logger.info(
        {
          conversationId,
          reason,
          confidence,
          priority,
        },
        'Creating Zalo call request'
      );

      // Create the call request
      const callRequest = await prisma.zaloCallRequest.create({
        data: {
          conversationId,
          customerId,
          customerName,
          reason,
          priority,
          status: 'pending',
          scheduledAt: this.calculateScheduledTime(priority),
        },
      });

      logger.info(
        {
          callRequestId: callRequest.id,
          priority,
        },
        'Zalo call request created'
      );

      // Broadcast notification to all connected agents via WebSocket
      websocketService.broadcastAll({
        type: 'zalo_call_request',
        data: {
          id: callRequest.id,
          conversationId,
          customerName,
          reason,
          priority,
          createdAt: callRequest.createdAt,
        },
      });

      return {
        id: callRequest.id,
        created: true,
      };
    } catch (error) {
      logger.error(
        {
          error: (error as Error).message,
          conversationId,
        },
        'Failed to create call request'
      );
      throw error;
    }
  }

  /**
   * Determine priority based on confidence score and reason
   */
  private determinePriority(confidence: number, reason: string): string {
    // Complaint always high priority
    if (reason.includes('complaint')) {
      return 'high';
    }

    // Very low confidence = urgent
    if (confidence < 0.3) {
      return 'urgent';
    }

    // Low confidence = high
    if (confidence < 0.5) {
      return 'high';
    }

    // Medium confidence = normal
    return 'normal';
  }

  /**
   * Calculate scheduled time based on priority
   */
  private calculateScheduledTime(priority: string): Date {
    const now = new Date();
    let minutesFromNow = 30; // Default

    switch (priority) {
      case 'urgent':
        minutesFromNow = 5;
        break;
      case 'high':
        minutesFromNow = 15;
        break;
      case 'normal':
        minutesFromNow = 30;
        break;
      case 'low':
        minutesFromNow = 60;
        break;
    }

    return new Date(now.getTime() + minutesFromNow * 60 * 1000);
  }

  /**
   * Get confirmation message for customer when call is requested
   */
  getConfirmationMessage(priority: string): string {
    const timeMap: Record<string, string> = {
      urgent: '5 phút',
      high: '15 phút',
      normal: '30 phút',
      low: '1 giờ',
    };

    const timeStr = timeMap[priority] || '30 phút';

    return `Câu hỏi của bạn cần tư vấn chi tiết hơn. Chúng tôi sẽ gọi Zalo cho bạn trong vòng ${timeStr}. Vui lòng để ý điện thoại nhé! 📞`;
  }

  /**
   * Check if conversation already has pending call request
   */
  async hasPendingRequest(conversationId: string): Promise<boolean> {
    const existing = await prisma.zaloCallRequest.findFirst({
      where: {
        conversationId,
        status: { in: ['pending', 'assigned'] },
      },
    });

    return !!existing;
  }
}

export const callEscalationService = new CallEscalationService();
