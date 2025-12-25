/**
 * 工作流控制器
 */

import { Controller, Post, Body } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import type { WorkflowDSL } from '@metaflow/shared-types';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  /**
   * 启动流程实例
   */
  @Post('start')
  async startWorkflow(
    @Body() body: { workflow: WorkflowDSL; variables?: Record<string, any>; initiator: string }
  ) {
    return this.workflowService.startWorkflow(
      body.workflow,
      body.variables || {},
      body.initiator
    );
  }
}
