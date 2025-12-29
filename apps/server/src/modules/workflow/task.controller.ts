/**
 * 待办任务控制器
 * 
 * GET /api/tasks/my - 获取当前用户待办
 * GET /api/tasks/:id - 获取任务详情
 * POST /api/tasks/:id/complete - 完成任务
 * POST /api/tasks/:id/reject - 拒绝任务
 * POST /api/tasks/:id/delegate - 委托任务
 */

import { Controller, Get, Post, Param, Body, Req, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { TaskManagerService } from './services/task-manager.service';

@Controller('api/tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly workflowExecutor: WorkflowExecutorService,
    private readonly taskManager: TaskManagerService,
  ) {}

  /**
   * 获取当前用户待办任务
   */
  @Get('my')
  async getMyTasks(
    @Req() req: any,
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('pageSize') pageSize?: string,
    @Query('pageNumber') pageNumber?: string,
  ) {
    const userId = req.user?.id || 'user-1'; // 默认用户
    
    console.log('收到待办任务请求:', { userId, tenantId, status, pageSize, pageNumber });

    try {
      const result = await this.taskManager.getMyTasks(userId, tenantId, {
        status,
        pageSize: pageSize ? parseInt(pageSize) : 10,
        pageNumber: pageNumber ? parseInt(pageNumber) : 1,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('待办任务查询失败:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取任务详情
   */
  @Get(':id')
  async getTaskDetail(@Param('id') taskId: string) {
    try {
      const result = await this.taskManager.getTaskDetail(taskId);

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
   * 完成任务
   */
  @Post(':id/complete')
  async completeTask(
    @Param('id') taskId: string,
    @Body() body: { formData: Record<string, any>; completedBy: string; comment?: string },
  ) {
    try {
      await this.workflowExecutor.completeUserTask(
        taskId,
        body.formData || {},
        body.completedBy,
        body.comment,
      );

      return {
        success: true,
        message: '任务完成',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 拒绝任务
   */
  @Post(':id/reject')
  async rejectTask(
    @Param('id') taskId: string,
    @Body() body: { completedBy: string; comment: string },
  ) {
    try {
      await this.workflowExecutor.completeUserTask(
        taskId,
        { approvalResult: 'rejected' },
        body.completedBy,
        body.comment,
      );

      return {
        success: true,
        message: '任务已拒绝',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 委托任务
   */
  @Post(':id/delegate')
  async delegateTask(
    @Param('id') taskId: string,
    @Body() body: { delegateTo: string; delegatedBy: string; comment?: string },
  ) {
    try {
      await this.taskManager.delegateTask(
        taskId,
        body.delegateTo,
        body.delegatedBy,
        body.comment,
      );

      return {
        success: true,
        message: '任务已委托',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
