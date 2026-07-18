import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Facebook Graph API service.
 *
 * Real mode (khi FACEBOOK_APP_ID/SECRET/WEBHOOK_VERIFY_TOKEN đã cấu hình):
 *   - getOAuthUrl: sinh URL dialog Facebook Login
 *   - exchangeCodeForToken: đổi authorization code → user access token
 *   - getLongLivedUserToken: đổi short-lived → long-lived (60 ngày)
 *   - getPages: lấy danh sách Page mà user quản lý + page access token
 *   - sendMessage: gửi tin nhắn qua Send API
 *
 * Demo mode (khi chưa cấu hình):
 *   - isConfigured = false → callers tự fallback logic demo (không gọi API thật)
 */

const GRAPH_API = 'https://graph.facebook.com/v19.0';
const OAUTH_BASE = 'https://www.facebook.com/v19.0/dialog/oauth';

/** Scope cần thiết: đọc tin nhắn + quản lý page + gửi tin nhắn */
export const OAUTH_SCOPES = [
  'pages_messaging',
  'pages_manage_metadata',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_engagement',
].join(',');

export function isConfigured(): boolean {
  return Boolean(
    config.facebook.appId &&
    config.facebook.appSecret &&
    config.facebook.webhookVerifyToken &&
    config.facebook.webhookVerifyToken !== 'your_webhook_verify_token'
  );
}

export interface PageInfo {
  id: string;            // Page ID
  name: string;          // Page name
  access_token: string;  // Page access token (long-lived)
  category?: string;
}

export interface OAuthUrlResult {
  url: string;
  state: string;
}

export class FacebookApiService {
  /**
   * Sinh URL OAuth dialog. Frontend redirect browser tới URL này.
   * Sau khi user đồng ý, Facebook redirect về redirect_uri kèm ?code=&state=
   */
  getOAuthUrl(redirectUri: string, state: string): OAuthUrlResult {
    if (!isConfigured()) {
      throw new Error('Facebook chưa cấu hình (thiếu FACEBOOK_APP_ID/SECRET)');
    }
    const params = new URLSearchParams({
      client_id: config.facebook.appId,
      redirect_uri: redirectUri,
      state,
      scope: OAUTH_SCOPES,
      response_type: 'code',
      auth_type: 'rerequest',
    });
    return { url: `${OAUTH_BASE}?${params.toString()}`, state };
  }

  /**
   * Bước 1: Đổi authorization code → short-lived user access token.
   * https://graph.facebook.com/v19.0/oauth/access_token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.facebook.appId,
      client_secret: config.facebook.appSecret,
      redirect_uri: redirectUri,
      code,
    });
    const res = await fetch(`${GRAPH_API}/oauth/access_token?${params.toString()}`, {
      method: 'GET',
    });
    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`OAuth exchange failed: ${data.error.message}`);
    }
    return data.access_token as string;
  }

  /**
   * Bước 2: Đổi short-lived user token → long-lived (60 ngày).
   * GET /oauth/access_token?grant_type=fb_exchange_token
   */
  async getLongLivedUserToken(shortLivedToken: string): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: config.facebook.appId,
      client_secret: config.facebook.appSecret,
      fb_exchange_token: shortLivedToken,
    });
    const res = await fetch(`${GRAPH_API}/oauth/access_token?${params.toString()}`);
    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`Long-lived exchange failed: ${data.error.message}`);
    }
    return data.access_token as string;
  }

  /**
   * Bước 3: Lấy danh sách Page user quản lý, kèm page access token.
   * GET /me/accounts?access_token=...
   */
  async getPages(userToken: string): Promise<PageInfo[]> {
    const params = new URLSearchParams({
      access_token: userToken,
      fields: 'id,name,access_token,category',
    });
    const res = await fetch(`${GRAPH_API}/me/accounts?${params.toString()}`);
    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`Get pages failed: ${data.error.message}`);
    }
    return (data.data || []) as PageInfo[];
  }

  /**
   * Lấy thông tin user Facebook (tên, id) từ token.
   */
  async getUserInfo(token: string): Promise<{ id: string; name: string }> {
    const params = new URLSearchParams({
      access_token: token,
      fields: 'id,name',
    });
    const res = await fetch(`${GRAPH_API}/me?${params.toString()}`);
    const data = await res.json() as any;
    if (data.error) {
      throw new Error(`Get user info failed: ${data.error.message}`);
    }
    return { id: data.id, name: data.name };
  }

  /**
   * Gửi tin nhắn text qua Send API.
   * https://developers.facebook.com/docs/messenger-platform/send-messages
   *
   * @param pageAccessToken  Page access token (lưu trong FacebookAccount.accessToken)
   * @param recipientPsid    PSID của người nhận (participantFacebookId)
   * @param text             Nội dung tin nhắn
   * @returns message_id từ Facebook (để lưu facebookMessageId)
   */
  async sendMessage(
    pageAccessToken: string,
    recipientPsid: string,
    text: string
  ): Promise<string> {
    const res = await fetch(`${GRAPH_API}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pageAccessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientPsid },
        message: { text },
        messaging_type: 'RESPONSE',
      }),
    });
    const data = await res.json() as any;
    if (data.error) {
      logger.error({ error: data.error }, 'Facebook Send API failed');
      throw new Error(`Send message failed: ${data.error.message}`);
    }
    return data.message_id as string;
  }

  /**
   * Endpoint webhook verification (cho Facebook App config).
   * Trả về echo challenge khi đúng verify token.
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === config.facebook.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }
}

export const facebookApi = new FacebookApiService();
