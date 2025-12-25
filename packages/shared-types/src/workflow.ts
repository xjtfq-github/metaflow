/**
 * 工作流类型定义
 * 
 * 轻量 BPMN 引擎
 */

/**
 * 节点类型
 */
export type NodeType =
  | 'StartEvent'      // 开始节点
  | 'EndEvent'        // 结束节点
  | 'UserTask'        // 人工任务
  | 'ServiceTask'     // 自动任务
  | 'Gateway';        // 网关(条件分支)

/**
 * 流程节点
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  name?: string;
  /** 任务审批人 (UserTask) */
  assignee?: string;  // ${initiator} | role:xxx | user:xxx
  /** 任务超时 (分钟) */
  timeout?: number;
  /** 自定义属性 */
  props?: Record<string, any>;
}

/**
 * 流程连线
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  /** 网关条件表达式 */
  condition?: string;
  /** 连线名称 */
  label?: string;
}

/**
 * 流程定义 DSL
 */
export interface WorkflowDSL {
  id: string;
  version: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * 流程实例状态
 */
export type InstanceStatus =
  | 'Running'      // 运行中
  | 'Suspended'    // 已挂起(等待人工)
  | 'Finished'     // 已完成
  | 'Error';       // 异常

/**
 * 流程实例
 */
export interface WorkflowInstance {
  id: string;
  workflowId: string;
  status: InstanceStatus;
  /** 当前令牌所在节点 */
  currentNodeId: string | null;
  /** 流程变量 */
  variables: Record<string, any>;
  /** 发起人 */
  initiator: string;
  /** 已执行步数 */
  steps: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 待办任务
 */
export interface Task {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeName: string;
  /** 审批人 */
  assignee: string;
  status: 'Pending' | 'Completed' | 'Timeout';
  createdAt: Date;
  completedAt?: Date;
}
