/**
 * 指标收集器
 * 
 * Golden Signals: Latency, Traffic, Errors, Saturation
 */

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

/**
 * 指标类型
 */
export type MetricType = 'counter' | 'gauge' | 'histogram';

/**
 * 指标收集器
 */
export class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  /**
   * 增加计数器
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  /**
   * 设置仪表盘值
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.metrics.set(key, value);
  }

  /**
   * 记录直方图
   */
  observe(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * 获取所有指标
   */
  getMetrics(): Metric[] {
    const metrics: Metric[] = [];

    // 计数器和仪表盘
    for (const [key, value] of this.metrics.entries()) {
      const { name, labels } = this.parseKey(key);
      metrics.push({
        name,
        value,
        labels,
        timestamp: Date.now(),
      });
    }

    // 直方图 (计算分位数)
    for (const [key, values] of this.histograms.entries()) {
      const { name, labels } = this.parseKey(key);
      const sorted = values.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      metrics.push(
        { name: `${name}_p50`, value: p50, labels, timestamp: Date.now() },
        { name: `${name}_p95`, value: p95, labels, timestamp: Date.now() },
        { name: `${name}_p99`, value: p99, labels, timestamp: Date.now() }
      );
    }

    return metrics;
  }

  /**
   * 清空指标
   */
  reset(): void {
    this.metrics.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private parseKey(key: string): { name: string; labels?: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) return { name: key };

    const name = match[1];
    const labelsStr = match[2];

    if (!labelsStr) return { name };

    const labels: Record<string, string> = {};
    labelsStr.split(',').forEach((pair) => {
      const [k, v] = pair.split('=');
      labels[k] = v.replace(/"/g, '');
    });

    return { name, labels };
  }
}

/**
 * Golden Signals 辅助函数
 */
export class GoldenSignals {
  constructor(private collector: MetricsCollector) {}

  /**
   * 记录请求延迟
   */
  recordLatency(endpoint: string, durationMs: number): void {
    this.collector.observe('http_request_duration_ms', durationMs, { endpoint });
  }

  /**
   * 记录请求数 (Traffic)
   */
  recordRequest(endpoint: string, method: string): void {
    this.collector.increment('http_requests_total', 1, { endpoint, method });
  }

  /**
   * 记录错误
   */
  recordError(endpoint: string, statusCode: number): void {
    this.collector.increment('http_errors_total', 1, {
      endpoint,
      status: String(statusCode),
    });
  }

  /**
   * 记录饱和度 (CPU/内存)
   */
  recordSaturation(resource: string, percentage: number): void {
    this.collector.gauge('resource_saturation', percentage, { resource });
  }
}

/**
 * 全局指标收集器
 */
export const metricsCollector = new MetricsCollector();
export const goldenSignals = new GoldenSignals(metricsCollector);
