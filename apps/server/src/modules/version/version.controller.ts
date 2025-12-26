import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VersionService } from './version.service';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';

@Controller('version')
@UseGuards(PermissionGuard)
export class VersionController {
  constructor(private versionService: VersionService) {}

  // ========== 草稿管理 ==========
  
  @Get('apps/:appId/draft')
  @RequirePermission('AppDraft', 'read')
  async getDraft(@Param('appId') appId: string) {
    return this.versionService.getDraft(appId);
  }

  @Put('apps/:appId/draft')
  @RequirePermission('AppDraft', 'update')
  async updateDraft(
    @Param('appId') appId: string,
    @Body() body: { snapshot: any; userId: string }
  ) {
    return this.versionService.updateDraft(appId, body.snapshot, body.userId);
  }

  // ========== 版本发布 ==========

  @Post('apps/:appId/publish')
  @RequirePermission('AppVersion', 'create')
  async publish(
    @Param('appId') appId: string,
    @Body() body: { version: string; changelog?: string; runChecks?: boolean; userId: string }
  ) {
    return this.versionService.publish(
      {
        appId,
        version: body.version,
        changelog: body.changelog,
        runChecks: body.runChecks,
      },
      body.userId
    );
  }

  @Get('apps/:appId/versions')
  @RequirePermission('AppVersion', 'read')
  async getVersions(@Param('appId') appId: string) {
    return this.versionService.getVersions(appId);
  }

  @Get('versions/:versionId')
  @RequirePermission('AppVersion', 'read')
  async getVersion(@Param('versionId') versionId: string) {
    return this.versionService.getVersion(versionId);
  }

  @Put('versions/:versionId/archive')
  @RequirePermission('AppVersion', 'update')
  async archiveVersion(@Param('versionId') versionId: string) {
    return this.versionService.archiveVersion(versionId);
  }

  @Post('apps/:appId/rollback')
  @RequirePermission('AppVersion', 'update')
  async rollback(
    @Param('appId') appId: string,
    @Body() body: { versionId: string; userId: string }
  ) {
    return this.versionService.rollback(appId, body.versionId, body.userId);
  }

  // ========== 部署管理 ==========

  @Post('apps/:appId/deploy')
  @RequirePermission('Deployment', 'create')
  async deploy(
    @Param('appId') appId: string,
    @Body()
    body: {
      versionId: string;
      environment: 'dev' | 'staging' | 'production';
      canaryEnabled?: boolean;
      canaryPercent?: number;
      canaryWhitelist?: string[];
      userId: string;
    }
  ) {
    return this.versionService.deploy(
      {
        appId,
        versionId: body.versionId,
        environment: body.environment,
        canaryEnabled: body.canaryEnabled,
        canaryPercent: body.canaryPercent,
        canaryWhitelist: body.canaryWhitelist,
      },
      body.userId
    );
  }

  @Get('apps/:appId/deployments')
  @RequirePermission('Deployment', 'read')
  async getDeployments(
    @Param('appId') appId: string,
    @Query('environment') environment?: string
  ) {
    return this.versionService.getDeployments(appId, environment);
  }

  @Put('deployments/:deploymentId/canary')
  @RequirePermission('Deployment', 'update')
  async updateCanary(
    @Param('deploymentId') deploymentId: string,
    @Body() body: { canaryPercent: number; canaryWhitelist?: string[] }
  ) {
    return this.versionService.updateCanary(
      deploymentId,
      body.canaryPercent,
      body.canaryWhitelist
    );
  }
}
