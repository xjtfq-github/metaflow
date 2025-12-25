/**
 * 结构化日志工具
 * 
 * 基于 Pino 的 JSON 日志输出
 */

export interface LogContext {
  traceId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * 日志级别
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 结构化日志器
 */
export class StructuredLogger {
  private context: LogContext = {};

  constructor(private serviceName: string) {}

  /**
   * 设置全局上下文
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * 记录日志
   */
  log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const logEntry = {
      level,
      msg: message,
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta,
    };

    // 输出 JSON 格式日志
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    this.log('error', message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }
}

/**
 * 创建日志器
 */
export function createLogger(serviceName: string): StructuredLogger {
  return new StructuredLogger(serviceName);
}
