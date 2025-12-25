import { Injectable } from '@nestjs/common';

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
};

@Injectable()
export class AiQueryService {
  async textToQuery(input: {
    text: string;
    modelName?: string;
  }): Promise<Record<string, unknown>> {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

    const systemPrompt = [
      '你是一个数据查询助手。',
      '请把用户的自然语言查询转换为一个 JSON 对象。',
      '只输出 JSON，不要输出解释、Markdown、代码块。',
      'JSON 允许的顶层字段只有: where, orderBy, take, skip。',
      'where 只允许出现字段条件，不要包含任何 $ 前缀字段。',
      input.modelName ? `当前模型: ${input.modelName}` : undefined,
    ]
      .filter(Boolean)
      .join('\n');

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input.text },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Ollama error: ${res.status} ${detail}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const content = data.message?.content ?? '';
    const json = extractJsonObject(content);
    return sanitizeQuery(json);
  }
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = trimmed.slice(start, end + 1);
      return JSON.parse(slice) as unknown;
    }
    throw new Error('Invalid JSON from model');
  }
}

function sanitizeQuery(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    throw new Error('Query must be an object');
  }
  const v = value as Record<string, unknown>;

  const out: Record<string, unknown> = {};
  if (v.where && typeof v.where === 'object') {
    out.where = stripDollarKeys(v.where as Record<string, unknown>);
  }
  if (v.orderBy && typeof v.orderBy === 'object') {
    out.orderBy = v.orderBy;
  }
  if (typeof v.take === 'number') {
    out.take = v.take;
  }
  if (typeof v.skip === 'number') {
    out.skip = v.skip;
  }

  return out;
}

function stripDollarKeys(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    out[k] = v;
  }
  return out;
}
