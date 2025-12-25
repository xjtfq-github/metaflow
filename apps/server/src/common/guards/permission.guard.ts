import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../../modules/organization/role.service';
import { PolicyService } from '../../modules/organization/policy.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
    private policyService: PolicyService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器中的权限要求
    const requiredPermission = this.reflector.get<{
      resource: string;
      action: string;
    }>('permission', context.getHandler());

    if (!requiredPermission) {
      return true;  // 没有权限要求
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 获取用户的所有策略
    const policies = await this.roleService.getUserPolicies(user.id);

    // 检查权限
    const hasPermission = this.policyService.can(
      policies,
      requiredPermission.resource,
      requiredPermission.action
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `No permission to ${requiredPermission.action} ${requiredPermission.resource}`
      );
    }

    // 将数据权限 Where 条件附加到 request 上
    const whereCondition = this.policyService.mergePolicyWhere(
      policies,
      requiredPermission.resource,
      requiredPermission.action,
      { user }
    );

    request.policyWhere = whereCondition;

    return true;
  }
}

// 装饰器
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata('permission', { resource, action });