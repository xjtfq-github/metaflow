/**
 * 租户上下文管理 (AsyncLocalStorage)
 * 
 * 提供租户隔离的上下文存储
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  permissions?: string[];
}

const storage = new AsyncLocalStorage<TenantContext>();

/**
 * 在租户上下文中运行
 */
export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return storage.run(context, fn);
}

/**
 * 获取当前租户 ID
 */
export function getTenantId(): string | undefined {
  return storage.getStore()?.tenantId;
}

/**
 * 获取当前用户 ID
 */
export function getUserId(): string | undefined {
  return storage.getStore()?.userId;
}

/**
 * 获取完整上下文
 */
export function getContext(): TenantContext | undefined {
  return storage.getStore();
}

/**
 * 确保在租户上下文中 (否则抛出异常)
 */
export function requireTenantId(): string {
  const tenantId = getTenantId();
  if (!tenantId) {
    throw new Error('Tenant context is required but not set');
  }
  return tenantId;
}
