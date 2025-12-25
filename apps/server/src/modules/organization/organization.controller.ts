import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { RoleService } from './role.service';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';

@Controller('organization')
@UseGuards(PermissionGuard)
export class OrganizationController {
  constructor(
    private departmentService: DepartmentService,
    private roleService: RoleService,
  ) {}

  // 部门管理相关接口
  @Post('departments')
  @RequirePermission('Department', 'create')
  async createDepartment(
    @Body() body: { name: string; parentId?: string; tenantId: string }
  ) {
    return this.departmentService.create({
      name: body.name,
      parentId: body.parentId,
      tenantId: body.tenantId,
    });
  }

  @Get('departments')
  @RequirePermission('Department', 'read')
  async getAllDepartments(@Body() body: { tenantId: string }) {
    return this.departmentService.getTree(body.tenantId);
  }

  @Get('departments/:id')
  @RequirePermission('Department', 'read')
  async getDepartment(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Put('departments/:id/move')
  @RequirePermission('Department', 'update')
  async moveDepartment(
    @Param('id') id: string,
    @Body() body: { newParentId?: string }
  ) {
    return this.departmentService.move(id, body.newParentId);
  }

  // 角色管理相关接口
  @Post('roles')
  @RequirePermission('Role', 'create')
  async createRole(
    @Body() body: { name: string; code: string; description?: string; tenantId: string }
  ) {
    return this.roleService.create({
      name: body.name,
      code: body.code,
      description: body.description,
      tenantId: body.tenantId,
    });
  }

  @Post('roles/:roleId/policies')
  @RequirePermission('Policy', 'create')
  async assignPolicy(
    @Param('roleId') roleId: string,
    @Body() body: { effect: 'ALLOW' | 'DENY'; resource: string; actions: string; condition?: string }
  ) {
    return this.roleService.assignPolicy(roleId, {
      effect: body.effect,
      resource: body.resource,
      actions: body.actions,
      condition: body.condition,
    });
  }

  @Post('users/:userId/roles')
  @RequirePermission('UserRole', 'create')
  async assignRoleToUser(
    @Param('userId') userId: string,
    @Body() body: { roleId: string }
  ) {
    return this.roleService.assignRoleToUser(userId, body.roleId);
  }

  @Get('users/:userId/policies')
  @RequirePermission('Policy', 'read')
  async getUserPolicies(@Param('userId') userId: string) {
    return this.roleService.getUserPolicies(userId);
  }
}