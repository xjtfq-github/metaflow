/**
 * 待办任务服务
 */

import { Injectable } from '@nestjs/common';
import type { Task, WorkflowInstance } from '@metaflow/shared-types';

@Injectable()
export class TaskService {
  // TODO: 集成数据库存储
  private tasks: Task[] = [];
  private instances: Map<string, any> = new Map();

  /**
   * 创建待办任务
   */
  async createTask(task: Task): Promise<Task> {
    this.tasks.push(task);
    return task;
  }

  /**
   * 根据审批人获取待办
   */
  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    return this.tasks.filter(
      (t) => t.status === 'Pending' && this.matchAssignee(t.assignee, assignee)
    );
  }

  /**
   * 完成任务
   */
  async completeTask(
    taskId: string,
    variables: Record<string, any>
  ): Promise<WorkflowInstance> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'Pending') {
      throw new Error(`Task ${taskId} not found or already completed`);
    }

    // 标记任务完成
    task.status = 'Completed';
    task.completedAt = new Date();

    // 驱动工作流引擎继续
    const engine = this.instances.get(task.instanceId);
    if (!engine) {
      throw new Error(`Workflow instance ${task.instanceId} not found`);
    }

    return engine.completeTask(taskId, variables);
  }

  /**
   * 匹配审批人
   */
  private matchAssignee(taskAssignee: string, userId: string): boolean {
    // user:xxx
    if (taskAssignee === `user:${userId}`) {
      return true;
    }

    // role:xxx (需要查询用户角色)
    if (taskAssignee.startsWith('role:')) {
      // TODO: 集成权限系统
      return false;
    }

    // 直接匹配
    return taskAssignee === userId;
  }

  /**
   * 注册工作流引擎实例
   */
  registerInstance(instanceId: string, engine: any): void {
    this.instances.set(instanceId, engine);
  }
}
