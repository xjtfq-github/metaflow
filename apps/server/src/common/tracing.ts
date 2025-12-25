/**
 * OpenTelemetry 追踪集成
 * 
 * 自动插桩 HTTP + 数据库
 */

export interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, string | number>;
  events?: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

/**
 * 追踪器
 */
export class Tracer {
  private activeSpans: Map<string, Span> = new Map();
  private completedSpans: Span[] = [];

  /**
   * 开始 Span
   */
  startSpan(name: string, attributes?: Record<string, string | number>): string {
    const spanId = this.generateId();
    const traceId = this.getOrCreateTraceId();

    const span: Span = {
      traceId,
      spanId,
      name,
      startTime: Date.now(),
      attributes,
      events: [],
    };

    this.activeSpans.set(spanId, span);
    return spanId;
  }

  /**
   * 结束 Span
   */
  endSpan(spanId: string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    this.completedSpans.push(span);
    this.activeSpans.delete(spanId);
  }

  /**
   * 添加事件
   */
  addEvent(spanId: string, name: string, attributes?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.events?.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  /**
   * 获取完成的 Spans
   */
  getSpans(): Span[] {
    return this.completedSpans;
  }

  /**
   * 清空
   */
  clear(): void {
    this.completedSpans = [];
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private getOrCreateTraceId(): string {
    // TODO: 从 AsyncLocalStorage 获取
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * 自动插桩装饰器
 */
export function Trace(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracer = globalTracer;
      const spanName = operationName || `${target.constructor.name}.${propertyKey}`;
      const spanId = tracer.startSpan(spanName);

      try {
        const result = await originalMethod.apply(this, args);
        tracer.endSpan(spanId);
        return result;
      } catch (error) {
        tracer.addEvent(spanId, 'exception', {
          message: error instanceof Error ? error.message : String(error),
        });
        tracer.endSpan(spanId);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 全局追踪器
 */
export const globalTracer = new Tracer();
