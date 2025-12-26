# AI Copilot 使用指南

## 概述

MetaFlow AI Copilot 是基于大语言模型（LLM）的智能助手，旨在提升低代码平台的开发效率。

## 核心功能

### 1. 自然语言转查询（Text-to-Query）

将自然语言描述自动转换为 Prisma 查询条件。

**示例：**
```
输入: "查询最近10条状态为active的记录，按创建时间倒序排列"

输出:
{
  "where": { "status": "active" },
  "orderBy": { "createdAt": "desc" },
  "take": 10
}
```

**API:**
```bash
POST /api/copilot/text-to-query
{
  "modelName": "User",
  "naturalLanguage": "查询最近10条状态为active的记录",
  "schema": { ... }  // 可选，提供模型字段信息
}
```

### 2. AI生成数据模型（Generate Schema）

根据描述自动生成完整的数据模型定义。

**示例：**
```
输入: "创建一个用户管理模型，包含姓名、邮箱（唯一）、手机号字段"

输出:
{
  "id": "user-model",
  "displayName": "用户模型",
  "entityName": "User",
  "fields": [
    { "key": "name", "label": "姓名", "type": "string", "required": true },
    { "key": "email", "label": "邮箱", "type": "string", "required": true, "unique": true },
    { "key": "phone", "label": "手机号", "type": "string", "required": false }
  ],
  "version": "1.0.0"
}
```

**API:**
```bash
POST /api/copilot/generate-schema
{
  "description": "创建一个用户管理模型，包含姓名、邮箱、手机号字段"
}
```

### 3. AI生成页面布局（Generate Page）

根据描述自动生成页面布局结构。

**示例：**
```
输入: "创建一个用户列表页面，包含搜索框和表格"

输出:
{
  "id": "user-list-page",
  "name": "用户列表页面",
  "layout": {
    "type": "container",
    "children": [
      { "id": "search-1", "type": "Input", "props": { "placeholder": "搜索用户" } },
      { "id": "table-1", "type": "Table", "props": { ... } }
    ]
  }
}
```

**API:**
```bash
POST /api/copilot/generate-page
{
  "description": "创建一个用户列表页面，包含搜索框和表格"
}
```

### 4. 代码补全（Code Completion）

提供智能代码补全建议。

**API:**
```bash
POST /api/copilot/code-completion
{
  "context": "在表单中创建用户输入字段",
  "partialCode": "{ type: 'Input', props: { "
}
```

### 5. 错误诊断（Error Diagnosis）

分析错误并提供修复建议。

**API:**
```bash
POST /api/copilot/diagnose-error
{
  "error": "Cannot read property 'name' of undefined",
  "code": "const userName = user.name;"  // 可选
}
```

## LLM 提供商配置

系统支持多种 LLM 提供商，通过环境变量配置：

### OpenAI（推荐）

```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### Claude（备选）

```bash
ANTHROPIC_API_KEY=your-api-key-here
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### Ollama（本地免费）

```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

**安装 Ollama：**
```bash
# macOS
brew install ollama

# 启动服务
ollama serve

# 下载模型
ollama pull llama2
```

## 前端使用

### 1. AI助手浮动按钮

点击右下角的 AI 助手浮动按钮，打开 Copilot 抽屉：

```tsx
import { CopilotAssistant } from './components/CopilotAssistant';

<CopilotAssistant 
  visible={copilotVisible}
  onClose={() => setCopilotVisible(false)}
/>
```

### 2. AI功能演示页面

导航栏中的 "AI助手" 页面提供了完整的功能演示和测试界面。

## 架构设计

### LLM服务抽象层

```typescript
// 支持多提供商
interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>;
}

// 自动选择可用的提供商
class LLMService {
  private provider: LLMProvider;
  
  constructor() {
    // 优先级: OpenAI > Ollama > Mock
    this.provider = this.createProvider();
  }
}
```

### Copilot服务

```typescript
@Injectable()
class CopilotService {
  // Text-to-Query
  async textToQuery(modelName: string, naturalLanguage: string): Promise<any>
  
  // Generate Schema
  async generateSchema(description: string): Promise<any>
  
  // Generate Page Layout
  async generatePageLayout(description: string): Promise<any>
  
  // Code Completion
  async codeCompletion(context: string, partialCode: string): Promise<string[]>
  
  // Error Diagnosis
  async diagnoseError(error: string, code?: string): Promise<{ diagnosis, suggestions }>
}
```

## 最佳实践

### 1. 提示词优化

**好的提示词：**
- ✅ "查询最近30天内创建的、状态为active且优先级大于5的工单，按创建时间倒序，限制10条"

**不好的提示词：**
- ❌ "查询工单"

### 2. 温度参数调整

- **查询转换**：`temperature = 0.3`（低随机性，高准确性）
- **代码生成**：`temperature = 0.5`（平衡）
- **创意生成**：`temperature = 0.7`（更多创造性）

### 3. Token限制

根据任务复杂度设置合适的 `maxTokens`：
- 查询条件：500
- Schema生成：1000
- 页面布局：1500

## 性能优化

### 1. 响应缓存

对于相同的查询，缓存AI响应：

```typescript
const cache = new Map<string, any>();

async textToQuery(query: string) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  const result = await llmService.chat(...);
  cache.set(query, result);
  return result;
}
```

### 2. 流式响应

对于长文本生成，使用流式API：

```typescript
const response = await fetch('/api/copilot/stream', {
  method: 'POST',
  body: JSON.stringify({ prompt }),
});

const reader = response.body.getReader();
// 逐步读取和显示
```

## 安全考虑

### 1. API密钥保护

- ✅ 服务端配置，不暴露给前端
- ✅ 使用环境变量管理
- ❌ 不要在代码中硬编码

### 2. 输入验证

```typescript
// 验证用户输入长度
if (naturalLanguage.length > 1000) {
  throw new Error('Input too long');
}

// 防止注入攻击
const sanitized = sanitizeInput(naturalLanguage);
```

### 3. 速率限制

使用配额守卫限制API调用频率：

```typescript
@UseGuards(QuotaGuard)
@RequireQuota('rateLimit')
@Post('text-to-query')
async textToQuery() { ... }
```

## 故障排查

### 问题：LLM响应无法解析为JSON

**原因：** LLM可能返回带有说明文字的响应

**解决：**
```typescript
try {
  return JSON.parse(response.content);
} catch {
  // 提取JSON部分
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
}
```

### 问题：Ollama连接失败

**检查：**
```bash
# 确认Ollama服务运行
curl http://localhost:11434/api/tags

# 查看日志
ollama logs
```

### 问题：OpenAI API超时

**优化：**
```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000), // 30秒超时
});
```

## 扩展开发

### 添加新的AI功能

1. 在 `CopilotService` 中添加方法
2. 在 `CopilotController` 中添加API端点
3. 在前端组件中调用API

**示例：添加代码重构功能**

```typescript
// Service
async refactorCode(code: string, instructions: string): Promise<string> {
  const messages: LLMMessage[] = [
    { role: 'system', content: '你是代码重构专家' },
    { role: 'user', content: `重构以下代码：\n${code}\n\n要求：${instructions}` },
  ];
  const response = await llmService.chat(messages);
  return response.content;
}

// Controller
@Post('refactor-code')
async refactorCode(@Body() dto: RefactorDto) {
  const result = await this.copilotService.refactorCode(dto.code, dto.instructions);
  return { success: true, data: result };
}
```

## 参考资料

- [OpenAI API文档](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude文档](https://docs.anthropic.com/)
- [Ollama文档](https://github.com/ollama/ollama)
- [Prisma查询语法](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
