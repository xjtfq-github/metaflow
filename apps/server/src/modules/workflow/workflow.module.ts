/**
 * 工作流模块
 */

import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  controllers: [TaskController, WorkflowController],
  providers: [TaskService, WorkflowService],
  exports: [TaskService, WorkflowService],
})
export class WorkflowModule {}
