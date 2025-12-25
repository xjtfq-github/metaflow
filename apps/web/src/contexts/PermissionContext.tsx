/**
 * 权限上下文
 * 
 * 提供全局权限状态管理
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Policy } from '@metaflow/shared-types';

/**
 * 权限上下文接口
 */
export interface PermissionContextValue {
  /** 用户策略列表 */
  policies: Policy[];
  /** 当前用户 ID */
  userId?: string;
  /** 当前租户 ID */
  tenantId?: string;
  /** 设置策略 */
  setPolicies: (policies: Policy[]) => void;
  /** 设置用户信息 */
  setUser: (userId: string, tenantId: string) => void;
  /** 是否加载中 */
  loading: boolean;
}

/**
 * 创建权限上下文
 */
const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

/**
 * 权限 Provider 组件
 */
export function PermissionProvider({ children }: { children: ReactNode }) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [userId, setUserId] = useState<string | undefined>();
  const [tenantId, setTenantId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 从后端 API 加载用户权限
    // 示例: fetchUserPolicies().then(setPolicies)
    
    // 模拟加载
    setTimeout(() => {
      // 默认策略示例
      setPolicies([
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: '*',
          actions: ['*'],
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const setUser = (uid: string, tid: string) => {
    setUserId(uid);
    setTenantId(tid);
    // 用户切换时重新加载权限
    setLoading(true);
    // TODO: 重新加载用户权限
    setTimeout(() => setLoading(false), 300);
  };

  return (
    <PermissionContext.Provider
      value={{
        policies,
        userId,
        tenantId,
        setPolicies,
        setUser,
        loading,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * 使用权限上下文 Hook
 */
export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }
  return context;
}
