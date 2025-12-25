import { Injectable } from '@nestjs/common';

export interface PolicyStatement {
  effect: 'ALLOW' | 'DENY';
  resource: string;  // 资源类型，如 "Order", "*"
  actions: string;  // 允许的操作，逗号分隔，如 "read,update"
  condition?: string;  // JSON字符串格式的条件
}

export interface PolicyCondition {
  [field: string]: ConditionOperator | any;
}

export interface ConditionOperator {
  eq?: any;  // 等于
  ne?: any;  // 不等于
  gt?: any;  // 大于
  gte?: any;  // 大于等于
  lt?: any;  // 小于
  lte?: any;  // 小于等于
  in?: any[];  // 包含
  nin?: any[];  // 不包含
  contains?: string;  // 包含子串
  startsWith?: string;  // 以...开头
}

@Injectable()
export class PolicyService {
  /**
   * 检查用户是否有权限
   */
  can(
    policies: PolicyStatement[],
    resource: string,
    action: string
  ): boolean {
    // 检查 DENY 策略（优先级最高）
    const denyPolicies = policies.filter(
      (p) => p.effect === 'DENY' && this.matchResource(p.resource, resource)
    );

    for (const policy of denyPolicies) {
      if (this.matchAction(policy.actions, action)) {
        return false;
      }
    }

    // 检查 ALLOW 策略
    const allowPolicies = policies.filter(
      (p) => p.effect === 'ALLOW' && this.matchResource(p.resource, resource)
    );

    for (const policy of allowPolicies) {
      if (this.matchAction(policy.actions, action)) {
        return true;
      }
    }

    return false;  // 默认拒绝
  }

  /**
   * 匹配资源
   */
  private matchResource(policyResource: string, resource: string): boolean {
    if (policyResource === '*') return true;
    return policyResource === resource;
  }

  /**
   * 匹配操作
   */
  private matchAction(policyActions: string, action: string): boolean {
    if (policyActions.includes('*')) return true;
    const actions = policyActions.split(',').map(a => a.trim());
    return actions.includes(action) || actions.includes('*');
  }

  /**
   * 合并多个策略的 Where 条件（OR 关系）
   */
  mergePolicyWhere(
    policies: PolicyStatement[],
    resource: string,
    action: string,
    context: Record<string, any>
  ): Record<string, any> {
    const allowPolicies = policies.filter(
      (p) =>
        p.effect === 'ALLOW' &&
        this.matchResource(p.resource, resource) &&
        this.matchAction(p.actions, action)
    );

    if (allowPolicies.length === 0) {
      // 没有权限，返回一个永远不成立的条件
      return { id: { equals: '__NEVER_MATCH__' } };
    }

    if (allowPolicies.length === 1) {
      return this.conditionToWhere(allowPolicies[0].condition, context);
    }

    // 多个策略，使用 OR
    return {
      OR: allowPolicies.map((p) => this.conditionToWhere(p.condition, context)),
    };
  }

  /**
   * 将 Policy Condition 转换为 Prisma WhereInput
   */
  conditionToWhere(
    condition: string | undefined,
    context: Record<string, any>
  ): Record<string, any> {
    if (!condition) {
      return {};
    }

    try {
      const conditionObj = JSON.parse(condition);
      return this.convertCondition(conditionObj, context);
    } catch (e) {
      console.error('Failed to parse condition:', condition, e);
      return {};
    }
  }

  private convertCondition(condition: PolicyCondition, context: Record<string, any>): Record<string, any> {
    const where: Record<string, any> = {};

    for (const [field, value] of Object.entries(condition)) {
      // 处理模板变量（如 ${user.id}）
      const resolvedValue = this.resolveValue(value, context);

      if (typeof resolvedValue === 'object' && resolvedValue !== null) {
        // 处理操作符
        where[field] = this.convertOperator(resolvedValue, context);
      } else {
        // 直接相等
        where[field] = resolvedValue;
      }
    }

    return where;
  }

  /**
   * 转换操作符
   */
  private convertOperator(operator: ConditionOperator, context: Record<string, any>): any {
    const result: Record<string, any> = {};

    for (const [op, value] of Object.entries(operator)) {
      const resolvedValue = this.resolveValue(value, context);

      switch (op) {
        case 'eq':
          return resolvedValue;  // Prisma 默认就是相等
        case 'ne':
          result.not = resolvedValue;
          break;
        case 'gt':
          result.gt = resolvedValue;
          break;
        case 'gte':
          result.gte = resolvedValue;
          break;
        case 'lt':
          result.lt = resolvedValue;
          break;
        case 'lte':
          result.lte = resolvedValue;
          break;
        case 'in':
          result.in = resolvedValue;
          break;
        case 'nin':
          result.notIn = resolvedValue;
          break;
        case 'contains':
          result.contains = resolvedValue;
          break;
        case 'startsWith':
          result.startsWith = resolvedValue;
          break;
        default:
          result[op] = resolvedValue;
      }
    }

    return result;
  }

  /**
   * 解析模板变量
   */
  private resolveValue(value: any, context: Record<string, any>): any {
    if (typeof value === 'string' && value.includes('${')) {
      // 简单的模板替换
      return value.replace(/\$\{([^}]+)\}/g, (match, path) => {
        const pathParts = path.split('.');
        let result = context;
        for (const part of pathParts) {
          result = result?.[part];
        }
        // 确保返回字符串类型
        return result !== undefined ? String(result) : match;
      });
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.resolveValue(v, context));
    }

    if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.resolveValue(v, context);
      }
      return result;
    }

    return value;
  }
}