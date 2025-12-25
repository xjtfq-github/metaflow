/**
 * Prometheus 指标导出
 * 
 * 兼容 Prometheus 文本格式
 */

import { metricsCollector } from './metrics';

/**
 * Prometheus 导出器
 */
export class PrometheusExporter {
  /**
   * 导出 Prometheus 格式指标
   */
  export(): string {
    const metrics = metricsCollector.getMetrics();
    const lines: string[] = [];

    // 按名称分组
    const grouped = new Map<string, typeof metrics>();
    for (const metric of metrics) {
      const group = grouped.get(metric.name) || [];
      group.push(metric);
      grouped.set(metric.name, group);
    }

    // 生成 Prometheus 格式
    for (const [name, metricGroup] of grouped.entries()) {
      // # HELP
      lines.push(`# HELP ${name} Generated metric`);
      
      // # TYPE
      const type = this.inferType(name);
      lines.push(`# TYPE ${name} ${type}`);

      // 指标值
      for (const metric of metricGroup) {
        const labels = this.formatLabels(metric.labels);
        lines.push(`${name}${labels} ${metric.value} ${metric.timestamp}`);
      }

      lines.push(''); // 空行分隔
    }

    return lines.join('\n');
  }

  private inferType(name: string): string {
    if (name.includes('_total')) return 'counter';
    if (name.includes('_duration') || name.includes('_p50') || name.includes('_p95') || name.includes('_p99')) {
      return 'histogram';
    }
    return 'gauge';
  }

  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return '';
    
    const pairs = Object.entries(labels).map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }
}

/**
 * Prometheus 中间件
 */
export function createPrometheusMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { goldenSignals } = require('./metrics');

      goldenSignals.recordRequest(req.path, req.method);
      goldenSignals.recordLatency(req.path, duration);

      if (res.statusCode >= 400) {
        goldenSignals.recordError(req.path, res.statusCode);
      }
    });

    next();
  };
}

/**
 * 全局导出器
 */
export const prometheusExporter = new PrometheusExporter();
