/**
 * AI 错误诊断服务测试
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ErrorDiagnosticsService } from '../error-diagnostics.service';

describe('ErrorDiagnosticsService', () => {
  let service: ErrorDiagnosticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorDiagnosticsService],
    }).compile();

    service = module.get<ErrorDiagnosticsService>(ErrorDiagnosticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectErrorInfo', () => {
    it('应该收集错误信息', async () => {
      const error = new Error('Test error');
      error['code'] = 'TEST-001';

      const diagnostics = await service.collectErrorInfo(error);

      expect(diagnostics.errorCode).toBe('TEST-001');
      expect(diagnostics.errorMessage).toBe('Test error');
      expect(diagnostics.stack).toBeDefined();
    });
  });

  describe('analyzeError - 401 错误', () => {
    it('应该分析 401 错误', async () => {
      const diagnostics = await service.analyzeError({
        errorCode: 'AUTH-001-401',
        errorMessage: 'Unauthorized',
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        'Token 已过期或无效',
      );
      expect(diagnostics.analysis?.suggestedFixes).toContain(
        '检查 Token 是否已过期',
      );
    });
  });

  describe('analyzeError - 403 错误', () => {
    it('应该分析 403 错误', async () => {
      const diagnostics = await service.analyzeError({
        errorCode: 'AUTH-001-403',
        errorMessage: 'Forbidden',
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        '当前用户没有对应权限',
      );
      expect(diagnostics.analysis?.suggestedFixes).toContain(
        '检查用户角色和权限配置',
      );
    });
  });

  describe('analyzeError - 404 错误', () => {
    it('应该分析 404 错误', async () => {
      const diagnostics = await service.analyzeError({
        errorCode: 'DATA-002-404',
        errorMessage: 'Record not found',
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        '记录不存在或已被删除',
      );
      expect(diagnostics.analysis?.suggestedFixes).toContain(
        '检查查询条件是否正确',
      );
    });
  });

  describe('analyzeError - 数据库错误', () => {
    it('应该分析唯一性约束冲突', async () => {
      const error = new Error('Unique constraint failed');
      (error as any).stack = 'PrismaClientKnownRequestError: Unique constraint failed';

      const diagnostics = await service.analyzeError({
        errorCode: 'DATA-002-409',
        errorMessage: error.message,
        stack: error.stack,
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        '唯一性约束冲突',
      );
      expect(diagnostics.analysis?.suggestedFixes).toContain(
        '检查是否存在重复数据',
      );
    });

    it('应该分析外键约束冲突', async () => {
      const error = new Error('Foreign key constraint failed');
      (error as any).stack = 'PrismaClientKnownRequestError: Foreign key constraint failed';

      const diagnostics = await service.analyzeError({
        errorCode: 'DATA-002-400',
        errorMessage: error.message,
        stack: error.stack,
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        '外键约束冲突',
      );
    });
  });

  describe('analyzeError - 类型错误', () => {
    it('应该分析空指针错误', async () => {
      const diagnostics = await service.analyzeError({
        errorCode: 'UNKNOWN',
        errorMessage: "Cannot read property 'name' of undefined",
      });

      expect(diagnostics.analysis?.possibleCauses).toContain(
        '访问了 null 或 undefined 的属性',
      );
      expect(diagnostics.analysis?.suggestedFixes).toContain(
        '使用可选链操作符: obj?.property',
      );
    });
  });

  describe('generateReport', () => {
    it('应该生成完整的诊断报告', async () => {
      const error = new Error('Test error');
      error['code'] = 'AUTH-001-401';

      const report = await service.generateReport(error);

      expect(report.errorCode).toBe('AUTH-001-401');
      expect(report.errorMessage).toBe('Test error');
      expect(report.analysis).toBeDefined();
      expect(report.analysis?.possibleCauses.length).toBeGreaterThan(0);
      expect(report.analysis?.suggestedFixes.length).toBeGreaterThan(0);
    });
  });
});
