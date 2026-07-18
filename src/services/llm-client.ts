import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  model: string;
}

export interface LLMError {
  error: string;
  details?: string;
}

/**
 * LLM Client for custom provider (OpenAI-compatible API)
 * Supports retry logic with exponential backoff
 */
export class LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private maxRetries = 3;

  constructor() {
    this.baseUrl = config.llm.baseUrl;
    this.apiKey = config.llm.apiKey;
    this.timeout = config.llm.timeout;
  }

  /**
   * Call LLM API with retry logic
   */
  async chat(messages: LLMMessage[], options?: Partial<LLMRequest>): Promise<LLMResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info({ attempt, messages: messages.length }, 'Calling LLM API');

        const response = await this.makeRequest(messages, options);
        const latency = Date.now() - startTime;

        logger.info({ latency, tokensUsed: response.tokensUsed }, 'LLM API call successful');

        return response;
      } catch (error) {
        lastError = error as Error;
        const latency = Date.now() - startTime;

        logger.warn(
          {
            attempt,
            maxRetries: this.maxRetries,
            error: lastError.message,
            latency,
          },
          'LLM API call failed'
        );

        // Don't retry on last attempt
        if (attempt < this.maxRetries) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          logger.info({ backoffMs }, 'Retrying after backoff');
          await this.sleep(backoffMs);
        }
      }
    }

    // All retries failed
    throw new Error(`LLM API failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Make actual HTTP request to LLM API
   */
  private async makeRequest(
    messages: LLMMessage[],
    options?: Partial<LLMRequest>
  ): Promise<LLMResponse> {
    const requestBody: LLMRequest = {
      model: options?.model || config.llm.model,
      messages,
      temperature: options?.temperature ?? config.llm.temperature,
      max_tokens: options?.max_tokens ?? config.llm.maxTokens,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;

      // Parse OpenAI-compatible response format
      const content = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;
      const model = data.model || requestBody.model;

      if (!content) {
        throw new Error('Empty response from LLM API');
      }

      return {
        content,
        tokensUsed,
        model,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new Error(`LLM API timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Test connection to LLM API
   */
  async testConnection(): Promise<{ success: boolean; error?: string; latencyMs?: number }> {
    const startTime = Date.now();

    try {
      const response = await this.chat([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
      ]);

      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;

      return {
        success: false,
        error: (error as Error).message,
        latencyMs,
      };
    }
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const llmClient = new LLMClient();
