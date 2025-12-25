/**
 * 指标暴露端点
 */

import { Controller, Get } from '@nestjs/common';
import { prometheusExporter } from './prometheus';
import { metricsCollector } from './metrics';

@Controller()
export class MetricsController {
  /**
   * Prometheus 采集端点
   */
  @Get('/metrics')
  getMetrics(): string {
    return prometheusExporter.export();
  }

  /**
   * 健康检查
   */
  @Get('/health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * 就绪检查
   */
  @Get('/ready')
  ready() {
    // TODO: 检查数据库连接等
    return {
      status: 'ready',
      checks: {
        database: 'ok',
      },
    };
  }
}
