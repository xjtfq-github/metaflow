/**
 * 版本管理类型定义
 */

export type VersionStatus = 'Draft' | 'Published' | 'Archived';

/**
 * 应用草稿
 */
export interface AppDraft {
  id: string;
  appId: string;
  /** 快照内容 */
  snapshot: {
    models: any[];
    pages: any[];
    workflows: any[];
    metadata: Record<string, any>;
  };
  /** 最后修改时间 */
  updatedAt: Date;
  /** 修改人 */
  updatedBy: string;
}

/**
 * 应用版本
 */
export interface AppVersion {
  id: string;
  appId: string;
  /** 语义化版本号 */
  version: string;
  status: VersionStatus;
  /** 版本快照 */
  snapshot: {
    models: any[];
    pages: any[];
    workflows: any[];
    metadata: Record<string, any>;
  };
  /** 变更日志 */
  changelog?: string;
  /** 发布人 */
  publishedBy?: string;
  /** 发布时间 */
  publishedAt?: Date;
  /** 归档时间 */
  archivedAt?: Date;
}

/**
 * 发布选项
 */
export interface PublishOptions {
  /** 版本号 */
  version: string;
  /** 变更说明 */
  changelog?: string;
  /** 是否执行 CI 检查 */
  runChecks?: boolean;
  /** 灰度发布比例 (0-100) */
  canaryPercentage?: number;
}

/**
 * 灰度发布策略
 */
export interface CanaryStrategy {
  appId: string;
  /** 稳定版本 */
  stableVersion: string;
  /** 灰度版本 */
  canaryVersion: string;
  /** 灰度流量比例 */
  percentage: number;
  /** 白名单用户 */
  whitelist?: string[];
}

/**
 * 版本差异
 */
export interface VersionDiff {
  /** 差异类型 */
  type: 'added' | 'removed' | 'modified';
  /** 路径 */
  path: string[];
  /** 旧值 */
  oldValue?: any;
  /** 新值 */
  newValue?: any;
}
