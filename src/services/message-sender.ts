import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { decrypt } from '../utils/encryption.js';
import { facebookApi, isConfigured } from './facebook-api.js';

/**
 * Gửi tin nhắn tới khách qua Facebook Send API.
 *
 * - Real mode: decrypt page token → gọi facebookApi.sendMessage → trả về fb message id
 * - Demo mode (chưa cấu hình FB): trả về null, caller chỉ lưu DB (khách không nhận)
 *
 * @param accountId     FacebookAccount.id (lấy accessToken + page)
 * @param recipientPsid PSID khách (Conversation.participantFacebookId)
 * @param text          Nội dung
 * @returns facebookMessageId | null (null = demo mode / gửi thất bại đã log)
 */
export async function sendToCustomer(
  accountId: string,
  recipientPsid: string,
  text: string
): Promise<string | null> {
  if (!isConfigured()) {
    logger.debug({ accountId }, 'Demo mode: skip Facebook Send API');
    return null;
  }

  try {
    const account = await prisma.facebookAccount.findUnique({
      where: { id: accountId },
      select: { accessToken: true, status: true },
    });
    if (!account || account.status !== 'active') {
      logger.warn({ accountId }, 'Account not active, cannot send');
      return null;
    }

    const pageToken = decrypt(account.accessToken);
    const fbMessageId = await facebookApi.sendMessage(pageToken, recipientPsid, text);
    logger.info({ accountId, recipientPsid, fbMessageId }, 'Message sent via Facebook Send API');
    return fbMessageId;
  } catch (err: any) {
    // Gửi thật thất bại → log nhưng không crash caller (caller vẫn lưu DB)
    logger.error({ accountId, recipientPsid, error: err.message }, 'Facebook send failed (saved to DB only)');
    return null;
  }
}
