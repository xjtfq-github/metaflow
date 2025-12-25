/**
 * Prisma 计算字段扩展
 * 
 * 实现虚拟列 (Computed Fields)
 */

import { Prisma } from './generated/client';
import { evaluateExpression } from '@metaflow/logic-engine';

/**
 * 计算字段定义
 */
export interface ComputedField<T = any> {
  /** 依赖的字段 */
  needs: Partial<Record<keyof T, boolean>>;
  /** 计算函数 */
  compute: (data: T) => any;
}

/**
 * 模型计算字段注册表
 */
const computedFieldsRegistry = new Map<string, Map<string, ComputedField>>();

/**
 * 注册计算字段
 * 
 * @example
 * registerComputedField('User', 'fullName', {
 *   needs: { firstName: true, lastName: true },
 *   compute: (user) => `${user.firstName} ${user.lastName}`
 * })
 */
export function registerComputedField<T = any>(
  modelName: string,
  fieldName: string,
  field: ComputedField<T>
): void {
  if (!computedFieldsRegistry.has(modelName)) {
    computedFieldsRegistry.set(modelName, new Map());
  }
  computedFieldsRegistry.get(modelName)!.set(fieldName, field);
}

/**
 * 注册表达式计算字段
 * 
 * @example
 * registerExpressionField('Order', 'totalPrice', {
 *   needs: { price: true, quantity: true },
 *   expression: 'price * quantity'
 * })
 */
export function registerExpressionField<T = any>(
  modelName: string,
  fieldName: string,
  config: {
    needs: Partial<Record<keyof T, boolean>>;
    expression: string;
  }
): void {
  registerComputedField(modelName, fieldName, {
    needs: config.needs,
    compute: (data) => {
      try {
        return evaluateExpression(config.expression, data as any);
      } catch (error) {
        console.error(`Failed to compute field ${fieldName}:`, error);
        return null;
      }
    },
  });
}

/**
 * 应用计算字段到查询结果
 */
export function applyComputedFields<T extends Record<string, any>>(
  modelName: string,
  data: T | T[]
): T | T[] {
  const fields = computedFieldsRegistry.get(modelName);
  if (!fields || fields.size === 0) {
    return data;
  }

  const applyToSingle = (item: T): T => {
    const result: any = { ...item };
    
    for (const [fieldName, field] of fields.entries()) {
      // 检查是否有所需字段
      const hasAllNeeds = Object.keys(field.needs).every((key) => key in item);
      
      if (hasAllNeeds) {
        result[fieldName] = field.compute(item);
      }
    }
    
    return result as T;
  };

  return Array.isArray(data)
    ? data.map(applyToSingle)
    : applyToSingle(data);
}

/**
 * Prisma 客户端扩展 (自动应用计算字段)
 */
export function createComputedFieldExtension(modelName: string) {
  return Prisma.defineExtension({
    name: `computed-fields-${modelName}`,
    result: {
      [modelName]: {
        // 动态注入计算字段
        $computed: {
          needs: {},
          compute(data: any) {
            return applyComputedFields(modelName, data);
          },
        },
      },
    },
  });
}

/**
 * 批量创建扩展
 */
export function createAllComputedExtensions() {
  const extensions: any[] = [];
  
  for (const modelName of computedFieldsRegistry.keys()) {
    extensions.push(createComputedFieldExtension(modelName));
  }
  
  return extensions;
}

/**
 * 示例：用户全名计算字段
 */
export function setupUserComputedFields() {
  registerComputedField('User', 'fullName', {
    needs: { firstName: true, lastName: true },
    compute: (user: any) => {
      if (!user.firstName || !user.lastName) return '';
      return `${user.firstName} ${user.lastName}`;
    },
  });

  registerComputedField('User', 'displayName', {
    needs: { firstName: true, lastName: true, email: true },
    compute: (user: any) => {
      if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      return user.email || 'Unknown';
    },
  });
}

/**
 * 示例：订单金额计算字段
 */
export function setupOrderComputedFields() {
  // 使用表达式
  registerExpressionField('Order', 'totalPrice', {
    needs: { price: true, quantity: true },
    expression: 'price * quantity',
  });

  // 含税金额
  registerExpressionField('Order', 'totalWithTax', {
    needs: { price: true, quantity: true, taxRate: true },
    expression: 'price * quantity * (1 + taxRate)',
  });

  // 折扣后金额
  registerComputedField('Order', 'finalPrice', {
    needs: { price: true, quantity: true, discount: true },
    compute: (order: any) => {
      const total = order.price * order.quantity;
      const discountAmount = total * (order.discount || 0);
      return total - discountAmount;
    },
  });
}
