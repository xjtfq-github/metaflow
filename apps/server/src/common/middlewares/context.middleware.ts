/**
 * 上下文中间件
 * 
 * 功能:
 * 1. 提取或生成 TraceID
 * 2. 提取 TenantID 和 UserID
 * 3. 存储到 AsyncLocalStorage
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { runWithContext, RequestContext } from '../als.context';
import { randomUUID } from 'crypto';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 提取或生成 TraceID
    const traceId = 
      (req.headers['x-trace-id'] as string) || 
      `trace-${Date.now()}-${randomUUID()}`;

    // 提取 TenantID
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    // 提取 UserID (从 JWT 或 Session)
    const userId = (req as any).user?.id;

    // 构建上下文
    const context: RequestContext = {
      traceId,
      tenantId,
      userId,
      timestamp: Date.now(),
    };

    // 将 TraceID 添加到响应头
    res.setHeader('x-trace-id', traceId);

    // 在 ALS 上下文中执行后续中间件
    runWithContext(context, () => {
      next();
    });
  }
}
