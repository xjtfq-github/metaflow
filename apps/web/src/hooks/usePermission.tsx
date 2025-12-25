/**
 * 权限 Hook
 * 
 * 前端权限控制
 */

import { useMemo } from 'react';
import type { Policy, PermissionAction } from '@metaflow/shared-types';
import { usePermissionContext } from '../contexts/PermissionContext';

/**
 * usePermission Hook
 * 
 * @example
 * const { can } = usePermission();
 * 
 * {can('order:create') && <Button>新建订单</Button>}
 */
export function usePermission() {
  // 从全局 Context 获取用户策略
  const { policies: userPolicies, loading } = usePermissionContext();

  const can = useMemo(() => {
    return (permission: string): boolean => {
      if (loading) return false; // 加载中不允许操作
      
      const [resource, action] = permission.split(':');
      return evaluatePermission(userPolicies, resource, action as PermissionAction);
    };
  }, [userPolicies, loading]);

  return { can, loading };
}

/**
 * 评估权限
 */
function evaluatePermission(
  policies: Policy[],
  resource: string,
  action: PermissionAction
): boolean {
  for (const policy of policies) {
    if (policy.resource !== '*' && policy.resource !== resource) {
      continue;
    }

    if (!policy.actions.includes('*') && !policy.actions.includes(action)) {
      continue;
    }

    if (policy.effect === 'ALLOW') {
      return true;
    } else if (policy.effect === 'DENY') {
      return false;
    }
  }

  return false;
}
