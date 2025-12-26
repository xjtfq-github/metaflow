import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EamService } from './eam.service';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';

@Controller('eam')
@UseGuards(PermissionGuard)
export class EamController {
  constructor(private eamService: EamService) {}

  // ========== 资产管理 ==========

  @Post('assets')
  @RequirePermission('Asset', 'create')
  async createAsset(@Body() body: { data: any; tenantId: string }) {
    return this.eamService.createAsset(body.data, body.tenantId);
  }

  @Get('assets')
  @RequirePermission('Asset', 'read')
  async getAssets(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string
  ) {
    return this.eamService.getAssets(tenantId, status);
  }

  @Get('assets/:id')
  @RequirePermission('Asset', 'read')
  async getAsset(@Param('id') id: string) {
    return this.eamService.getAsset(id);
  }

  @Put('assets/:id')
  @RequirePermission('Asset', 'update')
  async updateAsset(@Param('id') id: string, @Body() data: any) {
    return this.eamService.updateAsset(id, data);
  }

  @Get('assets/alerts/maintenance')
  @RequirePermission('Asset', 'read')
  async getMaintenanceAlerts(@Query('tenantId') tenantId: string) {
    return this.eamService.getMaintenanceAlerts(tenantId);
  }

  // ========== 工单管理 ==========

  @Post('work-orders')
  @RequirePermission('WorkOrder', 'create')
  async createWorkOrder(@Body() body: { data: any; tenantId: string }) {
    return this.eamService.createWorkOrder(body.data, body.tenantId);
  }

  @Get('work-orders')
  @RequirePermission('WorkOrder', 'read')
  async getWorkOrders(
    @Query('tenantId') tenantId: string,
    @Query() filters?: any
  ) {
    return this.eamService.getWorkOrders(tenantId, filters);
  }

  @Get('work-orders/:id')
  @RequirePermission('WorkOrder', 'read')
  async getWorkOrder(@Param('id') id: string) {
    return this.eamService.getWorkOrder(id);
  }

  @Put('work-orders/:id')
  @RequirePermission('WorkOrder', 'update')
  async updateWorkOrder(@Param('id') id: string, @Body() data: any) {
    return this.eamService.updateWorkOrder(id, data);
  }

  @Post('work-orders/:id/assign')
  @RequirePermission('WorkOrder', 'update')
  async assignWorkOrder(
    @Param('id') id: string,
    @Body() body: { assigneeId: string }
  ) {
    return this.eamService.assignWorkOrder(id, body.assigneeId);
  }

  @Post('work-orders/:id/start')
  @RequirePermission('WorkOrder', 'update')
  async startWorkOrder(@Param('id') id: string) {
    return this.eamService.startWorkOrder(id);
  }

  @Post('work-orders/:id/complete')
  @RequirePermission('WorkOrder', 'update')
  async completeWorkOrder(
    @Param('id') id: string,
    @Body() body: { workResult: string; workHours?: number; usedParts?: any[] }
  ) {
    return this.eamService.completeWorkOrder(
      id,
      body.workResult,
      body.workHours,
      body.usedParts
    );
  }

  // ========== 巡检计划管理 ==========

  @Post('inspection-plans')
  @RequirePermission('InspectionPlan', 'create')
  async createInspectionPlan(@Body() body: { data: any; tenantId: string }) {
    return this.eamService.createInspectionPlan(body.data, body.tenantId);
  }

  @Get('inspection-plans')
  @RequirePermission('InspectionPlan', 'read')
  async getInspectionPlans(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: string
  ) {
    return this.eamService.getInspectionPlans(tenantId, status);
  }

  @Get('inspection-plans/:id')
  @RequirePermission('InspectionPlan', 'read')
  async getInspectionPlan(@Param('id') id: string) {
    return this.eamService.getInspectionPlan(id);
  }

  @Put('inspection-plans/:id')
  @RequirePermission('InspectionPlan', 'update')
  async updateInspectionPlan(@Param('id') id: string, @Body() data: any) {
    return this.eamService.updateInspectionPlan(id, data);
  }

  @Get('inspection-plans/alerts/upcoming')
  @RequirePermission('InspectionPlan', 'read')
  async getUpcomingInspections(@Query('tenantId') tenantId: string) {
    return this.eamService.getUpcomingInspections(tenantId);
  }

  // ========== 备件库存管理 ==========

  @Post('inventory')
  @RequirePermission('InventoryItem', 'create')
  async createInventoryItem(@Body() body: { data: any; tenantId: string }) {
    return this.eamService.createInventoryItem(body.data, body.tenantId);
  }

  @Get('inventory')
  @RequirePermission('InventoryItem', 'read')
  async getInventoryItems(@Query('tenantId') tenantId: string) {
    return this.eamService.getInventoryItems(tenantId);
  }

  @Get('inventory/:id')
  @RequirePermission('InventoryItem', 'read')
  async getInventoryItem(@Param('id') id: string) {
    return this.eamService.getInventoryItem(id);
  }

  @Put('inventory/:id')
  @RequirePermission('InventoryItem', 'update')
  async updateInventoryItem(@Param('id') id: string, @Body() data: any) {
    return this.eamService.updateInventoryItem(id, data);
  }

  @Get('inventory/alerts/low-stock')
  @RequirePermission('InventoryItem', 'read')
  async getInventoryAlerts(@Query('tenantId') tenantId: string) {
    return this.eamService.getInventoryAlerts(tenantId);
  }

  @Post('inventory/:id/consume')
  @RequirePermission('InventoryItem', 'update')
  async consumeInventory(
    @Param('id') id: string,
    @Body() body: { quantity: number }
  ) {
    return this.eamService.consumeInventory(id, body.quantity);
  }

  @Post('inventory/:id/replenish')
  @RequirePermission('InventoryItem', 'update')
  async replenishInventory(
    @Param('id') id: string,
    @Body() body: { quantity: number }
  ) {
    return this.eamService.replenishInventory(id, body.quantity);
  }
}
