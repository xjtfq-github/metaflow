/**
 * 工作流控制器
 */

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import type { WorkflowDSL } from '@metaflow/shared-types';

@Controller('api/workflows')
export class WorkflowController {
  private workflows: Map<string, any> = new Map();
  private instances: Map<string, any> = new Map();

  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * 获取所有工作流定义
   */
  @Get()
  async getAllWorkflows() {
    return {
      success: true,
      data: Array.from(this.workflows.values()),
    };
  }

  /**
   * 创建工作流定义
   */
  @Post()
  async createWorkflow(
    @Body() body: { name: string; description?: string; status: string; nodes?: any[] }
  ) {
    const id = `workflow-${Date.now()}`;
    const workflow = {
      id,
      name: body.name,
      description: body.description,
      status: body.status || 'draft',
      nodes: body.nodes || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(id, workflow);
    return {
      success: true,
      data: workflow,
    };
  }

  /**
   * 获取单个工作流定义
   */
  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }
    return {
      success: true,
      data: workflow,
    };
  }

  /**
   * 更新工作流定义
   */
  @Put(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() body: { name: string; description?: string; status: string; nodes?: any[] }
  ) {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }
    const updated = {
      ...workflow,
      name: body.name,
      description: body.description,
      status: body.status,
      nodes: body.nodes || workflow.nodes,
      updatedAt: new Date(),
    };
    this.workflows.set(id, updated);
    return {
      success: true,
      data: updated,
    };
  }

  /**
   * 删除工作流定义
   */
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    if (!this.workflows.has(id)) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }
    this.workflows.delete(id);
    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  }

  /**
   * 启动工作流实例
   */
  @Post(':id/start')
  async startWorkflow(@Param('id') id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    const instanceId = `instance-${Date.now()}`;
    const instance = {
      id: instanceId,
      workflowId: id,
      workflowName: workflow.name,
      status: 'running',
      currentNode: '开始节点',
      startedAt: new Date(),
    };
    this.instances.set(instanceId, instance);

    return {
      success: true,
      data: instance,
    };
  }

  /**
   * 获取所有工作流实例
   */
  @Get('instances')
  async getAllInstances() {
    return {
      success: true,
      data: Array.from(this.instances.values()),
    };
  }
}
