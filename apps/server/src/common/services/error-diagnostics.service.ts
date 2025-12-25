/**
 * AI 错误诊断服务
 * 
 * 功能:
 * 1. 收集错误堆栈信息
 * 2. AI 分析错误原因
 * 3. 生成修复建议
 */

import { Injectable } from '@nestjs/common';
import { getContext } from '../als.context';

export interface ErrorDiagnostics {
  errorCode: string;
  errorMessage: string;
  stack?: string;
  context?: {
    traceId?: string;
    tenantId?: string;
    userId?: string;
    timestamp: number;
  };
  analysis?: {
    possibleCauses: string[];
    suggestedFixes: string[];
    relatedDocs: string[];
  };
}

@Injectable()
export class ErrorDiagnosticsService {
  /**
   * 收集错误信息
   */
  async collectErrorInfo(error: Error | any): Promise<ErrorDiagnostics> {
    const context = getContext();
    
    const diagnostics: ErrorDiagnostics = {
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message || String(error),
      stack: error.stack,
      context: context
        ? {
            traceId: context.traceId,
            tenantId: context.tenantId,
            userId: context.userId,
            timestamp: context.timestamp,
          }
        : { timestamp: Date.now() },
    };

    return diagnostics;
  }

  /**
   * AI 分析错误 (MVP 版本: 规则引擎)
   */
  async analyzeError(diagnostics: ErrorDiagnostics): Promise<ErrorDiagnostics> {
    // TODO: 集成真实 AI 服务 (OpenAI, Claude 等)
    // 目前使用简单的规则引擎

    const analysis = this.ruleBasedAnalysis(diagnostics);
    
    return {
      ...diagnostics,
      analysis,
    };
  }

  /**
   * 基于规则的错误分析
   */
  private ruleBasedAnalysis(diagnostics: ErrorDiagnostics) {
    const { errorCode, errorMessage, stack } = diagnostics;
    const possibleCauses: string[] = [];
    const suggestedFixes: string[] = [];
    const relatedDocs: string[] = [];

    // 401 错误分析
    if (errorCode.includes('401')) {
      possibleCauses.push('Token 已过期或无效');
      possibleCauses.push('未在请求头中携带 Token');
      suggestedFixes.push('检查 Token 是否已过期');
      suggestedFixes.push('确认请求头 Authorization 是否正确设置');
      relatedDocs.push('/docs/auth#token-refresh');
    }

    // 403 错误分析
    if (errorCode.includes('403')) {
      possibleCauses.push('当前用户没有对应权限');
      possibleCauses.push('资源属于其他租户');
      suggestedFixes.push('检查用户角色和权限配置');
      suggestedFixes.push('确认 TenantID 是否正确');
      relatedDocs.push('/docs/rbac#permissions');
    }

    // 404 错误分析
    if (errorCode.includes('404')) {
      possibleCauses.push('记录不存在或已被删除');
      possibleCauses.push('ID 参数错误');
      suggestedFixes.push('检查查询条件是否正确');
      suggestedFixes.push('确认记录是否已被软删除');
      relatedDocs.push('/docs/data-engine#soft-delete');
    }

    // 数据库错误分析
    if (stack?.includes('PrismaClientKnownRequestError')) {
      possibleCauses.push('数据库查询失败');
      if (stack.includes('Unique constraint failed')) {
        possibleCauses.push('唯一性约束冲突');
        suggestedFixes.push('检查是否存在重复数据');
      }
      if (stack.includes('Foreign key constraint failed')) {
        possibleCauses.push('外键约束冲突');
        suggestedFixes.push('检查关联数据是否存在');
      }
      relatedDocs.push('/docs/database#constraints');
    }

    // 类型错误分析
    if (errorMessage.includes('Cannot read property')) {
      possibleCauses.push('访问了 null 或 undefined 的属性');
      suggestedFixes.push('添加空值检查: if (obj?.property)');
      suggestedFixes.push('使用可选链操作符: obj?.property');
    }

    // 默认建议
    if (possibleCauses.length === 0) {
      possibleCauses.push('未知错误，需进一步调试');
      suggestedFixes.push('查看完整堆栈信息');
      suggestedFixes.push('启用调试模式获取更多信息');
    }

    return {
      possibleCauses,
      suggestedFixes,
      relatedDocs,
    };
  }

  /**
   * 生成诊断报告
   */
  async generateReport(error: Error | any): Promise<ErrorDiagnostics> {
    const diagnostics = await this.collectErrorInfo(error);
    return await this.analyzeError(diagnostics);
  }
}
