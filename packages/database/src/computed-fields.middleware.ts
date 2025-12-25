/**
 * Prisma 计算字段中间件
 * 
 * 自动在查询结果中注入计算字段
 */

import { Prisma } from './generated/client';
import { applyComputedFields } from './computed-fields';

/**
 * 创建计算字段中间件
 */
export function createComputedFieldsMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    const result = await next(params);

    // 仅处理查询操作
    if (!['findUnique', 'findFirst', 'findMany', 'create', 'update', 'upsert'].includes(params.action)) {
      return result;
    }

    // 获取模型名称
    const modelName = params.model;
    if (!modelName) {
      return result;
    }

    // 应用计算字段
    return applyComputedFields(modelName, result);
  };
}

/**
 * 使用示例
 * 
 * const prisma = new PrismaClient()
 *   .$use(createComputedFieldsMiddleware());
 * 
 * // 注册计算字段
 * setupUserComputedFields();
 * setupOrderComputedFields();
 * 
 * // 查询时自动计算
 * const user = await prisma.user.findUnique({
 *   where: { id: '123' },
 *   select: { id: true, firstName: true, lastName: true }
 * });
 * 
 * console.log(user.fullName); // "John Doe"
 */
