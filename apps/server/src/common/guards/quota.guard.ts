import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { quotaManager } from '../quota.manager';
import { getTenantId } from '../tenant-context';

/**
 * 配额守卫
 * 
 * 检查租户资源配额限制
 */
@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取配额要求
    const quotaCheck = this.reflector.get<'records' | 'storage' | 'rateLimit'>(
      'quota',
      context.getHandler()
    );

    if (!quotaCheck) {
      return true; // 无配额要求
    }

    const tenantId = getTenantId();
    if (!tenantId) {
      return true; // 无租户上下文，跳过检查
    }

    // 检查速率限制
    if (quotaCheck === 'rateLimit') {
      const allowed = await quotaManager.checkRateLimit(tenantId);
      if (!allowed) {
        throw new ForbiddenException('API rate limit exceeded');
      }
      quotaManager.incrementApiCalls(tenantId);
      return true;
    }

    // 检查记录数配额
    if (quotaCheck === 'records') {
      const allowed = await quotaManager.checkRecordQuota(tenantId);
      if (!allowed) {
        throw new ForbiddenException('Record quota exceeded');
      }
      return true;
    }

    // 检查存储配额
    if (quotaCheck === 'storage') {
      const request = context.switchToHttp().getRequest();
      const sizeMB = this.estimateRequestSize(request);
      const allowed = await quotaManager.checkStorageQuota(tenantId, sizeMB);
      if (!allowed) {
        throw new ForbiddenException('Storage quota exceeded');
      }
      return true;
    }

    return true;
  }

  /**
   * 估算请求大小
   */
  private estimateRequestSize(request: any): number {
    const bodySize = JSON.stringify(request.body || {}).length;
    return bodySize / (1024 * 1024); // 转换为 MB
  }
}

/**
 * 配额装饰器
 */
export const RequireQuota = (type: 'records' | 'storage' | 'rateLimit') =>
  Reflect.metadata('quota', type);
