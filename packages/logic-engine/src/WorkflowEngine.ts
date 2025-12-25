/**
 * 工作流引擎
 * 
 * 有限状态机 (FSM) + 令牌调度
 */

import type {
  WorkflowDSL,
  WorkflowNode,
  WorkflowEdge,
  WorkflowInstance,
  InstanceStatus,
  Task,
} from '@metaflow/shared-types';

/**
 * 最大执行步数 (防止无限循环)
 */
const MAX_STEPS = 1000;

/**
 * 节点执行结果
 */
interface NodeExecutionResult {
  /** 是否需要挂起 (UserTask) */
  suspend: boolean;
  /** 输出数据 (合并到 variables) */
  output?: Record<string, any>;
  /** 错误信息 */
  error?: string;
}

/**
 * 工作流引擎
 */
export class WorkflowEngine {
  private workflow: WorkflowDSL;
  private instance: WorkflowInstance;
  private tasks: Task[] = [];

  constructor(workflow: WorkflowDSL, instance: WorkflowInstance) {
    this.workflow = workflow;
    this.instance = instance;
  }

  /**
   * 启动流程实例
   */
  async start(variables: Record<string, any> = {}): Promise<WorkflowInstance> {
    // 找到开始节点
    const startNode = this.workflow.nodes.find((n) => n.type === 'StartEvent');
    if (!startNode) {
      throw new Error('Workflow must have a StartEvent node');
    }

    // 初始化实例
    this.instance.status = 'Running';
    this.instance.currentNodeId = startNode.id;
    this.instance.variables = { ...this.instance.variables, ...variables };
    this.instance.steps = 0;

    // 开始调度
    await this.runStep();

    return this.instance;
  }

  /**
   * 完成任务 (驱动状态机继续运行)
   */
  async completeTask(taskId: string, variables: Record<string, any> = {}): Promise<WorkflowInstance> {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'Pending') {
      throw new Error(`Task ${taskId} not found or already completed`);
    }

    // 标记任务完成
    task.status = 'Completed';
    task.completedAt = new Date();

    // 合并变量
    this.instance.variables = { ...this.instance.variables, ...variables };

    // 恢复运行
    this.instance.status = 'Running';
    await this.runStep();

    return this.instance;
  }

  /**
   * 令牌调度器 (核心)
   */
  private async runStep(): Promise<void> {
    while (
      this.instance.status === 'Running' &&
      this.instance.currentNodeId &&
      this.instance.steps < MAX_STEPS
    ) {
      this.instance.steps++;

      const currentNode = this.getNode(this.instance.currentNodeId);
      if (!currentNode) {
        this.instance.status = 'Error';
        throw new Error(`Node ${this.instance.currentNodeId} not found`);
      }

      // 执行节点
      const result = await this.executeNode(currentNode);

      // 处理错误
      if (result.error) {
        this.instance.status = 'Error';
        throw new Error(result.error);
      }

      // 合并输出
      if (result.output) {
        this.instance.variables = { ...this.instance.variables, ...result.output };
      }

      // 挂起流程 (UserTask)
      if (result.suspend) {
        this.instance.status = 'Suspended';
        return;
      }

      // 结束节点
      if (currentNode.type === 'EndEvent') {
        this.instance.status = 'Finished';
        this.instance.currentNodeId = null;
        return;
      }

      // 查找下一节点
      const nextNodeId = await this.findNextNode(currentNode);
      if (!nextNodeId) {
        this.instance.status = 'Error';
        throw new Error(`No outgoing edge from node ${currentNode.id}`);
      }

      this.instance.currentNodeId = nextNodeId;
    }

    // 超过最大步数
    if (this.instance.steps >= MAX_STEPS) {
      this.instance.status = 'Error';
      throw new Error('Exceeded maximum steps (possible infinite loop)');
    }
  }

  /**
   * 执行单个节点
   */
  private async executeNode(node: WorkflowNode): Promise<NodeExecutionResult> {
    switch (node.type) {
      case 'StartEvent':
        return { suspend: false };

      case 'EndEvent':
        return { suspend: false };

      case 'UserTask':
        return this.executeUserTask(node);

      case 'ServiceTask':
        return this.executeServiceTask(node);

      case 'Gateway':
        return { suspend: false };

      default:
        return { suspend: false, error: `Unknown node type: ${node.type}` };
    }
  }

  /**
   * 执行人工任务 (创建待办)
   */
  private async executeUserTask(node: WorkflowNode): Promise<NodeExecutionResult> {
    // 解析审批人
    const assignee = this.resolveAssignee(node.assignee || '');

    // 创建待办任务
    const task: Task = {
      id: `task-${Date.now()}`,
      instanceId: this.instance.id,
      nodeId: node.id,
      nodeName: node.name || node.id,
      assignee,
      status: 'Pending',
      createdAt: new Date(),
    };

    this.tasks.push(task);

    // 挂起流程,等待人工操作
    return { suspend: true };
  }

  /**
   * 执行自动任务
   */
  private async executeServiceTask(node: WorkflowNode): Promise<NodeExecutionResult> {
    // TODO: 集成 ActionExecutor 执行自动逻辑
    console.log('Executing ServiceTask:', node.id);
    return { suspend: false };
  }

  /**
   * 查找下一节点
   */
  private async findNextNode(currentNode: WorkflowNode): Promise<string | null> {
    const outgoingEdges = this.workflow.edges.filter((e) => e.source === currentNode.id);

    if (outgoingEdges.length === 0) {
      return null;
    }

    // 网关: 评估条件
    if (currentNode.type === 'Gateway') {
      for (const edge of outgoingEdges) {
        if (!edge.condition || this.evaluateCondition(edge.condition)) {
          return edge.target;
        }
      }
      // 无匹配条件 (需要默认分支)
      throw new Error(`Gateway ${currentNode.id} has no matching condition`);
    }

    // 其他节点: 取第一条出边
    return outgoingEdges[0].target;
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string): boolean {
    try {
      const func = new Function('vars', `with(vars) { return ${condition}; }`);
      return !!func(this.instance.variables);
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * 解析审批人
   */
  private resolveAssignee(assignee: string): string {
    // ${initiator}
    if (assignee === '${initiator}') {
      return this.instance.initiator;
    }

    // role:xxx / user:xxx
    if (assignee.startsWith('role:') || assignee.startsWith('user:')) {
      return assignee;
    }

    return assignee;
  }

  /**
   * 获取节点
   */
  private getNode(nodeId: string): WorkflowNode | undefined {
    return this.workflow.nodes.find((n) => n.id === nodeId);
  }

  /**
   * 获取待办任务列表
   */
  getTasks(): Task[] {
    return this.tasks;
  }

  /**
   * 获取当前实例状态
   */
  getInstance(): WorkflowInstance {
    return this.instance;
  }
}
