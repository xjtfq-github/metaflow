import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { ConditionEvaluatorService } from './condition-evaluator.service';

/**
 * 工作流执行器服务
 * 负责工作流实例的启动、节点执行、状态流转
 */
@Injectable()
export class WorkflowExecutorService {
  private readonly logger = new Logger(WorkflowExecutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conditionEvaluator: ConditionEvaluatorService,
  ) {}

  /**
   * 启动工作流
   */
  async startWorkflow(
    workflowId: string,
    variables: Record<string, any>,
    initiator: string,
    tenantId: string,
  ) {
    this.logger.log(`启动工作流: ${workflowId}, 发起人: ${initiator}`);

    // 1. 加载工作流定义
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException('工作流不存在');
    }

    if (workflow.status !== 'active') {
      throw new Error('工作流未激活');
    }

    const nodes = JSON.parse(workflow.nodes);
    const edges = JSON.parse(workflow.edges);

    // 2. 验证 DSL
    this.validateWorkflowDSL(nodes, edges);

    // 3. 创建工作流实例
    const instance = await this.prisma.workflowInstance.create({
      data: {
        workflowId,
        tenantId,
        status: 'running',
        currentNodeIds: '[]',
        variables: JSON.stringify(variables),
        initiator,
        context: JSON.stringify({
          startTime: new Date().toISOString(),
          nodeExecutionCount: {},
        }),
      },
    });

    // 4. 找到开始节点
    const startNode = nodes.find((n: any) => n.type === 'StartEvent');
    if (!startNode) {
      throw new Error('找不到开始节点');
    }

    // 5. 创建初始令牌
    await this.createToken(instance.id, startNode.id, tenantId);

    // 6. 记录日志
    await this.logWorkflowEvent(
      instance.id,
      'info',
      `工作流启动: ${workflow.name}`,
    );

    // 7. 执行开始节点
    await this.executeNode(instance.id, startNode.id);

