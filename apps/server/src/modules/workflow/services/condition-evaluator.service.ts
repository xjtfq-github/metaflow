import { Injectable, Logger } from '@nestjs/common';

/**
 * 条件求值器服务
 * 用于评估工作流中的条件表达式
 */
@Injectable()
export class ConditionEvaluatorService {
  private readonly logger = new Logger(ConditionEvaluatorService.name);

  /**
   * 评估条件表达式
   * 支持模板语法: {{ level === '一级动火' }}
   * @param condition 条件表达式
   * @param variables 流程变量
   * @returns 评估结果
   */
  evaluate(condition: string, variables: Record<string, any>): boolean {
    try {
      if (!condition || condition.trim() === '') {
        return true; // 空条件默认通过
      }

      // 移除模板标记
      let expression = condition.trim();
      if (expression.startsWith('{{') && expression.endsWith('}}')) {
        expression = expression.substring(2, expression.length - 2).trim();
      }

      // 创建安全的求值上下文
      const context = this.createSafeContext(variables);

      // 安全求值
      const result = this.evaluateExpression(expression, context);

      this.logger.debug(`条件求值: ${condition} => ${result}`);

      return Boolean(result);
    } catch (error) {
      this.logger.error(`条件求值失败: ${condition}`, error);
      return false;
    }
  }

  /**
   * 创建安全的求值上下文
   * 防止访问不安全的对象和原型链
   */
  private createSafeContext(variables: Record<string, any>): any {
    // 创建一个沙箱环境
    return new Proxy(variables, {
      get(target, prop) {
        // 禁止访问原型链
        if (
          prop === '__proto__' ||
          prop === 'constructor' ||
          prop === 'prototype'
        ) {
          return undefined;
        }
        return target[prop as string];
      },
      has(target, prop) {
        if (
          prop === '__proto__' ||
          prop === 'constructor' ||
          prop === 'prototype'
        ) {
          return false;
        }
        return prop in target;
      },
    });
  }

  /**
   * 安全求值表达式
   * 使用 Function 构造函数创建沙箱
   * 注意：生产环境建议使用 vm2 或 isolated-vm
   */
  private evaluateExpression(expression: string, context: any): any {
    // 预定义的安全操作符和函数
    const safeOperators = {
      '===': (a: any, b: any) => a === b,
      '!==': (a: any, b: any) => a !== b,
      '==': (a: any, b: any) => a == b,
      '!=': (a: any, b: any) => a != b,
      '>': (a: any, b: any) => a > b,
      '<': (a: any, b: any) => a < b,
      '>=': (a: any, b: any) => a >= b,
      '<=': (a: any, b: any) => a <= b,
      '&&': (a: any, b: any) => a && b,
      '||': (a: any, b: any) => a || b,
      '!': (a: any) => !a,
    };

    // 简单的表达式解析和求值
    // 支持常见的比较和逻辑运算符
    try {
      // 使用 with 语句将上下文变量注入
      const func = new Function(
        'context',
        `
        'use strict';
        with (context) {
          return (${expression});
        }
      `,
      );

      return func(context);
    } catch (error) {
      this.logger.error(`表达式求值错误: ${expression}`, error);
      throw error;
    }
  }

  /**
   * 验证条件表达式语法
   * @param condition 条件表达式
   * @returns 是否合法
   */
  validateCondition(condition: string): boolean {
    try {
      if (!condition || condition.trim() === '') {
        return true;
      }

      // 移除模板标记
      let expression = condition.trim();
      if (expression.startsWith('{{') && expression.endsWith('}}')) {
        expression = expression.substring(2, expression.length - 2).trim();
      }

      // 尝试解析表达式
      new Function(`return (${expression})`);

      return true;
    } catch (error) {
      this.logger.warn(`条件表达式语法错误: ${condition}`, error);
      return false;
    }
  }

  /**
   * 解析模板字符串
   * 支持 {{variable}} 语法
   */
  parseTemplate(template: string, variables: Record<string, any>): string {
    if (!template) {
      return '';
    }

    return template.replace(/\{\{(.+?)\}\}/g, (match, expression) => {
      try {
        const trimmed = expression.trim();
        const context = this.createSafeContext(variables);

        // 如果是简单的变量引用
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
          return String(context[trimmed] ?? '');
        }

        // 复杂表达式
        const result = this.evaluateExpression(trimmed, context);
        return String(result ?? '');
      } catch (error) {
        this.logger.error(`模板解析失败: ${expression}`, error);
        return match; // 解析失败保留原样
      }
    });
  }
}
