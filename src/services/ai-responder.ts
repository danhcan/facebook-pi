import { buildResponsePrompt } from '../utils/classifier.js';
import { logger } from '../utils/logger.js';

export interface GenerateResponseInput {
  content: string;
  classification: 'pricing' | 'complaint' | 'support' | 'general';
  knowledgeContext?: string;
}

export interface AiResponse {
  id: string;
  content: string;
  confidence: number;
}

/**
 * Rule-based AI responder (demo) — không cần LLM API key.
 * Sinh câu trả lời dựa trên loại tin nhắn + ngữ cảnh tri thức.
 *
 * Trong production: thay `generateResponse` bằng gọi LLM API (OpenAI/Anthropic)
 * với prompt từ `buildResponsePrompt`.
 */
export class AiResponder {
  async generateResponse(input: GenerateResponseInput): Promise<AiResponse> {
    const { content, classification, knowledgeContext } = input;

    logger.info({ classification, hasContext: !!knowledgeContext }, 'Generating AI response');

    const response = this.composeRuleBased(content, classification, knowledgeContext);

    return {
      id: crypto.randomUUID(),
      content: response.content,
      confidence: response.confidence,
    };
  }

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
