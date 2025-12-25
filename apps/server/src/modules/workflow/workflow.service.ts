/**
 * 工作流服务
 */

import { Injectable } from '@nestjs/common';
import { WorkflowEngine } from '@metaflow/logic-engine';
import type { WorkflowDSL, WorkflowInstance } from '@metaflow/shared-types';
import { TaskService } from './task.service';

@Injectable()
export class WorkflowService {
  constructor(private readonly taskService: TaskService) {}

  /**
   * 启动流程实例
   */
  async startWorkflow(
    workflow: WorkflowDSL,
    variables: Record<string, any>,
    initiator: string
  ): Promise<WorkflowInstance> {
    // 创建实例
    const instance: WorkflowInstance = {
      id: `instance-${Date.now()}`,
      workflowId: workflow.id,
      status: 'Running',
      currentNodeId: null,
      variables,
      initiator,
      steps: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 创建引擎
    const engine = new WorkflowEngine(workflow, instance);

    // 注册实例 (供任务完成时调用)
    this.taskService.registerInstance(instance.id, engine);

    // 启动流程
    await engine.start(variables);

    // 获取待办任务
    const tasks = engine.getTasks();
    for (const task of tasks) {
      await this.taskService.createTask(task);
    }

    return engine.getInstance();
  }
}
