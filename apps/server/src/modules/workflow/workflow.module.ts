/**
 * 工作流模块
 */

import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ConditionEvaluatorService } from './services/condition-evaluator.service';
import { WorkflowExecutorService } from './services/workflow-executor.service';
import { TaskManagerService } from './services/task-manager.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [TaskController, WorkflowController],
  providers: [
    TaskService,
    WorkflowService,
    PrismaService,
    ConditionEvaluatorService,
    WorkflowExecutorService,
    TaskManagerService,
  ],
  exports: [
    TaskService,
    WorkflowService,
    WorkflowExecutorService,
    TaskManagerService,
  ],
})
export class WorkflowModule {}
