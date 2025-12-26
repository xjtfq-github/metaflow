import { Injectable } from '@nestjs/common';

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  name: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * 性能监控服务
 */
@Injectable()
export class PerformanceService {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly MAX_METRICS_PER_NAME = 1000; // 每个指标最多保留1000条记录

  /**
   * 记录性能指标
   */
  record(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const list = this.metrics.get(name)!;
    list.push(metric);

    // 限制数量，移除最旧的记录
    if (list.length > this.MAX_METRICS_PER_NAME) {
      list.shift();
    }
  }

  /**
   * 获取性能报告
   */
  getReport(name?: string): PerformanceReport[] {
    const reports: PerformanceReport[] = [];

    const names = name ? [name] : Array.from(this.metrics.keys());

    for (const metricName of names) {
      const list = this.metrics.get(metricName);
      if (!list || list.length === 0) continue;

      const durations = list.map(m => m.duration).sort((a, b) => a - b);
      
      reports.push({
        name: metricName,
        count: durations.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p50: this.percentile(durations, 50),
        p95: this.percentile(durations, 95),
        p99: this.percentile(durations, 99),
      });
    }

    return reports;
  }

  /**
   * 清除指标
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * 计算百分位数
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * 装饰器：自动记录函数执行时间
   */
  static Measure(metricName?: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
      const name = metricName || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: any[]) {
        const start = Date.now();
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - start;
          
          // 获取性能服务实例（需要注入）
          const perfService = (this as any).performanceService;
          if (perfService instanceof PerformanceService) {
            perfService.record(name, duration);
          }

          return result;
        } catch (error) {
          const duration = Date.now() - start;
          const perfService = (this as any).performanceService;
          if (perfService instanceof PerformanceService) {
            perfService.record(name, duration, { error: true });
          }
          throw error;
        }
      };

      return descriptor;
    };
  }
}

/**
 * 性能监控中间件
 */
export function performanceMiddleware(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = `${req.method} ${req.path}`;
    
    // 记录到全局性能服务
    // TODO: 注入性能服务实例
    console.log(`[PERF] ${path} - ${duration}ms`);
  });

  next();
}