    return instance;
  }

  /**
   * 执行节点
   */
  async executeNode(instanceId: string, nodeId: string): Promise<void> {
    this.logger.log(`执行节点: instanceId=${instanceId}, nodeId=${nodeId}`);

    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { workflow: true },
    });

    if (!instance) {
      throw new NotFoundException('工作流实例不存在');
    }

    const nodes = JSON.parse(instance.workflow.nodes);
    const edges = JSON.parse(instance.workflow.edges);
    const node = nodes.find((n: any) => n.id === nodeId);

    if (!node) {
      throw new Error(`节点 ${nodeId} 不存在`);
    }

    // 记录日志
    await this.logWorkflowEvent(
      instanceId,
      'info',
      `执行节点: ${node.name || node.type}`,
      nodeId,
    );

    // 更新当前节点
    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { currentNodeIds: JSON.stringify([nodeId]) },
    });

    // 根据节点类型执行
    switch (node.type) {
      case 'StartEvent':
        await this.executeStartEvent(instance, node, edges);
        break;
      case 'EndEvent':
        await this.executeEndEvent(instance, node);
        break;
      case 'UserTask':
        await this.executeUserTask(instance, node);
        break;
      case 'ServiceTask':
        await this.executeServiceTask(instance, node, edges);
        break;
      case 'Gateway':
        await this.executeGateway(instance, node, edges);
        break;
      case 'ParallelGateway':
        await this.executeParallelGateway(instance, node, edges);
        break;
      default:
        throw new Error(`不支持的节点类型: ${node.type}`);
    }
  }

  /**
   * 执行开始节点
   */
  private async executeStartEvent(
    instance: any,
    node: any,
    edges: any[],
  ): Promise<void> {
    // 找到下一个节点
    const outgoingEdges = edges.filter((e) => e.source === node.id);
    if (outgoingEdges.length === 0) {
      throw new Error('开始节点没有出边');
    }

    // 执行下一个节点
    const nextNodeId = outgoingEdges[0].target;
    await this.executeNode(instance.id, nextNodeId);
  }

  /**
   * 执行结束节点
   */
  private async executeEndEvent(instance: any, node: any): Promise<void> {
    // 完成令牌
    await this.completeToken(instance.id, node.id);

    // 检查是否所有令牌都已完成
    const activeTokens = await this.prisma.workflowToken.count({
      where: {
        instanceId: instance.id,
        status: 'active',
      },
    });

    if (activeTokens === 0) {
      // 工作流完成
      await this.prisma.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      await this.logWorkflowEvent(instance.id, 'info', '工作流完成');
      this.logger.log(`工作流完成: ${instance.id}`);
    }
  }

  /**
   * 执行用户任务
   */
  private async executeUserTask(instance: any, node: any): Promise<void> {
    const props = node.props || {};

    // 解析审批人（支持模板变量）
    const variables = JSON.parse(instance.variables);
    const assignee = this.resolveAssignee(props.assignee || '', variables);

    // 创建任务实例
    const task = await this.prisma.taskInstance.create({
      data: {
        tenantId: instance.tenantId, // 继承工作流实例的 tenantId
        instanceId: instance.id,
        nodeId: node.id,
        nodeName: node.name || 'UserTask',
        nodeType: 'UserTask',
        assignee,
        status: 'pending',
        dueDate: props.dueDate ? this.parseDueDate(props.dueDate) : null,
      },
    });

    await this.logWorkflowEvent(
      instance.id,
      'info',
      `创建用户任务: ${assignee}`,
      node.id,
      task.id,
    );

    this.logger.log(`创建用户任务: ${task.id}, 审批人: ${assignee}`);
  }

  /**
   * 完成用户任务
   */
  async completeUserTask(
    taskId: string,
    formData: Record<string, any>,
    completedBy: string,
    comment?: string,
  ): Promise<void> {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id: taskId },
      include: { instance: { include: { workflow: true } } },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.status !== 'pending') {
      throw new Error('任务已处理');
    }

    // 更新任务状态
    await this.prisma.taskInstance.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        formData: JSON.stringify(formData),
        completedBy,
        completedAt: new Date(),
        comment,
      },
    });

    // 合并表单数据到流程变量
    const variables = JSON.parse(task.instance.variables);
    const updatedVariables = {
      ...variables,
      ...formData,
    };

    await this.prisma.workflowInstance.update({
      where: { id: task.instanceId },
      data: { variables: JSON.stringify(updatedVariables) },
    });

    await this.logWorkflowEvent(
      task.instanceId,
      'info',
      `任务完成: ${completedBy}`,
      task.nodeId,
      taskId,
    );

    this.logger.log(`任务完成: ${taskId}, 完成人: ${completedBy}`);

    // 继续执行下一个节点
    const edges = JSON.parse(task.instance.workflow.edges);
    const outgoingEdges = edges.filter((e: any) => e.source === task.nodeId);

    if (outgoingEdges.length > 0) {
      await this.executeNode(task.instanceId, outgoingEdges[0].target);
    }
  }

  /**
   * 执行服务任务
   */
  private async executeServiceTask(
    instance: any,
    node: any,
    edges: any[],
  ): Promise<void> {
    const props = node.props || {};

    try {
      // 根据 action 执行不同的操作
      switch (props.action) {
        case 'sendEmail':
          await this.sendEmail(props.params, JSON.parse(instance.variables));
          break;
        case 'callApi':
          await this.callApi(props.params, JSON.parse(instance.variables));
          break;
        case 'executeScript':
          await this.executeScript(props.params, JSON.parse(instance.variables));
          break;
        default:
          this.logger.warn(`未知的服务任务动作: ${props.action}`);
      }

      await this.logWorkflowEvent(
        instance.id,
        'info',
        `服务任务执行成功: ${props.action}`,
        node.id,
      );

      // 继续执行下一个节点
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length > 0) {
        await this.executeNode(instance.id, outgoingEdges[0].target);
      }
    } catch (error) {
      await this.handleServiceTaskError(instance, node, error);
    }
  }

  /**
   * 执行排他网关
   */
  private async executeGateway(
    instance: any,
    node: any,
    edges: any[],
  ): Promise<void> {
    const outgoingEdges = edges.filter((e) => e.source === node.id);

    if (outgoingEdges.length === 0) {
      throw new Error('网关没有出边');
    }

    const variables = JSON.parse(instance.variables);

    // 评估条件，找到第一个满足的分支
    for (const edge of outgoingEdges) {
      if (edge.condition) {
        const result = this.conditionEvaluator.evaluate(
          edge.condition,
          variables,
        );
        if (result) {
          await this.logWorkflowEvent(
            instance.id,
            'info',
            `网关选择分支: ${edge.label || edge.id}`,
            node.id,
          );
          await this.executeNode(instance.id, edge.target);
          return;
        }
      }
    }

    // 如果没有满足的条件，使用默认分支
    const props = node.props || {};
    const defaultEdgeId = props.defaultEdge;
    const defaultEdge = outgoingEdges.find((e) => e.id === defaultEdgeId);

    if (defaultEdge) {
      await this.logWorkflowEvent(
        instance.id,
        'info',
        '网关选择默认分支',
        node.id,
      );
      await this.executeNode(instance.id, defaultEdge.target);
    } else {
      throw new Error('网关没有满足条件的分支，也没有默认分支');
    }
  }

  /**
   * 执行并行网关（分裂）
   */
  private async executeParallelGateway(
    instance: any,
    node: any,
    edges: any[],
  ): Promise<void> {
    const outgoingEdges = edges.filter((e) => e.source === node.id);

    if (outgoingEdges.length === 0) {
      throw new Error('并行网关没有出边');
    }

    // 获取当前令牌
    const currentToken = await this.prisma.workflowToken.findFirst({
      where: {
        instanceId: instance.id,
        nodeId: node.id,
        status: 'active',
      },
    });

    // 为每个分支创建子令牌
    for (const edge of outgoingEdges) {
      await this.createToken(instance.id, edge.target, instance.tenantId, currentToken?.id);
    }

    // 完成当前令牌
    if (currentToken) {
      await this.completeToken(instance.id, node.id);
    }

    await this.logWorkflowEvent(
      instance.id,
      'info',
      `并行网关分裂为 ${outgoingEdges.length} 个分支`,
      node.id,
    );

    // 并行执行所有分支
    await Promise.all(
      outgoingEdges.map((edge) => this.executeNode(instance.id, edge.target)),
    );
  }

  /**
   * 解析审批人
   */
  private resolveAssignee(
    assigneeTemplate: string,
    variables: Record<string, any>,
  ): string {
    if (!assigneeTemplate) {
      return '';
    }

    return this.conditionEvaluator.parseTemplate(assigneeTemplate, variables);
  }

  /**
   * 解析超时时间（ISO 8601 Duration）
   */
  private parseDueDate(duration: string): Date {
    // 简单实现，支持 P1D (1天), PT1H (1小时) 等
    const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?/);
    if (!match) {
      throw new Error(`无效的时间格式: ${duration}`);
    }

    const days = parseInt(match[1] || '0', 10);
    const hours = parseInt(match[2] || '0', 10);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    dueDate.setHours(dueDate.getHours() + hours);

    return dueDate;
  }

  /**
   * 创建令牌
   */
  private async createToken(
    instanceId: string,
    nodeId: string,
    tenantId: string,
    parentTokenId?: string,
  ): Promise<void> {
    await this.prisma.workflowToken.create({
      data: {
        instanceId,
        nodeId,
        tenantId,
        parentTokenId,
        status: 'active',
      },
    });
  }

  /**
   * 完成令牌
   */
  private async completeToken(instanceId: string, nodeId: string): Promise<void> {
    await this.prisma.workflowToken.updateMany({
      where: {
        instanceId,
        nodeId,
        status: 'active',
      },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  /**
   * 记录工作流日志
   */
  private async logWorkflowEvent(
    instanceId: string,
    level: string,
    message: string,
    nodeId?: string,
    taskId?: string,
  ): Promise<void> {
    await this.prisma.workflowLog.create({
      data: {
        instanceId,
        level,
        message,
        nodeId,
        taskId,
        metadata: '{}',
      },
    });
  }

  /**
   * 验证工作流 DSL
   */
  private validateWorkflowDSL(nodes: any[], edges: any[]): void {
    // 检查开始节点
    const startNodes = nodes.filter((n) => n.type === 'StartEvent');
    if (startNodes.length !== 1) {
      throw new Error('工作流必须有且仅有一个开始节点');
    }

    // 检查结束节点
    const endNodes = nodes.filter((n) => n.type === 'EndEvent');
    if (endNodes.length === 0) {
      throw new Error('工作流至少需要一个结束节点');
    }
  }

  // 辅助方法
  private async sendEmail(params: any, variables: any): Promise<void> {
    this.logger.log('发送邮件:', params);
    // TODO: 实现邮件发送逻辑
  }

  private async callApi(params: any, variables: any): Promise<void> {
    this.logger.log('调用 API:', params);
    // TODO: 实现 API 调用逻辑
  }

  private async executeScript(params: any, variables: any): Promise<void> {
    this.logger.log('执行脚本:', params);
    // TODO: 实现脚本执行逻辑
  }

  private async handleServiceTaskError(
    instance: any,
    node: any,
    error: any,
  ): Promise<void> {
    await this.logWorkflowEvent(
      instance.id,
      'error',
      `服务任务执行失败: ${error.message}`,
      node.id,
    );

    await this.prisma.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: 'error',
        errorMessage: error.message,
      },
    });

    this.logger.error(`工作流执行错误: ${instance.id}`, error);
  }
}
