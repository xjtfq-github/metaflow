import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建部门
   */
  async create(data: { name: string; parentId?: string; tenantId: string }) {
    const { name, parentId, tenantId } = data;

    // 获取父部门
    let path = '/';
    let level = 0;

    if (parentId) {
      const parent = await this.prisma.department.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw new Error('Parent department not found');
      }

      path = `${parent.path}${parent.id}/`;
      level = parent.level + 1;
    }

    return this.prisma.department.create({
      data: {
        name,
        parentId,
        path,
        level,
        tenantId,
      },
    });
  }

  /**
   * 查询子部门（包括所有后代）
   */
  async findDescendants(departmentId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: { path: true, id: true }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // 使用 LIKE 查询所有子孙节点
    return this.prisma.department.findMany({
      where: {
        path: {
          startsWith: `${department.path}${department.id}/`,
        },
      },
      orderBy: {
        path: 'asc',
      },
    });
  }

  /**
   * 查询子部门下的所有用户
   */
  async findDescendantUsers(departmentId: string) {
    const descendants = await this.findDescendants(departmentId);
    const departmentIds = [departmentId, ...descendants.map((d) => d.id)];

    return this.prisma.user.findMany({
      where: {
        departmentId: {
          in: departmentIds,
        },
      },
      include: {
        department: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * 移动部门
   */
  async move(departmentId: string, newParentId?: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // 计算新路径
    let newPath = '/';
    let newLevel = 0;

    if (newParentId) {
      const newParent = await this.prisma.department.findUnique({
        where: { id: newParentId },
      });

      if (!newParent) {
        throw new Error('New parent department not found');
      }

      // 检查是否移动到自己的子节点下（禁止）
      if (newParent.path.startsWith(`${department.path}${department.id}/`)) {
        throw new Error('Cannot move department to its own descendant');
      }

      newPath = `${newParent.path}${newParent.id}/`;
      newLevel = newParent.level + 1;
    }

    // 更新当前部门
    await this.prisma.department.update({
      where: { id: departmentId },
      data: {
        parentId: newParentId,
        path: newPath,
        level: newLevel,
      },
    });

    // 更新所有子孙节点的路径
    const descendants = await this.findDescendants(departmentId);
    const oldPathPrefix = `${department.path}${department.id}/`;
    const newPathPrefix = `${newPath}${department.id}/`;

    for (const descendant of descendants) {
      const updatedPath = descendant.path.replace(oldPathPrefix, newPathPrefix);
      const levelDiff = newLevel - department.level;

      await this.prisma.department.update({
        where: { id: descendant.id },
        data: {
          path: updatedPath,
          level: descendant.level + levelDiff,
        },
      });
    }
  }

  /**
   * 获取部门树
   */
  async getTree(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        path: 'asc',
      },
    });

    // 构建树形结构
    const map = new Map<string, any>();
    const roots: any[] = [];

    // 初始化节点
    departments.forEach((dept) => {
      map.set(dept.id, { ...dept, children: [] });
    });

    // 构建父子关系
    departments.forEach((dept) => {
      const node = map.get(dept.id)!;
      if (dept.parentId) {
        const parent = map.get(dept.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * 获取单个部门
   */
  async findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
    });
  }
}