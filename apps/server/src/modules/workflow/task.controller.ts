/**
 * 待办任务控制器
 * 
 * GET /api/tasks/my - 获取当前用户待办
 * POST /api/tasks/:id/complete - 完成任务
 */

import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * 获取当前用户待办任务
   */
  @Get('my')
  async getMyTasks(@Req() req: any) {
    const userId = req.user?.id || 'anonymous';
    return this.taskService.getTasksByAssignee(userId);
  }

  /**
   * 完成任务
   */
  @Post(':id/complete')
  async completeTask(
    @Param('id') taskId: string,
    @Body() body: { variables?: Record<string, any> }
  ) {
    return this.taskService.completeTask(taskId, body.variables || {});
  }
}
