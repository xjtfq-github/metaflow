/**
 * 租户配额管理
 * 
 * 限制租户资源使用
 */

export interface TenantQuota {
  tenantId: string;
  /** 最大记录数 */
  maxRecords: number;
  /** 最大存储 (MB) */
  maxStorageMB: number;
  /** API 调用速率 (次/分钟) */
  apiRateLimit: number;
  /** 最大用户数 */
  maxUsers: number;
}

/**
 * 配额管理器
 */
export class QuotaManager {
  private quotas: Map<string, TenantQuota> = new Map();
  private usageCache: Map<string, { records: number; storageMB: number; apiCalls: number }> = new Map();

  /**
   * 设置租户配额
   */
  setQuota(quota: TenantQuota): void {
    this.quotas.set(quota.tenantId, quota);
  }

  /**
   * 检查记录数配额
   */
  async checkRecordQuota(tenantId: string, increment: number = 1): Promise<boolean> {
    const quota = this.quotas.get(tenantId);
    if (!quota) return true; // 无配额限制

    const usage = this.getUsage(tenantId);
    return usage.records + increment <= quota.maxRecords;
  }

  /**
   * 检查存储配额
   */
  async checkStorageQuota(tenantId: string, sizeMB: number): Promise<boolean> {
    const quota = this.quotas.get(tenantId);
    if (!quota) return true;

    const usage = this.getUsage(tenantId);
    return usage.storageMB + sizeMB <= quota.maxStorageMB;
  }

  /**
   * 检查 API 速率限制
   */
  async checkRateLimit(tenantId: string): Promise<boolean> {
    const quota = this.quotas.get(tenantId);
    if (!quota) return true;

    const usage = this.getUsage(tenantId);
    return usage.apiCalls < quota.apiRateLimit;
  }

  /**
   * 增加 API 调用计数
   */
  incrementApiCalls(tenantId: string): void {
    const usage = this.getUsage(tenantId);
    usage.apiCalls++;
  }

  /**
   * 重置速率限制计数 (每分钟调用)
   */
  resetRateLimitCounters(): void {
    for (const usage of this.usageCache.values()) {
      usage.apiCalls = 0;
    }
  }

  /**
   * 获取使用量
   */
  private getUsage(tenantId: string) {
    if (!this.usageCache.has(tenantId)) {
      this.usageCache.set(tenantId, { records: 0, storageMB: 0, apiCalls: 0 });
    }
    return this.usageCache.get(tenantId)!;
  }

  /**
   * 更新使用量统计
   */
  async updateUsage(tenantId: string, stats: Partial<{ records: number; storageMB: number }>): Promise<void> {
    const usage = this.getUsage(tenantId);
    if (stats.records !== undefined) usage.records = stats.records;
    if (stats.storageMB !== undefined) usage.storageMB = stats.storageMB;
  }
}

/**
 * 全局配额管理器
 */
export const quotaManager = new QuotaManager();

// 每分钟重置速率限制计数
setInterval(() => {
  quotaManager.resetRateLimitCounters();
}, 60 * 1000);
