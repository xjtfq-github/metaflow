import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建角色
   */
  async create(data: { name: string; code: string; description?: string; tenantId: string }) {
    return this.prisma.role.create({
      data,
    });
  }

  /**
   * 为角色分配权限策略
   */
  async assignPolicy(
    roleId: string,
    policy: {
      effect: 'ALLOW' | 'DENY';
      resource: string;
      actions: string; // 逗号分隔的权限字符串
      condition?: string; // JSON字符串格式的条件
    }
  ) {
    return this.prisma.policy.create({
      data: {
        roleId,
        effect: policy.effect,
        resource: policy.resource,
        actions: policy.actions,
        condition: policy.condition || '{}',
      },
    });
  }

  /**
   * 为用户分配角色
   */
  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  }

  /**
   * 获取用户的所有角色和策略
   */
  async getUserPolicies(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            policies: true,
          },
        },
      },
    });

    const policies = userRoles.flatMap((ur: any) => ur.role.policies);
    return policies;
  }
}