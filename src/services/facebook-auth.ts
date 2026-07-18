import fetch from 'node-fetch';
import { config } from '../config/index.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { logger } from '../utils/logger.js';

interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
}

export class FacebookAuthService {
  private readonly appId: string;
  private readonly appSecret: string;
  
  constructor() {
    this.appId = config.facebook.appId;
    this.appSecret = config.facebook.appSecret;
  }
  
  getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      state,
      scope: 'pages_messaging,pages_show_list',
      response_type: 'code',
    });
    
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }
  
  async exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string;
    expiresIn: number;
    userId: string;
    displayName: string;
  }> {
    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', this.appId);
    tokenUrl.searchParams.set('client_secret', this.appSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);
    
    const tokenResponse = await fetch(tokenUrl.toString());
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      logger.error({ error }, 'Failed to exchange code for token');
      throw new Error('Failed to exchange authorization code');
    }
    
    const tokenData = await tokenResponse.json() as FacebookTokenResponse;
    
    // Get user info
    const userUrl = new URL('https://graph.facebook.com/v19.0/me');
    userUrl.searchParams.set('fields', 'id,name,email');
    userUrl.searchParams.set('access_token', tokenData.access_token);
    
    const userResponse = await fetch(userUrl.toString());
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const userData = await userResponse.json() as FacebookUserInfo;
    
    return {
      accessToken: encrypt(tokenData.access_token),
      expiresIn: tokenData.expires_in,
      userId: userData.id,
      displayName: userData.name,
    };
  }
  
  async refreshToken(encryptedToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const token = decrypt(encryptedToken);
    
    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    url.searchParams.set('grant_type', 'fb_exchange_token');
    url.searchParams.set('client_id', this.appId);
    url.searchParams.set('client_secret', this.appSecret);
    url.searchParams.set('fb_exchange_token', token);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json() as FacebookTokenResponse;
    
    return {
      accessToken: encrypt(data.access_token),
      expiresIn: data.expires_in,
    };
  }
  
  async verifyToken(encryptedToken: string): Promise<boolean> {
    try {
      const token = decrypt(encryptedToken);
      
      const url = new URL('https://graph.facebook.com/v19.0/me');
      url.searchParams.set('access_token', token);
      
      const response = await fetch(url.toString());
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const facebookAuthService = new FacebookAuthService();
