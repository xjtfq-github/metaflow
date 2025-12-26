import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { quotaManager, TenantQuota } from '../../common/quota.manager';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取租户配额
   */
  async getQuota(tenantId: string): Promise<TenantQuota | null> {
    // TODO: 从数据库读取配额配置
    // 当前从内存读取
    return quotaManager['quotas'].get(tenantId) || null;
  }

  /**
   * 设置租户配额
   */
  async setQuota(
    tenantId: string,
    quota: Omit<TenantQuota, 'tenantId'>
  ): Promise<TenantQuota> {
    const tenantQuota: TenantQuota = {
      tenantId,
      ...quota,
    };

    quotaManager.setQuota(tenantQuota);

    // TODO: 持久化到数据库
    // await this.prisma.tenantQuota.upsert({...})

    return tenantQuota;
  }

  /**
   * 获取租户使用量
   */
  async getUsage(tenantId: string) {
    // 从缓存获取
    const cache = quotaManager['usageCache'].get(tenantId) || {
      records: 0,
      storageMB: 0,
      apiCalls: 0,
    };

    // 从数据库统计实际使用量
    const [userCount, appCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.app.count({ where: { tenantId } }),
    ]);

    return {
      ...cache,
      users: userCount,
      apps: appCount,
    };
  }

  /**
   * 获取租户统计信息
   */
  async getStats(tenantId: string) {
    const [
      userCount,
      appCount,
      assetCount,
      workOrderCount,
      departmentCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.app.count({ where: { tenantId } }),
      this.prisma.asset.count({ where: { tenantId } }),
      this.prisma.workOrder.count({ where: { tenantId } }),
      this.prisma.department.count({ where: { tenantId } }),
    ]);

    return {
      tenantId,
      users: userCount,
      apps: appCount,
      assets: assetCount,
      workOrders: workOrderCount,
      departments: departmentCount,
    };
  }
}
