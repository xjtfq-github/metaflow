/**
 * DataEngine 集成测试
 * 
 * 测试动态 CRUD API
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '@metaflow/database';
import { createFixtures } from '../../fixtures';

describe('DataEngine (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixtures: ReturnType<typeof createFixtures>;
  let testEnv: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    fixtures = createFixtures(prisma);

    // 创建测试环境
    testEnv = await fixtures.setupFullEnvironment();
  });

  afterAll(async () => {
    await fixtures.cleanup();
    await app.close();
  });

  describe('POST /api/data/:modelName', () => {
    it('应该创建新记录', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .send({
          name: 'Test Record',
          status: 'active',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Test Record',
        status: 'active',
      });
      expect(response.body).toHaveProperty('id');
    });

    it('应该拒绝不符合 Schema 的数据', async () => {
      await request(app.getHttpServer())
        .post(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .send({
          status: 'invalid-status', // 不在枚举中
        })
        .expect(400);
    });

    it('应该验证必填字段', async () => {
      await request(app.getHttpServer())
        .post(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .send({
          status: 'active',
          // 缺少 name 字段
        })
        .expect(400);
    });
  });

  describe('GET /api/data/:modelName', () => {
    beforeEach(async () => {
      // 插入测试数据
      await fixtures.createRecords(testEnv.model.id, [
        { id: 'record-1', name: 'Record 1', status: 'active' },
        { id: 'record-2', name: 'Record 2', status: 'inactive' },
        { id: 'record-3', name: 'Record 3', status: 'active' },
      ]);
    });

    it('应该返回所有记录', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('应该支持过滤查询', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .query({ status: 'active' })
        .expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.every((r: any) => r.status === 'active')).toBe(true);
    });

    it('应该支持分页', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}`)
        .set('x-tenant-id', testEnv.tenant.id)
        .query({ page: 1, pageSize: 2 })
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/data/:modelName/:id', () => {
    it('应该返回单条记录', async () => {
      const record = await fixtures.createRecord(testEnv.model.id, {
        id: 'test-record',
        name: 'Test Record',
        status: 'active',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}/test-record`)
        .set('x-tenant-id', testEnv.tenant.id)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'test-record',
        name: 'Test Record',
      });
    });

    it('应该返回404当记录不存在', async () => {
      await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}/non-existent`)
        .set('x-tenant-id', testEnv.tenant.id)
        .expect(404);
    });
  });

  describe('PUT /api/data/:modelName/:id', () => {
    it('应该更新记录', async () => {
      await fixtures.createRecord(testEnv.model.id, {
        id: 'update-test',
        name: 'Original Name',
        status: 'active',
      });

      const response = await request(app.getHttpServer())
        .put(`/api/data/${testEnv.model.name}/update-test`)
        .set('x-tenant-id', testEnv.tenant.id)
        .send({
          name: 'Updated Name',
          status: 'inactive',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 'update-test',
        name: 'Updated Name',
        status: 'inactive',
      });
    });
  });

  describe('DELETE /api/data/:modelName/:id', () => {
    it('应该删除记录', async () => {
      await fixtures.createRecord(testEnv.model.id, {
        id: 'delete-test',
        name: 'To Delete',
        status: 'active',
      });

      await request(app.getHttpServer())
        .delete(`/api/data/${testEnv.model.name}/delete-test`)
        .set('x-tenant-id', testEnv.tenant.id)
        .expect(200);

      // 验证已删除
      await request(app.getHttpServer())
        .get(`/api/data/${testEnv.model.name}/delete-test`)
        .set('x-tenant-id', testEnv.tenant.id)
        .expect(404);
    });
  });
});
