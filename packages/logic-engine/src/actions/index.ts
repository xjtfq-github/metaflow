/**
 * 通用动作库
 */

import type { ExecutionContext } from '@metaflow/shared-types';

/**
 * 动作处理器类型
 */
export type ActionHandler = (params: Record<string, any>, context: ExecutionContext) => Promise<any> | any;

/**
 * 动作注册表
 */
export const actionRegistry = new Map<string, ActionHandler>();

/**
 * 注册动作
 */
export function registerAction(type: string, handler: ActionHandler): void {
  actionRegistry.set(type, handler);
}

// 导入所有动作
import './network';
import './ui';
import './state';
import './logic';
