/**
 * AppManager 集成测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '@metaflow/database';
import { createFixtures } from '../../fixtures';

describe('AppManager (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixtures: ReturnType<typeof createFixtures>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    fixtures = createFixtures(prisma);
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await app.close();
  });

  describe('POST /apps', () => {
    it('应该创建新应用', async () => {
      const tenant = await fixtures.createTenant();

      const response = await request(app.getHttpServer())
        .post('/apps')
        .set('x-tenant-id', tenant.id)
        .send({
          name: 'Test Application',
          description: 'Test description',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Application',
        description: 'Test description',
        tenantId: tenant.id,
      });
    });

    it('应该拒绝缺少租户ID的请求', async () => {
      await request(app.getHttpServer())
        .post('/apps')
        .send({
          name: 'Test App',
        })
        .expect(400);
    });
  });

  describe('GET /apps', () => {
    it('应该返回当前租户的应用列表', async () => {
      const tenant = await fixtures.createTenant();
      await fixtures.createApp(tenant.id, { name: 'App 1' });
      await fixtures.createApp(tenant.id, { name: 'App 2' });

      const response = await request(app.getHttpServer())
        .get('/apps')
        .set('x-tenant-id', tenant.id)
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('tenantId', tenant.id);
    });

    it('应该只返回当前租户的应用', async () => {
      const tenant1 = await fixtures.createTenant({ id: 'tenant-1' });
      const tenant2 = await fixtures.createTenant({ id: 'tenant-2' });

      await fixtures.createApp(tenant1.id, { name: 'Tenant1 App' });
      await fixtures.createApp(tenant2.id, { name: 'Tenant2 App' });

      const response = await request(app.getHttpServer())
        .get('/apps')
        .set('x-tenant-id', tenant1.id)
        .expect(200);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toBe('Tenant1 App');
    });
  });

  describe('GET /apps/:id', () => {
    it('应该返回指定应用的详情', async () => {
      const { tenant, app: testApp } = await fixtures.setupFullEnvironment();

      const response = await request(app.getHttpServer())
        .get(`/apps/${testApp.id}`)
        .set('x-tenant-id', tenant.id)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testApp.id,
        name: testApp.name,
      });
    });

    it('应该返回404当应用不存在', async () => {
      const tenant = await fixtures.createTenant();

      await request(app.getHttpServer())
        .get('/apps/non-existent-id')
        .set('x-tenant-id', tenant.id)
        .expect(404);
    });
  });

  describe('PUT /apps/:id', () => {
    it('应该更新应用信息', async () => {
      const { tenant, app: testApp } = await fixtures.setupFullEnvironment();

      const response = await request(app.getHttpServer())
        .put(`/apps/${testApp.id}`)
        .set('x-tenant-id', tenant.id)
        .send({
          name: 'Updated App Name',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: testApp.id,
        name: 'Updated App Name',
        description: 'Updated description',
      });
    });
  });

  describe('DELETE /apps/:id', () => {
    it('应该删除应用', async () => {
      const { tenant, app: testApp } = await fixtures.setupFullEnvironment();

      await request(app.getHttpServer())
        .delete(`/apps/${testApp.id}`)
        .set('x-tenant-id', tenant.id)
        .expect(200);

      // 验证应用已删除
      await request(app.getHttpServer())
        .get(`/apps/${testApp.id}`)
        .set('x-tenant-id', tenant.id)
        .expect(404);
    });
  });
});
