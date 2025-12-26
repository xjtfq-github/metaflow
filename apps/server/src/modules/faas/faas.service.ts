import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@metaflow/database';
import { executeScript } from '../../common/script-sandbox.service';

@Injectable()
export class FaasService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 创建自定义脚本
   */
  async createScript(data: {
    tenantId: string;
    name: string;
    description?: string;
    code: string;
    language?: string;
    trigger?: string;
    triggerConfig?: any;
    timeout?: number;
    memoryLimit?: number;
    createdBy: string;
  }) {
    return this.prisma.customScript.create({
      data: {
        ...data,
        triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : undefined,
      },
    });
  }

  /**
   * 获取脚本列表
   */
  async listScripts(tenantId: string, filters?: { enabled?: boolean }) {
    return this.prisma.customScript.findMany({
      where: {
        tenantId,
        ...(filters?.enabled !== undefined && { enabled: filters.enabled }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取脚本详情
   */
  async getScript(id: string) {
    return this.prisma.customScript.findUnique({
      where: { id },
      include: {
        executions: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        webhooks: true,
      },
    });
  }

  /**
   * 更新脚本
   */
  async updateScript(id: string, data: {
    name?: string;
    description?: string;
    code?: string;
    enabled?: boolean;
    trigger?: string;
    triggerConfig?: any;
    timeout?: number;
    memoryLimit?: number;
  }) {
    return this.prisma.customScript.update({
      where: { id },
      data: {
        ...data,
        triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : undefined,
      },
    });
  }

  /**
   * 删除脚本
   */
  async deleteScript(id: string) {
    return this.prisma.customScript.delete({
      where: { id },
    });
  }

  /**
   * 执行脚本
   */
  async executeScript(scriptId: string, input?: any, triggeredBy?: string) {
    const script = await this.prisma.customScript.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      throw new Error('Script not found');
    }

    if (!script.enabled) {
      throw new Error('Script is disabled');
    }

    // 创建执行记录
    const execution = await this.prisma.scriptExecution.create({
      data: {
        scriptId,
        status: 'running',
        input: input ? JSON.stringify(input) : undefined,
        triggeredBy,
      },
    });

    try {
      // 执行脚本
      const result = await executeScript(
        script.code,
        { 
          input,
          console: {
            log: () => {},
            error: () => {},
            warn: () => {},
          },
        },
        {
          memoryLimit: script.memoryLimit,
          timeout: script.timeout,
        }
      );

      // 更新执行记录
      await this.prisma.scriptExecution.update({
        where: { id: execution.id },
        data: {
          status: result.success ? 'success' : 'failed',
          output: result.output ? JSON.stringify(result.output) : undefined,
          logs: result.logs?.join('\n'),
          errors: result.errors?.join('\n'),
          executionTime: result.executionTime,
          completedAt: new Date(),
        },
      });

      return { ...result, executionId: execution.id };
    } catch (error) {
      // 更新执行记录
      await this.prisma.scriptExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          errors: (error as Error).message,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * 获取执行历史
   */
  async getExecutions(scriptId: string, limit = 50) {
    return this.prisma.scriptExecution.findMany({
      where: { scriptId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * 创建Webhook
   */
  async createWebhook(data: {
    tenantId: string;
    name: string;
    description?: string;
    url: string;
    secret?: string;
    method?: string;
    headers?: any;
    scriptId?: string;
    createdBy: string;
  }) {
    return this.prisma.webhook.create({
      data: {
        ...data,
        headers: data.headers ? JSON.stringify(data.headers) : undefined,
      },
    });
  }

  /**
   * 获取Webhook列表
   */
  async listWebhooks(tenantId: string) {
    return this.prisma.webhook.findMany({
      where: { tenantId },
      include: {
        script: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 处理Webhook请求
   */
  async handleWebhookRequest(
    webhookUrl: string,
    method: string,
    headers: any,
    body: any,
    query: any
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { url: webhookUrl },
      include: { script: true },
    });

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (!webhook.enabled) {
      throw new Error('Webhook is disabled');
    }

    // 记录请求
    const request = await this.prisma.webhookRequest.create({
      data: {
        webhookId: webhook.id,
        method,
        headers: JSON.stringify(headers),
        body: body ? JSON.stringify(body) : undefined,
        query: query ? JSON.stringify(query) : undefined,
      },
    });

    const startTime = Date.now();

    try {
      let response: any = { success: true };

      // 如果关联了脚本，执行脚本
      if (webhook.script) {
        const result = await this.executeScript(webhook.script.id, {
          method,
          headers,
          body,
          query,
        });
        response = result.output;
      }

      const responseTime = Date.now() - startTime;

      // 更新请求记录
      await this.prisma.webhookRequest.update({
        where: { id: request.id },
        data: {
          status: 200,
          response: JSON.stringify(response),
          responseTime,
        },
      });

      // 更新最后触发时间
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { lastTriggeredAt: new Date() },
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // 更新请求记录
      await this.prisma.webhookRequest.update({
        where: { id: request.id },
        data: {
          status: 500,
          error: (error as Error).message,
          responseTime,
        },
      });

      throw error;
    }
  }

  /**
   * 创建连接器
   */
  async createConnector(data: {
    tenantId: string;
    name: string;
    description?: string;
    type: string;
    config: any;
    credentials?: any;
    createdBy: string;
  }) {
    return this.prisma.connector.create({
      data: {
        ...data,
        config: JSON.stringify(data.config),
        credentials: data.credentials ? JSON.stringify(data.credentials) : undefined,
      },
    });
  }

  /**
   * 获取连接器列表
   */
  async listConnectors(tenantId: string, type?: string) {
    return this.prisma.connector.findMany({
      where: {
        tenantId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 测试连接器
   */
  async testConnector(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new Error('Connector not found');
    }

    const config = JSON.parse(connector.config);

    // 根据类型测试连接
    if (connector.type === 'http') {
      try {
        const response = await fetch(config.baseURL);
        return {
          success: response.ok,
          status: response.status,
          message: response.ok ? 'Connection successful' : 'Connection failed',
        };
      } catch (error) {
        return {
          success: false,
          message: (error as Error).message,
        };
      }
    }

    // 其他类型暂不实现
    return { success: true, message: 'Test not implemented for this connector type' };
  }
}
