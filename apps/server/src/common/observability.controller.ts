import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { tracer } from './tracing';
import { metricsCollector } from './metrics';
import { prometheusExporter } from './prometheus';

@Controller('observability')
@ApiTags('观测与监控')
export class ObservabilityController {
  @Get('traces')
  @ApiOperation({ summary: '获取追踪数据' })
  getTraces(@Query('limit') limit?: string) {
    const traces = tracer.getCompletedSpans(limit ? parseInt(limit) : 100);
    return {
      success: true,
      data: traces,
    };
  }

  @Get('traces/:traceId')
  @ApiOperation({ summary: '获取指定追踪详情' })
  getTraceById(@Query('traceId') traceId: string) {
    const traces = tracer.getCompletedSpans();
    const trace = traces.filter((t: any) => t.traceId === traceId);
    return {
      success: true,
      data: trace,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: '获取指标数据(JSON)' })
  getMetrics() {
    const metrics = metricsCollector.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('metrics/prometheus')
  @ApiOperation({ summary: '获取Prometheus格式指标' })
  getPrometheusMetrics() {
    return prometheusExporter.export();
  }

  @Post('metrics/reset')
  @ApiOperation({ summary: '重置所有指标' })
  resetMetrics() {
    metricsCollector.reset();
    return {
      success: true,
      message: '指标已重置',
    };
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  healthCheck() {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  }

  @Get('logs')
  @ApiOperation({ summary: '获取结构化日志(模拟)' })
  getLogs(@Query('level') level?: string, @Query('limit') limit?: string) {
    // 模拟日志数据
    const logs = [
      {
        level: 'info',
        msg: 'Server started successfully',
        service: 'metaflow-server',
        timestamp: new Date().toISOString(),
        pid: process.pid,
      },
      {
        level: 'debug',
        msg: 'Cache hit for key: apps:list',
        service: 'metaflow-server',
        timestamp: new Date().toISOString(),
      },
      {
        level: 'warn',
        msg: 'Slow query detected',
        service: 'metaflow-server',
        timestamp: new Date().toISOString(),
        duration: 1250,
      },
    ];

    return {
      success: true,
      data: logs.slice(0, limit ? parseInt(limit) : 50),
    };
  }
}
