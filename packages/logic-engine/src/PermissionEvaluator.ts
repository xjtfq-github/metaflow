/**
 * 权限评估器
 * 
 * Policy → Prisma WhereInput 转换
 */

import type { Policy, PermissionAction } from '@metaflow/shared-types';

/**
 * 权限评估器
 */
export class PermissionEvaluator {
  /**
   * 检查用户是否有权限
   */
  can(
    userPolicies: Policy[],
    resource: string,
    action: PermissionAction,
    context: Record<string, any> = {}
  ): boolean {
    let allowed = false;

    for (const policy of userPolicies) {
      // 检查资源匹配
      if (policy.resource !== '*' && policy.resource !== resource) {
        continue;
      }

      // 检查动作匹配
      if (!policy.actions.includes('*') && !policy.actions.includes(action)) {
        continue;
      }

      // 检查条件
      if (policy.condition && !this.evaluateCondition(policy.condition, context)) {
        continue;
      }

      // 应用策略
      if (policy.effect === 'ALLOW') {
        allowed = true;
      } else if (policy.effect === 'DENY') {
        return false; // DENY 优先
      }
    }

    return allowed;
  }

  /**
   * 转换策略为 Prisma WhereInput (数据权限)
   */
  policyToWhere(
    policies: Policy[],
    resource: string,
    action: PermissionAction,
    context: Record<string, any> = {}
  ): any {
    const conditions: any[] = [];

    for (const policy of policies) {
      if (policy.resource !== resource && policy.resource !== '*') {
        continue;
      }

      if (!policy.actions.includes(action) && !policy.actions.includes('*')) {
        continue;
      }

      if (policy.effect === 'ALLOW' && policy.condition) {
        conditions.push(this.conditionToWhere(policy.condition, context));
      }
    }

    if (conditions.length === 0) {
      // 无策略 = 无权限
      return { id: { equals: 'NEVER_MATCH' } };
    }

    // OR 组合
    return conditions.length === 1 ? conditions[0] : { OR: conditions };
  }

  /**
   * 条件表达式 → Prisma Where
   */
  private conditionToWhere(
    condition: Record<string, any>,
    context: Record<string, any>
  ): any {
    const where: any = {};

    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'object' && value !== null) {
        // 操作符 { lt: 1000 }
        where[key] = value;
      } else if (typeof value === 'string' && value.startsWith('${')) {
        // 变量替换 ${user.id}
        const varPath = value.slice(2, -1);
        where[key] = { equals: this.getValueByPath(context, varPath) };
      } else {
        // 直接值
        where[key] = { equals: value };
      }
    }

    return where;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(
    condition: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(condition)) {
      const contextValue = context[key];

      if (typeof value === 'object' && value !== null) {
        // 操作符
        if ('lt' in value && !(contextValue < value.lt)) return false;
        if ('lte' in value && !(contextValue <= value.lte)) return false;
        if ('gt' in value && !(contextValue > value.gt)) return false;
        if ('gte' in value && !(contextValue >= value.gte)) return false;
        if ('equals' in value && contextValue !== value.equals) return false;
      } else if (typeof value === 'string' && value.startsWith('${')) {
        // 变量
        const expectedValue = this.getValueByPath(context, value.slice(2, -1));
        if (contextValue !== expectedValue) return false;
      } else {
        // 直接值
        if (contextValue !== value) return false;
      }
    }

    return true;
  }

  /**
   * 根据路径获取值
   */
  private getValueByPath(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    for (const key of keys) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }
    return value;
  }
}

/**
 * 全局单例
 */
export const permissionEvaluator = new PermissionEvaluator();
