import { Controller, Get, Post, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { CacheService } from './cache.service';

@Controller('performance')
@ApiTags('性能监控')
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceService,
    private readonly cacheService: CacheService
  ) {}

  @Get('report')
  @ApiOperation({ summary: '获取性能报告' })
  getPerformanceReport(@Query('name') name?: string) {
    const report = this.performanceService.getReport(name);
    return {
      success: true,
      data: report,
    };
  }

  @Delete('metrics')
  @ApiOperation({ summary: '清除性能指标' })
  clearMetrics(@Query('name') name?: string) {
    this.performanceService.clear(name);
    return {
      success: true,
      message: name ? `已清除 ${name} 的指标` : '已清除所有指标',
    };
  }

  @Get('cache/stats')
  @ApiOperation({ summary: '获取缓存统计' })
  getCacheStats() {
    const stats = this.cacheService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Post('cache/clear')
  @ApiOperation({ summary: '清空缓存' })
  clearCache() {
    this.cacheService.clear();
    return {
      success: true,
      message: '缓存已清空',
    };
  }

  @Get('system')
  @ApiOperation({ summary: '获取系统性能信息' })
  getSystemInfo() {
    const memUsage = process.memoryUsage();
    
    return {
      success: true,
      data: {
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()), // 秒
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }
}
