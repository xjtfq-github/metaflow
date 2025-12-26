import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class EamService {
  constructor(private prisma: PrismaService) {}

  // ========== 资产管理 ==========
  
  async createAsset(data: any, tenantId: string) {
    return this.prisma.asset.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getAssets(tenantId: string, status?: string) {
    return this.prisma.asset.findMany({
      where: {
        tenantId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        workOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        inspectionPlans: true,
      },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async updateAsset(id: string, data: any) {
    return this.prisma.asset.update({
      where: { id },
      data,
    });
  }

  // 获取维保预警列表
  async getMaintenanceAlerts(tenantId: string) {
    const now = new Date();
    const alertDate = new Date();
    alertDate.setDate(now.getDate() + 7); // 7天内需要维保的设备

    return this.prisma.asset.findMany({
      where: {
        tenantId,
        status: 'active',
        nextMaintenance: {
          lte: alertDate,
        },
      },
      orderBy: { nextMaintenance: 'asc' },
    });
  }

  // ========== 工单管理 ==========

  async createWorkOrder(data: any, tenantId: string) {
    // 生成工单编号
    const count = await this.prisma.workOrder.count({ where: { tenantId } });
    const orderNo = `WO-${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;

    return this.prisma.workOrder.create({
      data: {
        ...data,
        orderNo,
        tenantId,
      },
      include: {
        asset: true,
        assignee: true,
      },
    });
  }

  async getWorkOrders(tenantId: string, filters?: any) {
    return this.prisma.workOrder.findMany({
      where: {
        tenantId,
        ...filters,
      },
      include: {
        asset: true,
        assignee: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getWorkOrder(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        asset: true,
        assignee: true,
      },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  async updateWorkOrder(id: string, data: any) {
    return this.prisma.workOrder.update({
      where: { id },
      data,
      include: {
        asset: true,
        assignee: true,
      },
    });
  }

  // 分配工单
  async assignWorkOrder(id: string, assigneeId: string) {
    return this.updateWorkOrder(id, {
      assigneeId,
      status: 'assigned',
    });
  }

  // 开始工单
  async startWorkOrder(id: string) {
    return this.updateWorkOrder(id, {
      status: 'in_progress',
      startedAt: new Date(),
    });
  }

  // 完成工单
  async completeWorkOrder(id: string, workResult: string, workHours?: number, usedParts?: any[]) {
    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        workResult,
        workHours,
        usedParts: usedParts ? JSON.stringify(usedParts) : undefined,
      },
      include: { asset: true },
    });

    // 更新资产的维保时间
    await this.prisma.asset.update({
      where: { id: workOrder.assetId },
      data: {
        lastMaintenance: new Date(),
      },
    });

    return workOrder;
  }

  // ========== 巡检计划管理 ==========

  async createInspectionPlan(data: any, tenantId: string) {
    return this.prisma.inspectionPlan.create({
      data: {
        ...data,
        tenantId,
        checkItems: JSON.stringify(data.checkItems),
      },
      include: {
        asset: true,
        inspector: true,
      },
    });
  }

  async getInspectionPlans(tenantId: string, status?: string) {
    return this.prisma.inspectionPlan.findMany({
      where: {
        tenantId,
        ...(status && { status }),
      },
      include: {
        asset: true,
        inspector: true,
      },
      orderBy: { nextInspection: 'asc' },
    });
  }

  async getInspectionPlan(id: string) {
    const plan = await this.prisma.inspectionPlan.findUnique({
      where: { id },
      include: {
        asset: true,
        inspector: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Inspection plan not found');
    }

    return {
      ...plan,
      checkItems: JSON.parse(plan.checkItems),
    };
  }

  async updateInspectionPlan(id: string, data: any) {
    return this.prisma.inspectionPlan.update({
      where: { id },
      data: {
        ...data,
        ...(data.checkItems && { checkItems: JSON.stringify(data.checkItems) }),
      },
    });
  }

  // 获取即将到期的巡检计划
  async getUpcomingInspections(tenantId: string) {
    const now = new Date();
    const alertDate = new Date();
    alertDate.setDate(now.getDate() + 3); // 3天内需要巡检

    return this.prisma.inspectionPlan.findMany({
      where: {
        tenantId,
        status: 'active',
        nextInspection: {
          lte: alertDate,
        },
      },
      include: {
        asset: true,
        inspector: true,
      },
      orderBy: { nextInspection: 'asc' },
    });
  }

  // ========== 备件库存管理 ==========

  async createInventoryItem(data: any, tenantId: string) {
    return this.prisma.inventoryItem.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  async getInventoryItems(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId },
      include: {
        asset: true,
      },
      orderBy: { partName: 'asc' },
    });
  }

  async getInventoryItem(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        asset: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return item;
  }

  async updateInventoryItem(id: string, data: any) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }

  // 库存预警
  async getInventoryAlerts(tenantId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        status: 'active',
        quantity: {
          lte: this.prisma.inventoryItem.fields.minQuantity,
        },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  // 出库
  async consumeInventory(id: string, quantity: number) {
    const item = await this.getInventoryItem(id);
    
    if (item.quantity < quantity) {
      throw new Error('Insufficient inventory');
    }

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: item.quantity - quantity,
      },
    });
  }

  // 入库
  async replenishInventory(id: string, quantity: number) {
    const item = await this.getInventoryItem(id);

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        quantity: item.quantity + quantity,
      },
    });
  }
}
