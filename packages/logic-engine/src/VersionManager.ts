/**
 * 版本管理服务
 */

import type { AppDraft, AppVersion, PublishOptions, VersionDiff } from '@metaflow/shared-types';

/**
 * 版本管理器
 */
export class VersionManager {
  /**
   * 发布草稿为新版本
   */
  async publish(draft: AppDraft, options: PublishOptions): Promise<AppVersion> {
    // CI 检查
    if (options.runChecks !== false) {
      await this.runChecks(draft);
    }

    // 创建版本快照
    const version: AppVersion = {
      id: `version-${Date.now()}`,
      appId: draft.appId,
      version: options.version,
      status: 'Published',
      snapshot: JSON.parse(JSON.stringify(draft.snapshot)), // 深拷贝
      changelog: options.changelog,
      publishedBy: draft.updatedBy,
      publishedAt: new Date(),
    };

    return version;
  }

  /**
   * CI 检查
   */
  private async runChecks(draft: AppDraft): Promise<void> {
    const errors: string[] = [];

    // 1. 完整性校验
    if (!draft.snapshot.models || draft.snapshot.models.length === 0) {
      errors.push('至少需要一个数据模型');
    }

    // 2. Schema 检查
    for (const model of draft.snapshot.models) {
      if (!model.entityName || !model.fields) {
        errors.push(`模型 ${model.id} 缺少必要字段`);
      }
    }

    // 3. 依赖分析
    // TODO: 检查页面引用的组件是否存在

    if (errors.length > 0) {
      throw new Error(`发布检查失败:\n${errors.join('\n')}`);
    }
  }

  /**
   * 回滚到指定版本
   */
  async rollback(appId: string, targetVersion: string): Promise<AppVersion> {
    // 1. 查找目标版本
    // const version = await findVersion(appId, targetVersion);
    
    // 2. 将 Draft 替换为目标版本的快照
    // await updateDraft(appId, version.snapshot);

    // 3. 返回目标版本
    return {} as AppVersion; // TODO: 实现数据库查询
  }

  /**
   * 计算版本差异
   */
  diff(oldVersion: AppVersion, newVersion: AppVersion): VersionDiff[] {
    const diffs: VersionDiff[] = [];

    // 简化实现: 仅比较模型数量
    const oldModelCount = oldVersion.snapshot.models.length;
    const newModelCount = newVersion.snapshot.models.length;

    if (oldModelCount !== newModelCount) {
      diffs.push({
        type: 'modified',
        path: ['models'],
        oldValue: `${oldModelCount} 个模型`,
        newValue: `${newModelCount} 个模型`,
      });
    }

    // TODO: 使用 jsondiffpatch 进行深度对比
    return diffs;
  }

  /**
   * 生成变更日志摘要
   */
  generateChangelog(diffs: VersionDiff[]): string {
    const lines: string[] = [];

    for (const diff of diffs) {
      const path = diff.path.join('.');
      switch (diff.type) {
        case 'added':
          lines.push(`+ 新增 ${path}: ${JSON.stringify(diff.newValue)}`);
          break;
        case 'removed':
          lines.push(`- 删除 ${path}: ${JSON.stringify(diff.oldValue)}`);
          break;
        case 'modified':
          lines.push(`~ 修改 ${path}: ${diff.oldValue} → ${diff.newValue}`);
          break;
      }
    }

    return lines.join('\n');
  }
}

/**
 * 灰度发布管理器
 */
export class CanaryManager {
  private strategies: Map<string, { stableVersion: string; canaryVersion: string; percentage: number }> = new Map();

  /**
   * 设置灰度策略
   */
  setCanary(appId: string, stableVersion: string, canaryVersion: string, percentage: number): void {
    this.strategies.set(appId, { stableVersion, canaryVersion, percentage });
  }

  /**
   * 获取用户应该使用的版本
   */
  resolveVersion(appId: string, userId?: string): string {
    const strategy = this.strategies.get(appId);
    if (!strategy) {
      return 'stable'; // 默认稳定版
    }

    // 简单哈希决定是否进入灰度
    const hash = userId ? this.hashCode(userId) : Math.random() * 100;
    const inCanary = (hash % 100) < strategy.percentage;

    return inCanary ? strategy.canaryVersion : strategy.stableVersion;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
