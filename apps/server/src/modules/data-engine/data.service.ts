import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@metaflow/database';
import { getTenantId } from '../../common/tenant-context';
import { CacheService } from '../../common/cache.service';

type PrismaDelegate = {
  findMany(args?: unknown): Promise<unknown>;
  findFirst(args: unknown): Promise<unknown>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
};

@Injectable()
export class DataService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService: CacheService,
  ) {}

  findMany(modelName: string, query: unknown) {
    const tenantId = getTenantId() ?? 'tenant-1';
    const delegate = this.getDelegate(modelName);
    const args = this.injectTenantWhere(modelName, tenantId, query);
    return delegate.findMany(args);
  }

  async findUnique(modelName: string, id: string) {
    const tenantId = getTenantId() ?? 'tenant-1';
    const delegate = this.getDelegate(modelName);
    if (modelName === 'tenant' || modelName === 'Tenant') {
      return delegate.findUnique({ where: { id } });
    }
    return delegate.findFirst({ where: { id, tenantId } });
  }

  create(modelName: string, data: unknown) {
    const tenantId = getTenantId() ?? 'tenant-1';
    const delegate = this.getDelegate(modelName);
    const nextData =
      modelName === 'tenant' || modelName === 'Tenant'
        ? data
        : this.injectTenantData(tenantId, data);
    return delegate.create({ data: nextData });
  }

  async update(modelName: string, id: string, data: unknown) {
    const tenantId = getTenantId() ?? 'tenant-1';
    const delegate = this.getDelegate(modelName);
    if (modelName === 'tenant' || modelName === 'Tenant') {
      return delegate.update({
        where: { id },
        data,
      });
    }
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException(`Model ${modelName} record not found`);
    }
    return delegate.update({ where: { id }, data });
  }

  async delete(modelName: string, id: string) {
    const tenantId = getTenantId() ?? 'tenant-1';
    const delegate = this.getDelegate(modelName);
    if (modelName === 'tenant' || modelName === 'Tenant') {
      return delegate.delete({ where: { id } });
    }
    const existing = await delegate.findFirst({ where: { id, tenantId } });
    if (!existing) {
      throw new NotFoundException(`Model ${modelName} record not found`);
    }
    return delegate.delete({ where: { id } });
  }

  private getDelegate(modelName: string): PrismaDelegate {
    // 尝试从缓存获取
    const cacheKey = CacheService.generateKey('delegate', modelName);
    const cached = this.cacheService.get<PrismaDelegate>(cacheKey);
    if (cached) {
      return cached;
    }

    // Capitalize first letter to match Prisma model naming convention if needed
    // or assume modelName passed is correct.
    // e.g. "user" -> "user" or "User" depending on Prisma generation
    const delegate = (this.prisma as unknown as Record<string, unknown>)[
      modelName
    ];
    if (!delegate) {
      throw new NotFoundException(`Model ${modelName} not found`);
    }
    if (!this.isDelegate(delegate)) {
      throw new NotFoundException(`Model ${modelName} delegate not found`);
    }

    // 缓存代理对象 (元数据不会频繁变化)
    this.cacheService.set(cacheKey, delegate, { ttl: 1000 * 60 * 10 }); // 10 分钟

    return delegate;
  }

  private isDelegate(value: unknown): value is PrismaDelegate {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.findMany === 'function' &&
      typeof v.findFirst === 'function' &&
      typeof v.findUnique === 'function' &&
      typeof v.create === 'function' &&
      typeof v.update === 'function' &&
      typeof v.delete === 'function'
    );
  }

  private injectTenantWhere(
    modelName: string,
    tenantId: string,
    args: unknown,
  ): unknown {
    if (modelName === 'tenant' || modelName === 'Tenant') return args;
    if (!args || typeof args !== 'object') return { where: { tenantId } };
    const a = args as Record<string, unknown>;
    const where = (a.where ?? {}) as Record<string, unknown>;
    return {
      ...a,
      where: {
        ...where,
        tenantId,
      },
    };
  }

  private injectTenantData(tenantId: string, data: unknown): unknown {
    if (!data || typeof data !== 'object') return { tenantId };
    const d = data as Record<string, unknown>;
    return {
      ...d,
      tenantId,
    };
  }
}
