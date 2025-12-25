/**
 * ActionExecutor 单元测试
 */

import { ActionExecutor } from '../ActionExecutor';
import type { Action } from '@metaflow/shared-types';

describe('ActionExecutor', () => {
  let executor: ActionExecutor;
  let mockContext: Record<string, any>;

  beforeEach(() => {
    executor = new ActionExecutor();
    mockContext = {
      user: { name: 'Alice', role: 'admin' },
      count: 5,
    };
  });

  describe('registerAction', () => {
    it('应该能注册自定义动作', () => {
      const customAction = jest.fn(async () => ({ success: true }));
      executor.registerAction('custom', customAction);

      const action: Action = {
        id: 'action-1',
        type: 'custom',
        config: {},
      };

      return expect(executor.execute(action, mockContext)).resolves.toEqual({
        success: true,
      });
    });

    it('注册重复动作应该覆盖旧的', () => {
      const action1 = jest.fn(async () => 'result1');
      const action2 = jest.fn(async () => 'result2');

      executor.registerAction('test', action1);
      executor.registerAction('test', action2);

      const action: Action = {
        id: 'action-1',
        type: 'test',
        config: {},
      };

      return executor.execute(action, mockContext).then(() => {
        expect(action1).not.toHaveBeenCalled();
        expect(action2).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('execute', () => {
    it('执行不存在的动作应该抛出错误', async () => {
      const action: Action = {
        id: 'action-1',
        type: 'non-existent',
        config: {},
      };

      await expect(executor.execute(action, mockContext)).rejects.toThrow(
        'Action handler not found: non-existent'
      );
    });

    it('应该传递正确的配置和上下文', async () => {
      const handler = jest.fn(async (config, context) => {
        expect(config).toEqual({ key: 'value' });
        expect(context).toBe(mockContext);
        return { success: true };
      });

      executor.registerAction('test', handler);

      const action: Action = {
        id: 'action-1',
        type: 'test',
        config: { key: 'value' },
      };

      await executor.execute(action, mockContext);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('动作抛出错误应该被捕获', async () => {
      const errorHandler = jest.fn(async () => {
        throw new Error('Action failed');
      });

      executor.registerAction('error-action', errorHandler);

      const action: Action = {
        id: 'action-1',
        type: 'error-action',
        config: {},
      };

      await expect(executor.execute(action, mockContext)).rejects.toThrow(
        'Action failed'
      );
    });
  });

  describe('executePipeline', () => {
    it('应该按顺序执行动作管道', async () => {
      const results: string[] = [];

      executor.registerAction('step1', async () => {
        results.push('step1');
        return { value: 1 };
      });

      executor.registerAction('step2', async () => {
        results.push('step2');
        return { value: 2 };
      });

      executor.registerAction('step3', async () => {
        results.push('step3');
        return { value: 3 };
      });

      const actions: Action[] = [
        { id: 'a1', type: 'step1', config: {} },
        { id: 'a2', type: 'step2', config: {} },
        { id: 'a3', type: 'step3', config: {} },
      ];

      await executor.executePipeline(actions, mockContext);

      expect(results).toEqual(['step1', 'step2', 'step3']);
    });

    it('管道中某个动作失败应该中断执行', async () => {
      const results: string[] = [];

      executor.registerAction('step1', async () => {
        results.push('step1');
        return { value: 1 };
      });

      executor.registerAction('step2', async () => {
        results.push('step2');
        throw new Error('Step2 failed');
      });

      executor.registerAction('step3', async () => {
        results.push('step3');
        return { value: 3 };
      });

      const actions: Action[] = [
        { id: 'a1', type: 'step1', config: {} },
        { id: 'a2', type: 'step2', config: {} },
        { id: 'a3', type: 'step3', config: {} },
      ];

      await expect(
        executor.executePipeline(actions, mockContext)
      ).rejects.toThrow('Step2 failed');

      expect(results).toEqual(['step1', 'step2']); // step3 未执行
    });

    it('空管道应该正常返回', async () => {
      await expect(
        executor.executePipeline([], mockContext)
      ).resolves.toBeUndefined();
    });
  });

  describe('条件执行', () => {
    it('应该支持条件动作 (condition=true 执行)', async () => {
      const handler = jest.fn(async () => ({ success: true }));
      executor.registerAction('conditional', handler);

      const action: Action = {
        id: 'action-1',
        type: 'conditional',
        config: {},
        condition: '{{ user.role === "admin" }}',
      };

      await executor.execute(action, mockContext);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('应该支持条件动作 (condition=false 跳过)', async () => {
      const handler = jest.fn(async () => ({ success: true }));
      executor.registerAction('conditional', handler);

      const action: Action = {
        id: 'action-1',
        type: 'conditional',
        config: {},
        condition: '{{ user.role === "guest" }}',
      };

      await executor.execute(action, mockContext);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('上下文更新', () => {
    it('动作返回值应该更新上下文', async () => {
      executor.registerAction('update-context', async () => ({
        newValue: 'updated',
      }));

      const action: Action = {
        id: 'action-1',
        type: 'update-context',
        config: {},
      };

      const result = await executor.execute(action, mockContext);
      expect(result).toEqual({ newValue: 'updated' });
    });
  });
});
