import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, tenantMiddleware } from '@metaflow/database';
import { getTenantId } from './tenant-context';

/**
 * 全局 Prisma 服务
 * 
 * 功能:
 * 1. 管理 PrismaClient 生命周期
 * 2. 自动注册租户隔离中间件
 * 3. 提供连接池管理
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // 注册租户中间件 (自动注入 tenantId 过滤条件)
    const middleware = async (params: any, next: any) => {
      const tenantId = getTenantId();
      if (tenantId) {
        return tenantMiddleware(tenantId)(params, next);
      }
      return next(params);
    };
    
    // @ts-ignore - $use method exists at runtime
    if (this.$use) {
      // @ts-ignore
      this.$use(middleware);
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
