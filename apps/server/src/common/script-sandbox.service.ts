/**
 * 脚本执行沙箱服务
 * 使用 isolated-vm 实现安全的代码执行环境
 */

import ivm from 'isolated-vm';

export interface ScriptContext {
  // 数据库访问
  prisma?: any;
  // HTTP客户端
  http?: any;
  // 日志
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
  // 工具函数
  utils?: any;
  // 外部数据
  input?: any;
}

export interface ScriptExecutionResult {
  success: boolean;
  output?: any;
  logs?: string[];
  errors?: string[];
  executionTime: number;
}

export class ScriptSandbox {
  private isolate: ivm.Isolate;
  private context: ivm.Context;
  private logs: string[] = [];
  private errors: string[] = [];

  constructor(
    private options: {
      memoryLimit?: number; // MB
      timeout?: number; // ms
    } = {}
  ) {
    // 创建隔离的V8实例
    this.isolate = new ivm.Isolate({
      memoryLimit: options.memoryLimit || 128,
    });

    // 创建执行上下文
    this.context = this.isolate.createContextSync();
  }

  /**
   * 执行JavaScript代码
   */
  async execute(
    code: string,
    contextData: ScriptContext = {} as ScriptContext
  ): Promise<ScriptExecutionResult> {
    const startTime = Date.now();
    this.logs = [];
    this.errors = [];

    try {
      // 注入console
      await this.injectConsole();

      // 注入上下文数据
      await this.injectContext(contextData);

      // 编译脚本
      const script = await this.isolate.compileScript(code);

      // 执行脚本
      const result = await script.run(this.context, {
        timeout: this.options.timeout || 5000,
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: await this.extractResult(result),
        logs: this.logs,
        errors: this.errors,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.errors.push((error as Error).message);

      return {
        success: false,
        logs: this.logs,
        errors: this.errors,
        executionTime,
      };
    }
  }

  /**
   * 注入console对象
   */
  private async injectConsole(): Promise<void> {
    const jail = this.context.global;

    // 创建console对象
    await jail.set('console', {
      log: new ivm.Reference((...args: any[]) => {
        this.logs.push(args.map(String).join(' '));
      }),
      error: new ivm.Reference((...args: any[]) => {
        this.errors.push(args.map(String).join(' '));
      }),
      warn: new ivm.Reference((...args: any[]) => {
        this.logs.push('[WARN] ' + args.map(String).join(' '));
      }),
    });
  }

  /**
   * 注入上下文数据
   */
  private async injectContext(contextData: ScriptContext): Promise<void> {
    const jail = this.context.global;

    // 注入input数据
    if (contextData.input) {
      await jail.set('input', new ivm.ExternalCopy(contextData.input).copyInto());
    }

    // 注入工具函数
    if (contextData.utils) {
      await jail.set('utils', new ivm.ExternalCopy(contextData.utils).copyInto());
    }

    // 注入HTTP客户端（简化版）
    if (contextData.http) {
      await jail.set('http', {
        get: new ivm.Reference(async (url: string) => {
          // 实际调用需要通过回调传递
          return await contextData.http.get(url);
        }),
        post: new ivm.Reference(async (url: string, data: any) => {
          return await contextData.http.post(url, data);
        }),
      });
    }
  }

  /**
   * 提取执行结果
   */
  private async extractResult(result: any): Promise<any> {
    if (result && typeof result.copy === 'function') {
      return result.copy();
    }
    return result;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    if (this.context) {
      this.context.release();
    }
    if (this.isolate) {
      this.isolate.dispose();
    }
  }
}

/**
 * 快速执行脚本（一次性）
 */
export async function executeScript(
  code: string,
  context?: ScriptContext,
  options?: { memoryLimit?: number; timeout?: number }
): Promise<ScriptExecutionResult> {
  const sandbox = new ScriptSandbox(options);
  try {
    return await sandbox.execute(code, context);
  } finally {
    sandbox.dispose();
  }
}
