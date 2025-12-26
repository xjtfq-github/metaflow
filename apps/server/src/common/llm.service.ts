/**
 * LLM 服务抽象层
 * 
 * 支持多种 LLM 提供商
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * OpenAI Provider
 */
export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(apiKey: string, baseURL = 'https://api.openai.com/v1', defaultModel = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.defaultModel = defaultModel;
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  }
}

/**
 * Ollama Provider (本地部署)
 */
export class OllamaProvider implements LLMProvider {
  name = 'Ollama';
  
  private baseURL: string;
  private defaultModel: string;

  constructor(baseURL = 'http://localhost:11434', defaultModel = 'llama2') {
    this.baseURL = baseURL;
    this.defaultModel = defaultModel;
  }

  async chat(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.message.content,
    };
  }
}

/**
 * Mock Provider (测试用)
 */
export class MockLLMProvider implements LLMProvider {
  name = 'Mock';

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const lastMessage = messages[messages.length - 1];
    
    // 简单的模拟响应
    if (lastMessage.content.includes('查询') || lastMessage.content.includes('query')) {
      return {
        content: JSON.stringify({
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      };
    }

    return {
      content: '这是一个模拟的AI响应。请配置真实的LLM提供商。',
    };
  }
}

/**
 * LLM 服务工厂
 */
export class LLMService {
  private provider: LLMProvider;

  constructor() {
    this.provider = this.createProvider();
  }

  private createProvider(): LLMProvider {
    const openaiKey = process.env.OPENAI_API_KEY;
    const ollamaURL = process.env.OLLAMA_BASE_URL;

    // 优先使用 OpenAI
    if (openaiKey && openaiKey !== 'your-openai-api-key-here') {
      return new OpenAIProvider(
        openaiKey,
        undefined,
        process.env.OPENAI_MODEL
      );
    }

    // 尝试 Ollama
    if (ollamaURL) {
      return new OllamaProvider(ollamaURL, process.env.OLLAMA_MODEL);
    }

    // 降级到 Mock
    console.warn('No LLM provider configured, using mock provider');
    return new MockLLMProvider();
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    return this.provider.chat(messages, options);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}

export const llmService = new LLMService();
