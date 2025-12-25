/**
 * 动作执行器
 * 
 * 负责流水线调度与动作执行
 */

import type { Action, Pipeline, ExecutionContext, ExecutionResult } from '@metaflow/shared-types';
import { interpolateObject } from './interpolate';
import { actionRegistry } from './actions';

export class ActionExecutor {
  /**
   * 执行流水线
   */
  async executePipeline(
    pipeline: Pipeline,
    initialContext: Partial<ExecutionContext> = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // 创建执行上下文
    const context: ExecutionContext = {
      global: initialContext.global || {},
      form: initialContext.form || {},
      component: initialContext.component,
      outputs: {},
      vars: {},
    };

    try {
      // 串行执行动作
      for (const action of pipeline.actions) {
        // 检查条件
        if (action.condition && !this.evaluateCondition(action.condition, context)) {
          continue;
        }

        // 执行动作
        const result = await this.executeAction(action, context);
        
        // 存储输出
        context.outputs[action.id] = result;

        // 错误处理
        if (!result.success) {
          if (action.onError === 'stop') {
            throw new Error(result.error);
          } else if (action.onError === 'skip') {
            continue;
          }
          // continue: 继续执行
        }
      }

      return {
        success: true,
        data: context.outputs,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 执行单个动作
   */
  private async executeAction(
    action: Action,
    context: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // 获取动作执行器
      const handler = actionRegistry.get(action.type);
      if (!handler) {
        throw new Error(`Unknown action type: ${action.type}`);
      }

      // 插值处理参数
      const params = interpolateObject(action.params, context);

      // 执行动作
      const data = await handler(params, context);

      return {
        success: true,
        data,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    try {
      // 简单实现: 支持基本比较
      // 生产环境建议使用更安全的表达式引擎
      const func = new Function(...Object.keys(context), `return ${condition}`);
      return !!func(...Object.values(context));
    } catch {
      return false;
    }
  }
}
