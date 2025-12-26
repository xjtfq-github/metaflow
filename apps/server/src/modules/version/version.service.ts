import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

interface PublishDto {
  appId: string;
  version: string;
  changelog?: string;
  runChecks?: boolean;
}

interface DeployDto {
  appId: string;
  versionId: string;
  environment: 'dev' | 'staging' | 'production';
  canaryEnabled?: boolean;
  canaryPercent?: number;
  canaryWhitelist?: string[];
}

@Injectable()
export class VersionService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取应用草稿
   */
  async getDraft(appId: string) {
    const draft = await this.prisma.appDraft.findUnique({
      where: { appId },
    });

    if (!draft) {
      // 如果草稿不存在，创建一个空草稿
      return this.prisma.appDraft.create({
        data: {
          appId,
          snapshot: JSON.stringify({
            models: [],
            pages: [],
            workflows: [],
            metadata: {},
          }),
          updatedBy: 'system',
        },
      });
    }

    return {
      ...draft,
      snapshot: JSON.parse(draft.snapshot),
    };
  }

  /**
   * 更新草稿
   */
  async updateDraft(appId: string, snapshot: any, userId: string) {
    const draft = await this.prisma.appDraft.upsert({
      where: { appId },
      create: {
        appId,
        snapshot: JSON.stringify(snapshot),
        updatedBy: userId,
      },
      update: {
        snapshot: JSON.stringify(snapshot),
        updatedBy: userId,
      },
    });

    return {
      ...draft,
      snapshot: JSON.parse(draft.snapshot),
    };
  }

  /**
   * 发布草稿为新版本
   */
  async publish(data: PublishDto, userId: string) {
    const { appId, version, changelog, runChecks = true } = data;

    // 1. 获取草稿
    const draft = await this.prisma.appDraft.findUnique({
      where: { appId },
    });

    if (!draft) {
      throw new NotFoundException('Draft not found');
    }

    const snapshot = JSON.parse(draft.snapshot);

    // 2. CI 检查
    if (runChecks) {
      this.runChecks(snapshot);
    }

    // 3. 检查版本号是否已存在
    const existing = await this.prisma.appVersion.findUnique({
      where: { appId_version: { appId, version } },
    });

    if (existing) {
      throw new BadRequestException(`Version ${version} already exists`);
    }

    // 4. 创建版本
    const appVersion = await this.prisma.appVersion.create({
      data: {
        appId,
        version,
        snapshot: draft.snapshot,
        changelog,
        publishedBy: userId,
        status: 'Published',
      },
    });

    return {
      ...appVersion,
      snapshot: JSON.parse(appVersion.snapshot),
    };
  }

  /**
   * CI 检查
   */
  private runChecks(snapshot: any) {
    const errors: string[] = [];

    // 1. 完整性校验
    if (!snapshot.models || snapshot.models.length === 0) {
      errors.push('至少需要一个数据模型');
    }

    // 2. Schema 检查
    for (const model of snapshot.models || []) {
      if (!model.entityName || !model.fields) {
        errors.push(`模型 ${model.id} 缺少必要字段`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(`发布检查失败:\n${errors.join('\n')}`);
    }
  }

  /**
   * 获取版本列表
   */
  async getVersions(appId: string) {
    return this.prisma.appVersion.findMany({
      where: { appId },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        version: true,
        status: true,
        changelog: true,
        publishedBy: true,
        publishedAt: true,
        archivedAt: true,
      },
    });
  }

  /**
   * 获取版本详情
   */
  async getVersion(versionId: string) {
    const version = await this.prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return {
      ...version,
      snapshot: JSON.parse(version.snapshot),
    };
  }

  /**
   * 归档版本
   */
  async archiveVersion(versionId: string) {
    return this.prisma.appVersion.update({
      where: { id: versionId },
      data: {
        status: 'Archived',
        archivedAt: new Date(),
      },
    });
  }

  /**
   * 回滚到指定版本
   */
  async rollback(appId: string, versionId: string, userId: string) {
    // 1. 获取目标版本
    const version = await this.prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.appId !== appId) {
      throw new NotFoundException('Version not found');
    }

    // 2. 更新草稿为目标版本的快照
    await this.prisma.appDraft.update({
      where: { appId },
      data: {
        snapshot: version.snapshot,
        updatedBy: userId,
      },
    });

    return {
      message: `已回滚到版本 ${version.version}`,
      version: version.version,
    };
  }

  /**
   * 部署版本
   */
  async deploy(data: DeployDto, userId: string) {
    const { appId, versionId, environment, canaryEnabled, canaryPercent, canaryWhitelist } = data;

    // 1. 检查版本是否存在
    const version = await this.prisma.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.appId !== appId) {
      throw new NotFoundException('Version not found');
    }

    // 2. 检查是否有活跃的部署
    const activeDeployment = await this.prisma.deployment.findFirst({
      where: {
        appId,
        environment,
        status: 'active',
      },
    });

    // 3. 如果有活跃部署，先标记为rollback
    if (activeDeployment) {
      await this.prisma.deployment.update({
        where: { id: activeDeployment.id },
        data: {
          status: 'rollback',
          rollbackAt: new Date(),
        },
      });
    }

    // 4. 创建新部署
    const deployment = await this.prisma.deployment.create({
      data: {
        appId,
        versionId,
        environment,
        status: 'active',
        deployedBy: userId,
        canaryEnabled: canaryEnabled || false,
        canaryPercent: canaryPercent || 0,
        canaryWhitelist: canaryWhitelist ? JSON.stringify(canaryWhitelist) : null,
      },
      include: {
        version: {
          select: {
            version: true,
            changelog: true,
          },
        },
      },
    });

    return deployment;
  }

  /**
   * 获取部署列表
   */
  async getDeployments(appId: string, environment?: string) {
    return this.prisma.deployment.findMany({
      where: {
        appId,
        ...(environment && { environment }),
      },
      orderBy: { deployedAt: 'desc' },
      include: {
        version: {
          select: {
            version: true,
            changelog: true,
          },
        },
      },
    });
  }

  /**
   * 更新灰度发布配置
   */
  async updateCanary(deploymentId: string, canaryPercent: number, canaryWhitelist?: string[]) {
    return this.prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        canaryEnabled: true,
        canaryPercent,
        canaryWhitelist: canaryWhitelist ? JSON.stringify(canaryWhitelist) : null,
      },
    });
  }
}
