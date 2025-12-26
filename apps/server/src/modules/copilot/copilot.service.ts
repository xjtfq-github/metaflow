import { Injectable } from '@nestjs/common';
import { llmService, LLMMessage } from '../../common/llm.service';

@Injectable()
export class CopilotService {
  /**
   * Text-to-Query: 自然语言转查询条件
   */
  async textToQuery(modelName: string, naturalLanguage: string, schema?: any): Promise<any> {
    const systemPrompt = this.buildQuerySystemPrompt(modelName, schema);
    
    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: naturalLanguage },
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.3, // 降低随机性，提高准确性
      maxTokens: 500,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      // 尝试提取JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse LLM response as JSON');
    }
  }

  /**
   * 生成 DSL Schema
   */
  async generateSchema(description: string): Promise<any> {
    const systemPrompt = `你是一个低代码平台的 Schema 设计专家。
根据用户的描述，生成符合以下格式的 ModelDSL JSON:

{
  "id": "唯一ID",
  "displayName": "显示名称",
  "entityName": "实体名称",
  "description": "描述",
  "fields": [
    {
      "key": "字段key",
      "label": "字段标签",
      "type": "string|number|boolean|date|json",
      "required": true|false,
      "unique": true|false
    }
  ],
  "version": "1.0.0",
  "timestamps": true,
  "relations": []
}

只返回JSON，不要有其他说明文字。`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.5,
      maxTokens: 1000,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to generate schema');
    }
  }

  /**
   * 生成页面布局
   */
  async generatePageLayout(description: string): Promise<any> {
    const systemPrompt = `你是一个低代码平台的页面设计专家。
根据用户的描述，生成符合以下格式的 PageDSL JSON:

{
  "id": "页面ID",
  "name": "页面名称",
  "layout": {
    "type": "container",
    "children": [
      {
        "id": "组件ID",
        "type": "Table|Form|Button|Input等",
        "props": {...组件属性}
      }
    ]
  }
}

常用组件类型: Table, Form, Input, Button, Select, DatePicker
只返回JSON，不要其他文字。`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: description },
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to generate page layout');
    }
  }

  /**
   * 代码补全建议
   */
  async codeCompletion(context: string, partialCode: string): Promise<string[]> {
    const systemPrompt = `你是一个低代码平台的代码助手。
根据上下文和部分代码，提供3个补全建议。
只返回JSON数组，格式: ["建议1", "建议2", "建议3"]`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `上下文: ${context}\n\n部分代码: ${partialCode}` },
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.8,
      maxTokens: 300,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [response.content];
    }
  }

  /**
   * 错误诊断和修复建议
   */
  async diagnoseError(error: string, code?: string): Promise<{
    diagnosis: string;
    suggestions: string[];
  }> {
    const systemPrompt = `你是一个低代码平台的错误诊断专家。
分析错误信息，提供诊断和修复建议。
返回格式:
{
  "diagnosis": "错误诊断",
  "suggestions": ["修复建议1", "修复建议2"]
}`;

    const userContent = code 
      ? `错误信息: ${error}\n\n相关代码:\n${code}`
      : `错误信息: ${error}`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const response = await llmService.chat(messages, {
      temperature: 0.5,
      maxTokens: 800,
    });

    try {
      return JSON.parse(response.content);
    } catch (error) {
      return {
        diagnosis: response.content,
        suggestions: [],
      };
    }
  }

  /**
   * 构建查询系统提示
   */
  private buildQuerySystemPrompt(modelName: string, schema?: any): string {
    let prompt = `你是一个数据查询专家。将自然语言转换为 Prisma 查询条件 JSON。

返回格式:
{
  "where": {...过滤条件},
  "orderBy": {...排序},
  "take": 数量限制,
  "skip": 跳过数量
}

支持的操作符:
- equals: 等于
- contains: 包含
- startsWith: 以...开头
- endsWith: 以...结尾
- gt, gte, lt, lte: 大于、大于等于、小于、小于等于
- in: 在列表中
- not: 取反

`;

    if (schema) {
      prompt += `\n模型 ${modelName} 的字段:\n${JSON.stringify(schema, null, 2)}\n`;
    }

    prompt += '\n只返回JSON，不要其他说明文字。';

    return prompt;
  }
}
