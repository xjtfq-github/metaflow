import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';

@Controller('tenant')
@UseGuards(PermissionGuard)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get(':tenantId/quota')
  @RequirePermission('Tenant', 'read')
  async getQuota(@Param('tenantId') tenantId: string) {
    return this.tenantService.getQuota(tenantId);
  }

  @Post(':tenantId/quota')
  @RequirePermission('Tenant', 'update')
  async setQuota(
    @Param('tenantId') tenantId: string,
    @Body() quota: {
      maxRecords: number;
      maxStorageMB: number;
      apiRateLimit: number;
      maxUsers: number;
    }
  ) {
    return this.tenantService.setQuota(tenantId, quota);
  }

  @Get(':tenantId/usage')
  @RequirePermission('Tenant', 'read')
  async getUsage(@Param('tenantId') tenantId: string) {
    return this.tenantService.getUsage(tenantId);
  }

  @Get(':tenantId/stats')
  @RequirePermission('Tenant', 'read')
  async getStats(@Param('tenantId') tenantId: string) {
    return this.tenantService.getStats(tenantId);
  }
}
