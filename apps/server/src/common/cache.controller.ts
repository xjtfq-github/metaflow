import { Controller, Get, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CacheService } from './cache.service';

@ApiTags('Cache')
@Controller('api/cache')
export class CacheController {
  constructor(private readonly cacheService: CacheService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  getStats() {
    return this.cacheService.getStats();
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear all cache' })
  clearCache() {
    this.cacheService.clear();
    return { message: 'Cache cleared successfully' };
  }
}
