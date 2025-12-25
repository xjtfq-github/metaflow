/**
 * WorkflowEngine 单元测试
 */

import { WorkflowEngine } from '../WorkflowEngine';
import type { WorkflowDSL, WorkflowNode } from '@metaflow/shared-types';

describe('WorkflowEngine', () => {
  describe('基础流程', () => {
    it('应该能启动简单的线性流程', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-1',
        name: 'Simple Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'end' }],
      };

      const engine = new WorkflowEngine(workflow);
      const instance = await engine.start();

      expect(instance.status).toBe('Finished');
      expect(instance.currentNodeId).toBeNull();
    });

    it('应该正确执行 UserTask 节点并挂起', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-2',
        name: 'UserTask Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'task1',
            name: 'Approve',
            type: 'UserTask',
            config: { assignee: 'user-1' },
          },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'task1' },
          { id: 'e2', source: 'task1', target: 'end' },
        ],
      };

      const engine = new WorkflowEngine(workflow);
      const instance = await engine.start();

      expect(instance.status).toBe('Suspended');
      expect(instance.currentNodeId).toBe('task1');
    });

    it('应该能从 UserTask 恢复执行', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-3',
        name: 'Resume Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'task1',
            name: 'Approve',
            type: 'UserTask',
            config: { assignee: 'user-1' },
          },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'task1' },
          { id: 'e2', source: 'task1', target: 'end' },
        ],
      };

      const engine = new WorkflowEngine(workflow);
      await engine.start();

      const resumed = await engine.resume({ approved: true });

      expect(resumed.status).toBe('Finished');
      expect(resumed.currentNodeId).toBeNull();
      expect(resumed.variables.approved).toBe(true);
    });
  });

  describe('网关节点', () => {
    it('Gateway 应该根据条件选择路径', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-4',
        name: 'Gateway Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'gateway',
            name: 'Check Amount',
            type: 'Gateway',
            config: {},
          },
          { id: 'approve', name: 'Approve', type: 'ServiceTask', config: {} },
          { id: 'reject', name: 'Reject', type: 'ServiceTask', config: {} },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'gateway' },
          {
            id: 'e2',
            source: 'gateway',
            target: 'approve',
            condition: '{{ amount < 1000 }}',
          },
          {
            id: 'e3',
            source: 'gateway',
            target: 'reject',
            condition: '{{ amount >= 1000 }}',
          },
          { id: 'e4', source: 'approve', target: 'end' },
          { id: 'e5', source: 'reject', target: 'end' },
        ],
      };

      const engine = new WorkflowEngine(workflow);
      const instance = await engine.start({ amount: 500 });

      expect(instance.status).toBe('Finished');
      // 应该走 approve 路径
    });
  });

  describe('ServiceTask 执行', () => {
    it('应该自动执行 ServiceTask', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-5',
        name: 'ServiceTask Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'service1',
            name: 'Send Email',
            type: 'ServiceTask',
            config: { service: 'email', method: 'send' },
          },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'service1' },
          { id: 'e2', source: 'service1', target: 'end' },
        ],
      };

      const engine = new WorkflowEngine(workflow);
      const instance = await engine.start();

      expect(instance.status).toBe('Finished');
    });
  });

  describe('错误处理', () => {
    it('没有 StartEvent 应该抛出错误', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-6',
        name: 'Invalid Workflow',
        version: '1.0',
        nodes: [{ id: 'end', name: 'End', type: 'EndEvent', config: {} }],
        edges: [],
      };

      const engine = new WorkflowEngine(workflow);

      await expect(engine.start()).rejects.toThrow(
        'Workflow must have a StartEvent node'
      );
    });

    it('超过最大步数应该抛出错误', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-7',
        name: 'Loop Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'service1',
            name: 'Service',
            type: 'ServiceTask',
            config: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'service1' },
          { id: 'e2', source: 'service1', target: 'service1' }, // 自循环
        ],
      };

      const engine = new WorkflowEngine(workflow);

      await expect(engine.start()).rejects.toThrow(
        'Exceeded maximum steps'
      );
    });

    it('找不到下一个节点应该报错', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-8',
        name: 'No Next Node',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'service1',
            name: 'Service',
            type: 'ServiceTask',
            config: {},
          },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'service1' }],
        // service1 没有出边
      };

      const engine = new WorkflowEngine(workflow);

      await expect(engine.start()).rejects.toThrow('No outgoing edge found');
    });
  });

  describe('变量管理', () => {
    it('应该保存流程变量', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-9',
        name: 'Variable Workflow',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [{ id: 'e1', source: 'start', target: 'end' }],
      };

      const engine = new WorkflowEngine(workflow);
      const instance = await engine.start({
        orderId: '12345',
        amount: 1000,
      });

      expect(instance.variables.orderId).toBe('12345');
      expect(instance.variables.amount).toBe(1000);
    });

    it('resume 应该合并变量', async () => {
      const workflow: WorkflowDSL = {
        id: 'wf-10',
        name: 'Resume Variables',
        version: '1.0',
        nodes: [
          { id: 'start', name: 'Start', type: 'StartEvent', config: {} },
          {
            id: 'task1',
            name: 'Task',
            type: 'UserTask',
            config: { assignee: 'user-1' },
          },
          { id: 'end', name: 'End', type: 'EndEvent', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'task1' },
          { id: 'e2', source: 'task1', target: 'end' },
        ],
      };

      const engine = new WorkflowEngine(workflow);
      await engine.start({ initialValue: 100 });

      const resumed = await engine.resume({ newValue: 200 });

      expect(resumed.variables.initialValue).toBe(100);
      expect(resumed.variables.newValue).toBe(200);
    });
  });
});
