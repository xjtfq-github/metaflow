import { Injectable, ConflictException } from '@nestjs/common';
import { CreateAppDto } from './dto/create-app.dto';
import { AppResponseDto } from './dto/app-response.dto';
import { PrismaClient } from '@metaflow/database';
import { getTenantId } from '../../common/tenant-context';

@Injectable()
export class AppManagerService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(createAppDto: CreateAppDto): Promise<AppResponseDto> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const existing = await this.prisma.app.findFirst({
      where: { name: createAppDto.name, tenantId },
    });
    if (existing) {
      throw new ConflictException(
        `App with name "${createAppDto.name}" already exists`,
      );
    }

    const app = await this.prisma.app.create({
      data: {
        name: createAppDto.name,
        description: createAppDto.description,
        icon: createAppDto.icon,
        status: 'draft',
        tenantId,
      },
    });

    return {
      id: app.id,
      name: app.name,
      description: app.description ?? undefined,
      icon: app.icon ?? undefined,
      status: app.status,
      tenantId: app.tenantId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  async findAll(): Promise<AppResponseDto[]> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const apps = await this.prisma.app.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map((app) => ({
      id: app.id,
      name: app.name,
      description: app.description ?? undefined,
      icon: app.icon ?? undefined,
      status: app.status,
      tenantId: app.tenantId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));
  }

  async findOne(id: string): Promise<AppResponseDto | undefined> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const app = await this.prisma.app.findFirst({
      where: { id, tenantId },
    });
    if (!app) return undefined;

    return {
      id: app.id,
      name: app.name,
      description: app.description ?? undefined,
      icon: app.icon ?? undefined,
      status: app.status,
      tenantId: app.tenantId,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  private async ensureTenant(tenantId: string): Promise<void> {
    const existing = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (existing) return;

    await this.prisma.tenant.create({
      data: {
        id: tenantId,
        code: tenantId,
        name: 'Default Tenant',
      },
    });
  }

  async publish(id: string): Promise<AppResponseDto> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const app = await this.prisma.app.findFirst({
      where: { id, tenantId },
    });
    if (!app) {
      throw new ConflictException(`App with id "${id}" not found`);
    }

    const updated = await this.prisma.app.update({
      where: { id },
      data: { status: 'published' },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      icon: updated.icon ?? undefined,
      status: updated.status,
      tenantId: updated.tenantId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async update(id: string, updateAppDto: CreateAppDto): Promise<AppResponseDto> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const app = await this.prisma.app.findFirst({
      where: { id, tenantId },
    });
    if (!app) {
      throw new ConflictException(`App with id "${id}" not found`);
    }

    const updated = await this.prisma.app.update({
      where: { id },
      data: {
        name: updateAppDto.name,
        description: updateAppDto.description,
        icon: updateAppDto.icon,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description ?? undefined,
      icon: updated.icon ?? undefined,
      status: updated.status,
      tenantId: updated.tenantId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const tenantId = getTenantId() ?? 'tenant-1';
    await this.ensureTenant(tenantId);

    const app = await this.prisma.app.findFirst({
      where: { id, tenantId },
    });
    if (!app) {
      throw new ConflictException(`App with id "${id}" not found`);
    }

    await this.prisma.app.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'App deleted successfully',
    };
  }
}
