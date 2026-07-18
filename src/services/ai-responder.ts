import { llmClient, LLMMessage } from './llm-client.js';
import { buildResponsePrompt } from '../utils/classifier.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/prisma.js';

export interface GenerateResponseInput {
  content: string;
  classification: 'pricing' | 'complaint' | 'support' | 'general';
  knowledgeContext?: string;
  conversationId?: string;
}

export interface AiResponse {
  id: string;
  content: string;
  confidence: number;
  provider: string;
  modelUsed: string;
  tokensUsed: number;
  latencyMs: number;
  needsEscalation: boolean;
}

/**
 * Enhanced AI Responder with LLM integration and call escalation logic
 */
export class AiResponder {
  private confidenceThreshold = 0.6; // Below this = escalate to Zalo call

  async generateResponse(input: GenerateResponseInput): Promise<AiResponse> {
    const { content, classification, knowledgeContext, conversationId } = input;
    const startTime = Date.now();

    logger.info({ classification, hasContext: !!knowledgeContext }, 'Generating AI response');

    try {
      // Build conversation history context
      const conversationHistory = conversationId
        ? await this.getConversationHistory(conversationId, 5)
        : [];

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(classification, knowledgeContext);

      // Build messages array
      const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content },
      ];

      // Call LLM API
      const llmResponse = await llmClient.chat(messages);
      const latencyMs = Date.now() - startTime;

      // Analyze confidence (simple heuristic for now)
      const confidence = this.calculateConfidence(llmResponse.content, knowledgeContext);
      const needsEscalation = confidence < this.confidenceThreshold;

      logger.info(
        {
          confidence,
          needsEscalation,
          tokensUsed: llmResponse.tokensUsed,
          latencyMs,
        },
        'LLM response generated'
      );

      return {
        id: crypto.randomUUID(),
        content: llmResponse.content,
        confidence,
        provider: 'custom',
        modelUsed: llmResponse.model,
        tokensUsed: llmResponse.tokensUsed,
        latencyMs,
        needsEscalation,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      logger.error(
        {
          error: (error as Error).message,
          latencyMs,
        },
        'LLM API failed, falling back to rule-based'
      );

      // Fallback to rule-based
      const fallbackResponse = this.composeRuleBased(content, classification, knowledgeContext);

      return {
        id: crypto.randomUUID(),
        content: fallbackResponse.content,
        confidence: fallbackResponse.confidence,
        provider: 'rule-based',
        modelUsed: 'fallback',
        tokensUsed: 0,
        latencyMs,
        needsEscalation: fallbackResponse.confidence < this.confidenceThreshold,
      };
    }
  }

  /**
   * Get recent conversation history for context
   */
  private async getConversationHistory(
    conversationId: string,
    limit: number
  ): Promise<LLMMessage[]> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // Get more to have pairs
        select: {
          direction: true,
          content: true,
        },
      });

      // Reverse to chronological order
      messages.reverse();

      // Convert to LLM format
      const history: LLMMessage[] = [];
      for (const msg of messages) {
        if (msg.direction === 'inbound') {
          history.push({ role: 'user', content: msg.content });
        } else if (msg.direction === 'outbound') {
          history.push({ role: 'assistant', content: msg.content });
        }
      }

      // Keep only last N messages
      return history.slice(-limit);
    } catch (error) {
      logger.warn({ error, conversationId }, 'Failed to fetch conversation history');
      return [];
    }
  }

  /**
   * Build system prompt based on classification and knowledge
   */
  private buildSystemPrompt(classification: string, knowledgeContext?: string): string {
    let basePrompt = `Bạn là trợ lý CSKH chuyên nghiệp của công ty, trả lời khách hàng bằng tiếng Việt.

Nguyên tắc:
- Lịch sự, thân thiện, chuyên nghiệp
- Ngắn gọn, rõ ràng (2-3 câu)
- Dựa vào kiến thức được cung cấp
- Nếu không chắc chắn, hẹn sẽ liên hệ lại trong vòng 24h

Loại câu hỏi: ${this.getClassificationLabel(classification)}`;

    if (knowledgeContext) {
      basePrompt += `\n\nKiến thức liên quan:\n${knowledgeContext}`;
    }

    return basePrompt;
  }

  private getClassificationLabel(classification: string): string {
    const labels: Record<string, string> = {
      pricing: 'Hỏi giá / Báo giá',
      complaint: 'Khiếu nại / Phản ánh',
      support: 'Hỗ trợ kỹ thuật',
      general: 'Câu hỏi chung',
    };
    return labels[classification] || 'Chung';
  }

  /**
   * Calculate confidence score based on response characteristics
   * This is a simple heuristic - can be improved with more sophisticated methods
   */
  private calculateConfidence(content: string, knowledgeContext?: string): number {
    let confidence = 0.7; // Base confidence

    // Has knowledge context = higher confidence
    if (knowledgeContext) {
      confidence += 0.2;
    }

    // Check for uncertainty phrases
    const uncertaintyPhrases = [
      'không chắc chắn',
      'có thể',
      'không rõ',
      'không biết',
      'xin lỗi',
      'chưa có thông tin',
      'cần kiểm tra lại',
    ];

    const lowerContent = content.toLowerCase();
    for (const phrase of uncertaintyPhrases) {
      if (lowerContent.includes(phrase)) {
        confidence -= 0.3;
        break;
      }
    }

    // Response too short (< 20 chars) = lower confidence
    if (content.length < 20) {
      confidence -= 0.2;
    }

    // Response too long (> 500 chars) = might be over-explaining
    if (content.length > 500) {
      confidence -= 0.1;
    }

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Rule-based fallback (same as original implementation)
   */
  private composeRuleBased(
    content: string,
    classification: GenerateResponseInput['classification'],
    knowledgeContext?: string
  ): { content: string; confidence: number } {
    const ctx = knowledgeContext?.trim();

    // Nếu có tri thức liên quan, ưu tiên dùng nó → confidence cao hơn
    if (ctx) {
      return {
        content: `Chào bạn! Dựa trên thông tin của chúng tôi: ${ctx}\n\nNếu cần hỗ trợ thêm, bạn vui lòng cho biết nhé ạ.`,
        confidence: 0.9,
      };
    }

    // Fallback theo loại tin nhắn
    switch (classification) {
      case 'pricing':
        return {
          content:
            'Cảm ơn bạn đã quan tâm! Bạn vui lòng cho biết sản phẩm cụ thể bạn muốn hỏi giá để chúng tôi báo giá chính xác nhất nhé.',
          confidence: 0.75,
        };
      case 'complaint':
        return {
          content:
            'Chúng tôi rất tiếc về trải nghiệm của bạn. Bạn vui lòng mô tả chi tiết vấn đề (mã đơn, tình trạng) để chúng tôi xử lý trong vòng 24h ạ.',
          confidence: 0.7,
        };
      case 'support':
        return {
          content:
            'Chào bạn! Chúng tôi sẵn sàng hỗ trợ. Bạn vui lòng cung cấp thêm thông tin chi tiết về vấn đề cần giúp đỡ nhé.',
          confidence: 0.78,
        };
      case 'general':
      default:
        return {
          content:
            'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi bạn sớm nhất có thể. Bạn cần hỗ trợ gì thêm ạ?',
          confidence: 0.65,
        };
    }
  }
}

export const aiResponder = new AiResponder();
