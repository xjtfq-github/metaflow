/**
 * 速率限制中间件
 */

import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getTenantId } from '../tenant-context';
import { quotaManager } from '../quota.manager';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = getTenantId();
    
    if (!tenantId) {
      return next();
    }

    // 检查速率限制
    const allowed = await quotaManager.checkRateLimit(tenantId);
    
    if (!allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 增加计数
    quotaManager.incrementApiCalls(tenantId);

    next();
  }
}
