import { config } from '../config/index.js';

export type MessageClassification = 'pricing' | 'complaint' | 'support' | 'general';

const PRICING_KEYWORDS = [
  'giá', 'bao nhiêu', 'cost', 'price', 'thanh toán', 'payment',
  'phí', 'fee', 'giá cả', 'bảng giá', 'khuyến mãi', 'discount',
];

const COMPLAINT_KEYWORDS = [
  'khiếu nại', 'complaint', 'không hài lòng', 'tệ', 'bad',
  'lỗi', 'error', 'broken', 'phản ánh', 'report', 'tố cáo',
];

const SUPPORT_KEYWORDS = [
  'hỗ trợ', 'help', 'cần giúp', 'assist', 'hướng dẫn', 'guide',
  'làm thế nào', 'how to', 'vấn đề', 'problem', 'sửa', 'fix',
];

function calculateScore(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 1;
    }
  }
  
  return score;
}

export function classifyMessage(content: string): MessageClassification {
  const scores = {
    pricing: calculateScore(content, PRICING_KEYWORDS),
    complaint: calculateScore(content, COMPLAINT_KEYWORDS),
    support: calculateScore(content, SUPPORT_KEYWORDS),
  };
  
  const maxScore = Math.max(scores.pricing, scores.complaint, scores.support);
  
  if (maxScore === 0) {
    return 'general';
  }
  
  if (scores.pricing === maxScore) return 'pricing';
  if (scores.complaint === maxScore) return 'complaint';
  return 'support';
}

export function buildClassificationPrompt(
  content: string,
  knowledgeContext?: string
): string {
  let prompt = `Phân loại tin nhắn sau đây thành một trong các loại: pricing, complaint, support, general.

Tin nhắn: "${content}"

`;
  
  if (knowledgeContext) {
    prompt += `Ngữ cảnh tri thức:\n${knowledgeContext}\n\n`;
  }
  
  prompt += `Trả lời chỉ với một từ: pricing, complaint, support, hoặc general.`;
  
  return prompt;
}

export function buildResponsePrompt(
  content: string,
  classification: MessageClassification,
  knowledgeContext?: string
): string {
  const classificationDescriptions: Record<MessageClassification, string> = {
    pricing: 'Câu hỏi về giá cả, thanh toán',
    complaint: 'Khiếu nại, phản ánh',
    support: 'Yêu cầu hỗ trợ, hướng dẫn',
    general: 'Tin nhắn chung',
  };
  
  let prompt = `Bạn là trợ lý AI trả lời tin nhắn Messenger cho doanh nghiệp.

Loại tin nhắn: ${classificationDescriptions[classification]}

Tin nhắn từ khách hàng: "${content}"

`;
  
  if (knowledgeContext) {
    prompt += `Thông tin tham khảo:\n${knowledgeContext}\n\n`;
  }
  
  prompt += `Hãy trả lời ngắn gọn, thân thiện và chuyên nghiệp. Trả lời bằng tiếng Việt.`;
  
  return prompt;
}
