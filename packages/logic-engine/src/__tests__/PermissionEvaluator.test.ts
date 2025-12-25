/**
 * PermissionEvaluator 单元测试
 */

import { PermissionEvaluator } from '../PermissionEvaluator';
import type { Policy } from '@metaflow/shared-types';

describe('PermissionEvaluator', () => {
  let evaluator: PermissionEvaluator;

  beforeEach(() => {
    evaluator = new PermissionEvaluator();
  });

  describe('can - 权限检查', () => {
    it('应该允许匹配的 ALLOW 策略', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['create', 'read'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'create')).toBe(true);
      expect(evaluator.can(policies, 'order', 'read')).toBe(true);
    });

    it('应该拒绝不匹配的动作', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'create')).toBe(false);
      expect(evaluator.can(policies, 'order', 'delete')).toBe(false);
    });

    it('应该支持通配符资源 (*)', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: '*',
          actions: ['read'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'read')).toBe(true);
      expect(evaluator.can(policies, 'user', 'read')).toBe(true);
      expect(evaluator.can(policies, 'product', 'read')).toBe(true);
    });

    it('应该支持通配符动作 (*)', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['*'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'create')).toBe(true);
      expect(evaluator.can(policies, 'order', 'read')).toBe(true);
      expect(evaluator.can(policies, 'order', 'update')).toBe(true);
      expect(evaluator.can(policies, 'order', 'delete')).toBe(true);
    });

    it('DENY 策略应该优先于 ALLOW', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['*'],
        },
        {
          id: 'policy-2',
          effect: 'DENY',
          resource: 'order',
          actions: ['delete'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'create')).toBe(true);
      expect(evaluator.can(policies, 'order', 'read')).toBe(true);
      expect(evaluator.can(policies, 'order', 'delete')).toBe(false); // DENY 优先
    });

    it('应该支持条件检查', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['update'],
          condition: {
            ownerId: '${user.id}',
          },
        },
      ];

      const context = { user: { id: 'user-123' }, ownerId: 'user-123' };

      expect(evaluator.can(policies, 'order', 'update', context)).toBe(true);
    });

    it('条件不匹配应该拒绝', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['update'],
          condition: {
            ownerId: '${user.id}',
          },
        },
      ];

      const context = { user: { id: 'user-123' }, ownerId: 'user-456' };

      expect(evaluator.can(policies, 'order', 'update', context)).toBe(false);
    });
  });

  describe('policyToWhere - Prisma 查询条件转换', () => {
    it('应该转换简单条件为 Prisma WhereInput', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: {
            status: 'active',
          },
        },
      ];

      const where = evaluator.policyToWhere(policies, 'order', 'read');

      expect(where).toEqual({
        status: { equals: 'active' },
      });
    });

    it('应该支持变量替换', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: {
            ownerId: '${user.id}',
          },
        },
      ];

      const context = { user: { id: 'user-123' } };
      const where = evaluator.policyToWhere(policies, 'order', 'read', context);

      expect(where).toEqual({
        ownerId: { equals: 'user-123' },
      });
    });

    it('应该支持操作符 (lt, gt, in 等)', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: {
            amount: { lt: 1000 },
          },
        },
      ];

      const where = evaluator.policyToWhere(policies, 'order', 'read');

      expect(where).toEqual({
        amount: { lt: 1000 },
      });
    });

    it('多个策略应该生成 OR 条件', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: { status: 'active' },
        },
        {
          id: 'policy-2',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: { status: 'pending' },
        },
      ];

      const where = evaluator.policyToWhere(policies, 'order', 'read');

      expect(where).toEqual({
        OR: [
          { status: { equals: 'active' } },
          { status: { equals: 'pending' } },
        ],
      });
    });

    it('无匹配策略应该返回永不匹配条件', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'product',
          actions: ['read'],
        },
      ];

      const where = evaluator.policyToWhere(policies, 'order', 'read');

      expect(where).toEqual({
        id: { equals: 'NEVER_MATCH' },
      });
    });

    it('DENY 策略不应该包含在 WhereInput 中', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          condition: { status: 'active' },
        },
        {
          id: 'policy-2',
          effect: 'DENY',
          resource: 'order',
          actions: ['read'],
          condition: { status: 'cancelled' },
        },
      ];

      const where = evaluator.policyToWhere(policies, 'order', 'read');

      // 只包含 ALLOW 策略
      expect(where).toEqual({
        status: { equals: 'active' },
      });
    });
  });

  describe('边界情况', () => {
    it('空策略列表应该拒绝所有请求', () => {
      expect(evaluator.can([], 'order', 'read')).toBe(false);
    });

    it('空策略列表应该返回永不匹配条件', () => {
      const where = evaluator.policyToWhere([], 'order', 'read');
      expect(where).toEqual({
        id: { equals: 'NEVER_MATCH' },
      });
    });

    it('不匹配资源应该拒绝', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'product',
          actions: ['read'],
        },
      ];

      expect(evaluator.can(policies, 'order', 'read')).toBe(false);
    });

    it('条件为空应该总是匹配', () => {
      const policies: Policy[] = [
        {
          id: 'policy-1',
          effect: 'ALLOW',
          resource: 'order',
          actions: ['read'],
          // 无 condition
        },
      ];

      expect(evaluator.can(policies, 'order', 'read')).toBe(true);
      expect(evaluator.can(policies, 'order', 'read', { any: 'context' })).toBe(
        true
      );
    });
  });
});
