/**
 * 后端计算字段服务
 * 提供精度控制和虚拟列支持
 */

import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ExpressionEngine } from '@metaflow/shared-types';

/**
 * 计算字段服务
 */
@Injectable()
export class ComputedFieldService {
  private expressionEngine: ExpressionEngine;

  constructor() {
    this.expressionEngine = new ExpressionEngine();
  }

  /**
   * 计算虚拟列（支持精度控制）
   */
  computeVirtualColumns(
    record: Record<string, any>,
    fieldDefinitions: Record<string, string>
  ): Record<string, any> {
    if (!fieldDefinitions || Object.keys(fieldDefinitions).length === 0) {
      return {};
    }

    const results: Record<string, any> = {};

    // 按依赖顺序计算
    for (const [fieldName, expression] of Object.entries(fieldDefinitions)) {
      try {
        const value = this.expressionEngine.evaluate(expression, {
          ...record,
          ...results,
        });
        results[fieldName] = value;
      } catch (error) {
        console.error(`Failed to compute field ${fieldName}:`, error);
        results[fieldName] = null;
      }
    }

    return results;
  }

  /**
   * 精度计算（金额、数量等）
   */
  precisionCalculate(
    expression: string,
    context: Record<string, any>,
    precision: number = 2
  ): string {
    try {
      // 将上下文中的数字转换为 Decimal
      const decimalContext: Record<string, any> = {};
      for (const [key, value] of Object.entries(context)) {
        decimalContext[key] = typeof value === 'number' ? new Decimal(value) : value;
      }

      // 计算结果
      const result = this.evaluateWithDecimal(expression, decimalContext);

      // 保留指定精度
      return result.toFixed(precision);
    } catch (error) {
      console.error('[PrecisionCalculate] Failed:', error);
      throw error;
    }
  }

  /**
   * 使用 Decimal 求值表达式
   */
  private evaluateWithDecimal(expression: string, context: Record<string, any>): Decimal {
    // 简化实现：使用字符串替换
    let expr = expression;

    // 替换变量
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      if (value instanceof Decimal) {
        expr = expr.replace(regex, value.toString());
      } else {
        expr = expr.replace(regex, String(value));
      }
    }

    // 使用 Decimal 计算
    try {
      // 简单的四则运算解析
      return this.parseDecimalExpression(expr);
    } catch (error) {
      throw new Error(`Failed to evaluate decimal expression: ${expr}`);
    }
  }

  /**
   * 解析 Decimal 表达式（简单四则运算）
   */
  private parseDecimalExpression(expr: string): Decimal {
    // 去除空格
    expr = expr.replace(/\s/g, '');

    // 处理括号
    while (expr.includes('(')) {
      const start = expr.lastIndexOf('(');
      const end = expr.indexOf(')', start);
      const subExpr = expr.substring(start + 1, end);
      const result = this.parseDecimalExpression(subExpr);
      expr = expr.substring(0, start) + result.toString() + expr.substring(end + 1);
    }

    // 处理乘除
    let tokens = this.tokenize(expr);
    tokens = this.processOperators(tokens, ['*', '/']);
    tokens = this.processOperators(tokens, ['+', '-']);

    return new Decimal(tokens[0]);
  }

  /**
   * 分词
   */
  private tokenize(expr: string): string[] {
    const tokens: string[] = [];
    let current = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (['+', '-', '*', '/'].includes(char)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * 处理运算符
   */
  private processOperators(tokens: string[], operators: string[]): string[] {
    const result: string[] = [];
    let i = 0;

    while (i < tokens.length) {
      if (i + 2 < tokens.length && operators.includes(tokens[i + 1])) {
        const left = new Decimal(tokens[i]);
        const operator = tokens[i + 1];
        const right = new Decimal(tokens[i + 2]);

        let value: Decimal;
        switch (operator) {
          case '+':
            value = left.plus(right);
            break;
          case '-':
            value = left.minus(right);
            break;
          case '*':
            value = left.times(right);
            break;
          case '/':
            value = left.dividedBy(right);
            break;
          default:
            throw new Error(`Unknown operator: ${operator}`);
        }

        result.push(value.toString());
        i += 3;
      } else {
        result.push(tokens[i]);
        i++;
      }
    }

    return result;
  }

  /**
   * 批量计算精度字段
   */
  batchPrecisionCalculate(
    records: Record<string, any>[],
    fieldDefinitions: Record<string, { expression: string; precision: number }>
  ): Record<string, any>[] {
    return records.map((record) => {
      const computed: Record<string, any> = {};

      for (const [fieldName, config] of Object.entries(fieldDefinitions)) {
        try {
          computed[fieldName] = this.precisionCalculate(
            config.expression,
            record,
            config.precision
          );
        } catch (error) {
          console.error(`Failed to compute ${fieldName}:`, error);
          computed[fieldName] = null;
        }
      }

      return {
        ...record,
        ...computed,
      };
    });
  }
}
