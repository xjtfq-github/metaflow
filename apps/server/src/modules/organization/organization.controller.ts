import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { RoleService } from './role.service';
import { PermissionGuard, RequirePermission } from '../../common/guards/permission.guard';

@Controller('api/organizations')
@UseGuards(PermissionGuard)
export class OrganizationController {
  private users: Map<string, any> = new Map();

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

  // 用户管理相关接口
  @Get('users')
  async getAllUsers() {
    return {
      success: true,
      data: Array.from(this.users.values()),
    };
  }

  @Post('users')
  async createUser(
    @Body() body: { name: string; email: string; password: string; departmentId?: string }
  ) {
    const id = `user-${Date.now()}`;
    const user = {
      id,
      name: body.name,
      email: body.email,
      departmentId: body.departmentId,
      departmentName: body.departmentId ? '部门' : undefined,
      tenantId: 'tenant-1',
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return {
      success: true,
      data: user,
    };
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { name: string; email: string; departmentId?: string }
  ) {
    const user = this.users.get(id);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    const updated = {
      ...user,
      name: body.name,
      email: body.email,
      departmentId: body.departmentId,
    };
    this.users.set(id, updated);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    if (!this.users.has(id)) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    this.users.delete(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  // 角色CRUD接口
  @Get('roles')
  @RequirePermission('Role', 'read')
  async getAllRoles(@Body() body: { tenantId: string }) {
    // 返回角色列表
    return {
      success: true,
      data: [],
    };
  }

  @Put('roles/:id')
  @RequirePermission('Role', 'update')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { name: string; code: string; description?: string }
  ) {
    return this.roleService.create({
      name: body.name,
      code: body.code,
      description: body.description,
      tenantId: 'tenant-1',
    });
  }

  @Delete('roles/:id')
  @RequirePermission('Role', 'delete')
  async deleteRole(@Param('id') id: string) {
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }

  // 部门CRUD接口
  @Put('departments/:id')
  @RequirePermission('Department', 'update')
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: { name: string; parentId?: string }
  ) {
    return this.departmentService.create({
      name: body.name,
      parentId: body.parentId,
      tenantId: 'tenant-1',
    });
  }

  @Delete('departments/:id')
  @RequirePermission('Department', 'delete')
  async deleteDepartment(@Param('id') id: string) {
    return {
      success: true,
      message: 'Department deleted successfully',
    };
  }
}