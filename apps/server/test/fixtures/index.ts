/**
 * 测试数据工厂
 * 
 * 功能:
 * 1. 生成标准测试数据
 * 2. 避免重复造数据
 * 3. 支持关联数据生成
 */

import { PrismaClient } from '@metaflow/database';

export class TestFixtures {
  constructor(private prisma: PrismaClient) {}

  /**
   * 标准租户
   */
  async createTenant(data?: Partial<any>) {
    return this.prisma.tenant.create({
      data: {
        id: data?.id || 'test-tenant-001',
        name: data?.name || 'Test Company',
        domain: data?.domain || 'test.example.com',
        config: data?.config || {},
        status: data?.status || 'active',
      },
    });
  }

  /**
   * 标准用户
   */
  async createUser(tenantId: string, data?: Partial<any>) {
    return this.prisma.user.create({
      data: {
        id: data?.id || `user-${Date.now()}`,
        tenantId,
        email: data?.email || `test-${Date.now()}@example.com`,
        name: data?.name || 'Test User',
        role: data?.role || 'admin',
        status: data?.status || 'active',
      },
    });
  }

  /**
   * 标准应用
   */
  async createApp(tenantId: string, data?: Partial<any>) {
    return this.prisma.app.create({
      data: {
        id: data?.id || `app-${Date.now()}`,
        tenantId,
        name: data?.name || 'Test App',
        description: data?.description || 'Test application',
        config: data?.config || {},
        status: data?.status || 'active',
      },
    });
  }

  /**
   * Model DSL
   */
  async createModel(appId: string, data?: Partial<any>) {
    const defaultDSL = {
      type: 'model' as const,
      version: '1.0',
      id: data?.id || `model-${Date.now()}`,
      name: data?.name || 'TestModel',
      fields: data?.fields || [
        {
          name: 'id',
          type: 'string',
          required: true,
          isPrimary: true,
        },
        {
          name: 'name',
          type: 'string',
          required: true,
        },
        {
          name: 'status',
          type: 'string',
          enum: ['active', 'inactive'],
        },
      ],
      indexes: [],
      relations: [],
    };

    return this.prisma.modelDSL.create({
      data: {
        id: defaultDSL.id,
        appId,
        name: defaultDSL.name,
        dsl: defaultDSL,
        version: 1,
        status: 'active',
      },
    });
  }

  /**
   * Page DSL
   */
  async createPage(appId: string, data?: Partial<any>) {
    const defaultDSL = {
      type: 'page' as const,
      version: '1.0',
      id: data?.id || `page-${Date.now()}`,
      name: data?.name || 'TestPage',
      title: data?.title || 'Test Page',
      layout: {
        type: 'grid',
        columns: 2,
      },
      components: data?.components || [
        {
          id: 'comp-1',
          type: 'Input',
          props: {
            name: 'name',
            label: 'Name',
          },
        },
      ],
    };

    return this.prisma.pageDSL.create({
      data: {
        id: defaultDSL.id,
        appId,
        name: defaultDSL.name,
        dsl: defaultDSL,
        version: 1,
        status: 'active',
      },
    });
  }

  /**
   * 动态数据记录
   */
  async createRecord(modelId: string, data: Record<string, any>) {
    return this.prisma.dataRecord.create({
      data: {
        id: data.id || `record-${Date.now()}`,
        modelId,
        data,
        version: 1,
      },
    });
  }

  /**
   * 批量创建记录
   */
  async createRecords(modelId: string, records: Record<string, any>[]) {
    return Promise.all(
      records.map((data) => this.createRecord(modelId, data))
    );
  }

  /**
   * 清理所有测试数据
   */
  async cleanup() {
    await this.prisma.dataRecord.deleteMany({});
    await this.prisma.pageDSL.deleteMany({});
    await this.prisma.modelDSL.deleteMany({});
    await this.prisma.app.deleteMany({});
    await this.prisma.user.deleteMany({});
    await this.prisma.tenant.deleteMany({});
  }

  /**
   * 创建完整的测试环境
   */
  async setupFullEnvironment() {
    const tenant = await this.createTenant();
    const user = await this.createUser(tenant.id, { role: 'admin' });
    const app = await this.createApp(tenant.id);
    const model = await this.createModel(app.id);
    const page = await this.createPage(app.id);

    return { tenant, user, app, model, page };
  }
}

/**
 * 辅助函数: 快速生成工厂实例
 */
export function createFixtures(prisma: PrismaClient) {
  return new TestFixtures(prisma);
}
