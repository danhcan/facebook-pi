import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fbmessenger',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  facebook: {
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    webhookVerifyToken: process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || '',
    webhookUrl: process.env.FACEBOOK_WEBHOOK_URL || '',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'custom',
    baseUrl: process.env.LLM_BASE_URL || 'https://omniroute-production-5d2d.up.railway.app/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'hotro',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '500', 10),
    timeout: parseInt(process.env.LLM_TIMEOUT || '30000', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change!!',
  },
} as const;
