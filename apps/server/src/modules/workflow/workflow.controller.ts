/**
 * 工作流控制器
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { TaskManagerService } from './services/task-manager.service';
import { PrismaService } from '../../common/prisma.service';
import type { WorkflowDSL } from '@metaflow/shared-types';

@Controller('api/workflows')
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowExecutor: WorkflowExecutorService,
    private readonly taskManager: TaskManagerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 获取所有工作流定义
   */
  @Get()
  async getAllWorkflows(@Query('tenantId') tenantId?: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: workflows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        status: w.status,
        nodes: JSON.parse(w.nodes),
        edges: JSON.parse(w.edges),
        version: w.version,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    };
  }

  /**
   * 创建工作流定义
   */
  @Post()
  async createWorkflow(
    @Body() body: WorkflowDSL & { tenantId?: string; createdBy?: string }
  ) {
    const tenantId = body.tenantId || 'tenant-1';
    const createdBy = body.createdBy || 'system';

    const workflow = await this.prisma.workflow.create({
      data: {
        tenantId,
        name: body.name,
        description: body.description,
        nodes: JSON.stringify(body.nodes || []),
        edges: JSON.stringify(body.edges || []),
        version: body.version || '1.0.0',
        status: 'draft',
        createdBy,
      },
    });

    return {
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
        version: workflow.version,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    };
  }

  /**
   * 启动工作流实例（真实引擎）
   */
  @Post(':id/start')
  async startWorkflow(
    @Param('id') id: string,
    @Body() body: { 
      title?: string;
      description?: string;
      variables?: Record<string, any>; 
      initiator?: string; 
      tenantId?: string 
    },
  ) {
    try {
      // 默认值处理
      const tenantId = body.tenantId || 'tenant-1';
      const initiator = body.initiator || 'user-1';
      const variables = body.variables || {};

      const instance = await this.workflowExecutor.startWorkflow(
        id,
        variables,
        initiator,
        tenantId,
      );

      return {
        success: true,
        data: {
          id: instance.id,
          workflowId: instance.workflowId,
          status: instance.status,
          initiator: instance.initiator,
          createdAt: instance.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取工作流实例列表
   */
  @Get('instances')
  async getAllInstances(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('initiator') initiator?: string,
    @Query('workflowId') workflowId?: string,
    @Query('pageSize') pageSize?: string,
    @Query('pageNumber') pageNumber?: string,
  ) {
    try {
      const result = await this.taskManager.getInstances(tenantId, {
        status,
        initiator,
        workflowId,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        pageNumber: pageNumber ? parseInt(pageNumber) : 1,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取工作流实例详情
   */
  @Get('instances/:instanceId')
  async getInstanceDetail(@Param('instanceId') instanceId: string) {
    try {
      const result = await this.taskManager.getInstanceDetail(instanceId);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 终止流程实例
   */
  @Post('instances/:instanceId/terminate')
  async terminateInstance(
    @Param('instanceId') instanceId: string,
    @Body() body: { terminatedBy?: string },
  ) {
    try {
      const terminatedBy = body.terminatedBy || 'user-1';
      
      // 使用 taskManager 的 cancelInstance 方法
      await this.taskManager.cancelInstance(instanceId, terminatedBy);

      return {
        success: true,
        message: '流程已终止',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取消工作流实例
   */
  @Post('instances/:instanceId/cancel')
  async cancelInstance(
    @Param('instanceId') instanceId: string,
    @Body() body: { cancelledBy: string },
  ) {
    try {
      await this.taskManager.cancelInstance(instanceId, body.cancelledBy);

      return {
        success: true,
        message: '工作流已取消',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 下面是原有的模拟接口（兼容性保留）
   */

  /**
   * 启动工作流实例（模拟）
   * @deprecated 请使用 POST :id/start 替代
   */
  @Post(':id/start-mock')
  async startWorkflowMock(@Param('id') id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    const instance = {
      id: `instance-${Date.now()}`,
      workflowId: id,
      workflowName: workflow.name,
      status: 'running',
      currentNode: '开始节点',
      startedAt: new Date(),
    };

    return {
      success: true,
      data: instance,
    };
  }

  /**
   * 获取单个工作流定义
   */
  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    return {
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
        version: workflow.version,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    };
  }

  /**
   * 更新工作流定义
   */
  @Put(':id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() body: WorkflowDSL
  ) {
    const existing = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    const workflow = await this.prisma.workflow.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        nodes: JSON.stringify(body.nodes || []),
        edges: JSON.stringify(body.edges || []),
        version: body.version || existing.version,
      },
    });

    return {
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
        version: workflow.version,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
      },
    };
  }

  /**
   * 删除工作流定义
   */
  @Delete(':id')
  async deleteWorkflow(@Param('id') id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    await this.prisma.workflow.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Workflow deleted successfully',
    };
  }

  /**
   * 激活工作流（使其可以被启动）
   */
  @Post(':id/activate')
  async activateWorkflow(@Param('id') id: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id },
    });

    if (!workflow) {
      return {
        success: false,
        message: 'Workflow not found',
      };
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: { status: 'active' },
    });

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        status: updated.status,
        nodes: JSON.parse(updated.nodes),
        edges: JSON.parse(updated.edges),
        version: updated.version,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  }
}
