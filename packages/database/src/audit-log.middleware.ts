/**
 * Prisma 审计日志中间件
 * 
 * 记录所有写操作 (create/update/delete)
 */

import { Prisma } from './generated/client';

/**
 * 审计日志记录
 */
export interface AuditLog {
  id: string;
  /** 操作类型 */
  action: 'create' | 'update' | 'delete';
  /** 模型名称 */
  model: string;
  /** 记录 ID */
  recordId: string;
  /** 操作用户 */
  userId?: string;
  /** 租户 ID */
  tenantId?: string;
  /** 变更前数据 */
  oldData?: any;
  /** 变更后数据 */
  newData?: any;
  /** 变更差异 */
  diff?: Record<string, { old: any; new: any }>;
  /** IP 地址 */
  ipAddress?: string;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 审计日志存储接口
 */
export interface AuditLogStore {
  save(log: AuditLog): Promise<void>;
}

/**
 * 内存存储 (开发环境)
 */
class MemoryAuditStore implements AuditLogStore {
  private logs: AuditLog[] = [];

  async save(log: AuditLog): Promise<void> {
    this.logs.push(log);
    console.log('[Audit]', log.action, log.model, log.recordId);
  }

  getLogs(): AuditLog[] {
    return this.logs;
  }
}

/**
 * 全局审计日志存储
 */
export const auditStore = new MemoryAuditStore();

/**
 * 创建审计日志中间件
 */
export function createAuditLogMiddleware(options?: {
  getUserId?: () => string | undefined;
  getTenantId?: () => string | undefined;
  getIpAddress?: () => string | undefined;
}): Prisma.Middleware {
  return async (params, next) => {
    const { action, model, args } = params;

    // 仅记录写操作
    if (!['create', 'update', 'delete', 'upsert'].includes(action)) {
      return next(params);
    }

    // 获取操作前数据 (update/delete)
    let oldData: any = null;
    if (action === 'update' || action === 'delete') {
      try {
        const delegate = (params as any).model;
        if (delegate && args.where) {
          oldData = await (next as any)({
            ...params,
            action: 'findUnique',
            args: { where: args.where },
          });
        }
      } catch (error) {
        // 忽略查询错误
      }
    }

    // 执行操作
    const result = await next(params);

    // 记录审计日志
    try {
      const log: AuditLog = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        action: action === 'upsert' ? 'update' : (action as any),
        model: model || 'unknown',
        recordId: extractRecordId(result, args),
        userId: options?.getUserId?.(),
        tenantId: options?.getTenantId?.(),
        oldData: action !== 'create' ? oldData : undefined,
        newData: action !== 'delete' ? result : undefined,
        diff: calculateDiff(oldData, result),
        ipAddress: options?.getIpAddress?.(),
        timestamp: new Date(),
      };

      // 异步保存 (不阻塞主流程)
      setImmediate(() => {
        auditStore.save(log).catch((err) => {
          console.error('Failed to save audit log:', err);
        });
      });
    } catch (error) {
      console.error('Audit log middleware error:', error);
    }

    return result;
  };
}

/**
 * 提取记录 ID
 */
function extractRecordId(result: any, args: any): string {
  if (!result) return 'unknown';
  
  // 从结果中提取 ID
  if (result.id) return String(result.id);
  
  // 从 where 条件中提取
  if (args.where?.id) return String(args.where.id);
  
  return 'unknown';
}

/**
 * 计算数据差异
 */
function calculateDiff(oldData: any, newData: any): Record<string, { old: any; new: any }> | undefined {
  if (!oldData || !newData) return undefined;

  const diff: Record<string, { old: any; new: any }> = {};

  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (oldData[key] !== newData[key]) {
      diff[key] = {
        old: oldData[key],
        new: newData[key],
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : undefined;
}

/**
 * 使用示例
 * 
 * import { createAuditLogMiddleware } from '@metaflow/database';
 * import { getTenantId, getUserId } from './tenant-context';
 * 
 * const prisma = new PrismaClient()
 *   .$use(createAuditLogMiddleware({
 *     getUserId: () => getUserId(),
 *     getTenantId: () => getTenantId(),
 *     getIpAddress: () => req.ip,
 *   }));
 */
