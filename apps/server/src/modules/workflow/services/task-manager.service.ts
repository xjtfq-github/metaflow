import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

/**
 * 任务管理器服务
 * 负责任务查询、分配、委托等操作
 */
@Injectable()
export class TaskManagerService {
  private readonly logger = new Logger(TaskManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取我的待办任务
   */
  async getMyTasks(
    assignee: string,
    tenantId: string,
    options?: {
      status?: string;
      pageSize?: number;
      pageNumber?: number;
    },
  ) {
    this.logger.log(`收到参数: assignee=${assignee}, tenantId=${tenantId}, options=${JSON.stringify(options)}`);
        
    const { status, pageSize = 10, pageNumber = 1 } = options || {};
    
    // 先查询符合条件的 WorkflowInstance IDs
    const instances = await this.prisma.workflowInstance.findMany({
      where: { tenantId },
      select: { id: true },
    });
    
    const instanceIds = instances.map(i => i.id);
    
    // 再查询 TaskInstance
    const where: any = {
      assignee,
      instanceId: {
        in: instanceIds,
      },
    };
        
    if (status) {
      where.status = status;
    }
        
    this.logger.log(`查询条件: ${JSON.stringify(where)}`);
    this.logger.log(`where 对象类型: ${typeof where}, keys: ${Object.keys(where).join(', ')}`);
    
    const [items, total] = await Promise.all([
      this.prisma.taskInstance.findMany({
        where: { ...where }, // 创建副本，防止被修改
        include: {
          instance: {
            include: {
              workflow: {
                select: {
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.taskInstance.count({ where: { ...where } }), // 创建副本
    ]);

    return {
      items: items.map((task) => ({
        id: task.id,
        instanceId: task.instanceId,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        nodeType: task.nodeType,
        assignee: task.assignee,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        workflow: {
          name: task.instance.workflow.name,
          description: task.instance.workflow.description,
        },
        instance: {
          id: task.instance.id,
          status: task.instance.status,
          initiator: task.instance.initiator,
        },
      })),
      total,
      page: pageNumber,
      pageSize,
    };
  }

  /**
   * 获取任务详情
   */
  async getTaskDetail(taskId: string) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id: taskId },
      include: {
        instance: {
          include: {
            workflow: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    const nodes = JSON.parse(task.instance.workflow.nodes);
    const node = nodes.find((n: any) => n.id === task.nodeId);

    return {
      task: {
        id: task.id,
        instanceId: task.instanceId,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        nodeType: task.nodeType,
        assignee: task.assignee,
        status: task.status,
        formData: task.formData ? JSON.parse(task.formData) : null,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        comment: task.comment,
      },
      workflow: {
        id: task.instance.workflow.id,
        name: task.instance.workflow.name,
        description: task.instance.workflow.description,
      },
      instance: {
        id: task.instance.id,
        status: task.instance.status,
        variables: JSON.parse(task.instance.variables),
        initiator: task.instance.initiator,
        createdAt: task.instance.createdAt,
      },
      nodeConfig: node?.props || {},
    };
  }

  /**
   * 委托任务
   */
  async delegateTask(
    taskId: string,
    delegateTo: string,
    delegatedBy: string,
    comment?: string,
  ) {
    const task = await this.prisma.taskInstance.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.status !== 'pending') {
      throw new Error('只能委托待处理的任务');
    }

    // 更新审批人
    await this.prisma.taskInstance.update({
      where: { id: taskId },
      data: {
        assignee: delegateTo,
      },
    });

    // 记录日志
    await this.prisma.workflowLog.create({
      data: {
        instanceId: task.instanceId,
        level: 'info',
        message: `任务委托: ${delegatedBy} → ${delegateTo}${comment ? `, 备注: ${comment}` : ''}`,
        nodeId: task.nodeId,
        taskId: task.id,
        metadata: '{}',
      },
    });

    this.logger.log(
      `任务委托: ${taskId}, ${delegatedBy} → ${delegateTo}`,
    );
  }

  /**
   * 获取工作流实例详情
   */
  async getInstanceDetail(instanceId: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: {
        workflow: true,
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        logs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // 最近50条日志
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('工作流实例不存在');
    }

    return {
      instance: {
        id: instance.id,
        workflowId: instance.workflowId,
        status: instance.status,
        currentNodeIds: JSON.parse(instance.currentNodeIds),
        variables: JSON.parse(instance.variables),
        context: instance.context ? JSON.parse(instance.context) : null,
        initiator: instance.initiator,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
        completedAt: instance.completedAt,
        errorMessage: instance.errorMessage,
      },
      workflow: {
        id: instance.workflow.id,
        name: instance.workflow.name,
        description: instance.workflow.description,
        nodes: JSON.parse(instance.workflow.nodes),
        edges: JSON.parse(instance.workflow.edges),
      },
      tasks: instance.tasks.map((task) => ({
        id: task.id,
        nodeId: task.nodeId,
        nodeName: task.nodeName,
        nodeType: task.nodeType,
        assignee: task.assignee,
        status: task.status,
        formData: task.formData ? JSON.parse(task.formData) : null,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        completedBy: task.completedBy,
        comment: task.comment,
      })),
      logs: instance.logs.map((log) => ({
        id: log.id,
        level: log.level,
        message: log.message,
        nodeId: log.nodeId,
        taskId: log.taskId,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * 获取工作流实例列表
   */
  async getInstances(
    tenantId: string,
    options?: {
      status?: string;
      initiator?: string;
      workflowId?: string;
      pageSize?: number;
      pageNumber?: number;
    },
  ) {
    const { status, initiator, workflowId, pageSize = 10, pageNumber = 1 } = options || {};

    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (initiator) {
      where.initiator = initiator;
    }

    if (workflowId) {
      where.workflowId = workflowId;
    }

    const [items, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        include: {
          workflow: {
            select: {
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);

    return {
      items: items.map((instance) => ({
        id: instance.id,
        workflowId: instance.workflowId,
        workflow: {
          name: instance.workflow.name,
          description: instance.workflow.description,
        },
        currentNode: JSON.parse(instance.currentNodeIds)[0] || '-',
        status: instance.status,
        initiator: instance.initiator,
        createdAt: instance.createdAt,
        completedAt: instance.completedAt,
      })),
      total,
      page: pageNumber,
      pageSize,
    };
  }

  /**
   * 取消工作流实例
   */
  async cancelInstance(instanceId: string, cancelledBy: string) {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new NotFoundException('工作流实例不存在');
    }

    if (instance.status !== 'running') {
      throw new Error('只能取消运行中的工作流');
    }

    // 更新实例状态
    await this.prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
      },
    });

    // 取消所有待处理的任务
    await this.prisma.taskInstance.updateMany({
      where: {
        instanceId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });

    // 记录日志
    await this.prisma.workflowLog.create({
      data: {
        instanceId,
        level: 'info',
        message: `工作流已取消, 操作人: ${cancelledBy}`,
        metadata: '{}',
      },
    });

    this.logger.log(`工作流取消: ${instanceId}, 操作人: ${cancelledBy}`);
  }
}
