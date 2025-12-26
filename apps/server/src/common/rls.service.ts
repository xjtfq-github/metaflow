/**
 * PostgreSQL 行级安全 (RLS) 支持
 * 
 * 注意: SQLite 不支持 RLS，此服务仅用于 PostgreSQL
 * 
 * RLS 策略示例:
 * 
 * 1. 启用 RLS:
 * ALTER TABLE "App" ENABLE ROW LEVEL SECURITY;
 * 
 * 2. 创建策略:
 * CREATE POLICY tenant_isolation ON "App"
 *   FOR ALL
 *   USING ("tenantId" = current_setting('app.current_tenant')::text);
 * 
 * 3. 设置租户上下文:
 * SET LOCAL app.current_tenant = 'tenant-001';
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class RlsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 在事务中设置租户上下文
   * 
   * 仅适用于 PostgreSQL
   */
  async withTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    // 检查是否为 PostgreSQL
    const isPostgres = this.isPostgreSQL();
    
    if (!isPostgres) {
      // SQLite 不支持 RLS，直接执行
      return fn();
    }

    // 在事务中设置租户上下文
    return this.prisma.$transaction(async (tx) => {
      // 设置 PostgreSQL 会话变量
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant = '${this.escapeSql(tenantId)}'`
      );
      
      return fn();
    });
  }

  /**
   * 检查是否为 PostgreSQL
   */
  private isPostgreSQL(): boolean {
    const url = process.env.DATABASE_URL || '';
    return url.startsWith('postgresql://') || url.startsWith('postgres://');
  }

  /**
   * SQL 注入防护
   */
  private escapeSql(value: string): string {
    return value.replace(/'/g, "''");
  }

  /**
   * 生成 RLS 策略 SQL (仅供参考)
   */
  generateRlsPolicies(): string {
    return `
-- 启用 RLS
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "App" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InspectionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HiddenDanger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AppVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Deployment" ENABLE ROW LEVEL SECURITY;

-- 创建租户隔离策略
CREATE POLICY tenant_isolation_user ON "User"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_app ON "App"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_asset ON "Asset"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_workorder ON "WorkOrder"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_inspection ON "InspectionPlan"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_inventory ON "InventoryItem"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

CREATE POLICY tenant_isolation_hiddendanger ON "HiddenDanger"
  FOR ALL
  USING ("tenantId" = current_setting('app.current_tenant', true)::text);

-- Tenant 表：只能访问自己的租户信息
CREATE POLICY tenant_self_access ON "Tenant"
  FOR ALL
  USING ("id" = current_setting('app.current_tenant', true)::text);

-- 创建辅助函数（可选）
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant', true)::text;
$$ LANGUAGE SQL STABLE;

-- 使用示例:
-- SET LOCAL app.current_tenant = 'tenant-001';
-- SELECT * FROM "User" WHERE "tenantId" = get_current_tenant_id();
`;
  }
}
