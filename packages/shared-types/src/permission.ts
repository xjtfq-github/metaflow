/**
 * 权限模型类型定义
 */

/**
 * 权限策略效果
 */
export type PolicyEffect = 'ALLOW' | 'DENY';

/**
 * 权限动作
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'export' | '*';

/**
 * 权限策略
 */
export interface Policy {
  /** 策略 ID */
  id: string;
  /** 效果 */
  effect: PolicyEffect;
  /** 资源 (模型名或 *) */
  resource: string;
  /** 动作列表 */
  actions: PermissionAction[];
  /** 条件表达式 */
  condition?: Record<string, any>;
  /** 描述 */
  description?: string;
}

/**
 * 角色定义
 */
export interface Role {
  id: string;
  name: string;
  /** 关联的策略 */
  policies: Policy[];
  /** 描述 */
  description?: string;
}

/**
 * 部门 (组织架构)
 */
export interface Department {
  id: string;
  name: string;
  /** 父部门 ID */
  parentId: string | null;
  /** 路径 (如 /1/5/12/) */
  path: string;
  /** 层级 */
  level: number;
}

/**
 * 用户角色关联
 */
export interface UserRole {
  userId: string;
  roleId: string;
}
