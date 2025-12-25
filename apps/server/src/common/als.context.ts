/**
 * AsyncLocalStorage 上下文管理
 * 
 * 功能:
 * 1. 跨中间件/服务传递 TraceID 和 TenantID
 * 2. 避免层层传递参数
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  traceId: string;
  tenantId?: string;
  userId?: string;
  timestamp: number;
}

// 创建 AsyncLocalStorage 实例
const als = new AsyncLocalStorage<RequestContext>();

/**
 * 获取当前请求上下文
 */
export function getContext(): RequestContext | undefined {
  return als.getStore();
}

/**
 * 获取 TraceID
 */
export function getTraceId(): string | undefined {
  return als.getStore()?.traceId;
}

/**
 * 获取 TenantID
 */
export function getTenantId(): string | undefined {
  return als.getStore()?.tenantId;
}

/**
 * 获取 UserID
 */
export function getUserId(): string | undefined {
  return als.getStore()?.userId;
}

/**
 * 运行带上下文的异步函数
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T,
): T {
  return als.run(context, fn);
}

export { als };
