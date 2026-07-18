import { Router } from 'express';
import { config } from '../config/index.js';
import { llmClient } from '../services/llm-client.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/settings/llm
 * Get current LLM configuration (API key masked)
 */
router.get('/llm', authenticate, (req, res) => {
  const apiKey = config.llm.apiKey;
  const maskedKey = apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : '';

  res.json({
    provider: config.llm.provider,
    baseUrl: config.llm.baseUrl,
    apiKey: maskedKey,
    hasApiKey: !!apiKey,
    model: config.llm.model,
    temperature: config.llm.temperature,
    maxTokens: config.llm.maxTokens,
    timeout: config.llm.timeout,
  });
});

/**
 * PUT /api/settings/llm
 * Update LLM configuration (in-memory only, not persisted to .env)
 * Note: For production, save to database or config store
 */
router.put('/llm', authenticate, (req, res) => {
  const { provider, baseUrl, apiKey, model, temperature, maxTokens, timeout } = req.body;

  // Update in-memory config (note: this won't persist across restarts)
  if (provider) (config.llm as any).provider = provider;
  if (baseUrl) (config.llm as any).baseUrl = baseUrl;
  if (apiKey && !apiKey.includes('...')) (config.llm as any).apiKey = apiKey;
  if (model) (config.llm as any).model = model;
  if (typeof temperature === 'number') (config.llm as any).temperature = temperature;
  if (typeof maxTokens === 'number') (config.llm as any).maxTokens = maxTokens;
  if (typeof timeout === 'number') (config.llm as any).timeout = timeout;

  const maskedKey = config.llm.apiKey
    ? `${config.llm.apiKey.slice(0, 6)}...${config.llm.apiKey.slice(-4)}`
    : '';

  res.json({
    message: 'LLM settings updated (in-memory, restart to reset)',
    provider: config.llm.provider,
    baseUrl: config.llm.baseUrl,
    apiKey: maskedKey,
    hasApiKey: !!config.llm.apiKey,
    model: config.llm.model,
    temperature: config.llm.temperature,
    maxTokens: config.llm.maxTokens,
    timeout: config.llm.timeout,
  });
});

/**
 * POST /api/settings/llm/test
 * Test LLM connection
 */
router.post('/llm/test', authenticate, async (req, res) => {
  try {
    const result = await llmClient.testConnection();

    if (result.success) {
      res.json({
        success: true,
        message: 'LLM connection successful',
        latencyMs: result.latencyMs,
        model: config.llm.model,
        baseUrl: config.llm.baseUrl,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'LLM connection failed',
        error: result.error,
        latencyMs: result.latencyMs,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: (error as Error).message,
    });
  }
});

export default router;
