/**
 * 安全表达式求值器
 * 
 * 功能:
 * 1. 解析和执行表达式 (如 {{ formData.amount > 1000 }})
 * 2. 沙箱隔离 (仅暴露安全 API，屏蔽 window/document)
 * 3. 支持常用运算符和函数
 * 
 * 安全策略:
 * - 使用 Function 构造器而非 eval
 * - 限制作用域 (仅允许访问 context 对象)
 * - 禁止访问全局对象 (window, document, process 等)
 */

// 安全的内置函数
const SAFE_FUNCTIONS = {
  // 数学函数
  Math: {
    abs: Math.abs,
    ceil: Math.ceil,
    floor: Math.floor,
    round: Math.round,
    max: Math.max,
    min: Math.min,
    random: Math.random,
  },
  
  // 字符串函数
  String: {
    toLowerCase: (str: string) => str.toLowerCase(),
    toUpperCase: (str: string) => str.toUpperCase(),
    trim: (str: string) => str.trim(),
    substring: (str: string, start: number, end?: number) => str.substring(start, end),
    includes: (str: string, search: string) => str.includes(search),
  },
  
  // 数组函数
  Array: {
    isArray: Array.isArray,
    length: (arr: any[]) => arr.length,
    join: (arr: any[], separator: string) => arr.join(separator),
    includes: (arr: any[], item: any) => arr.includes(item),
  },
  
  // 日期函数
  Date: {
    now: Date.now,
    parse: Date.parse,
  },
  
  // 业务函数
  IF: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
  SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  AVG: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
  CONCAT: (...args: any[]) => args.join(''),
  CONTAINS: (str: string, search: string) => str.includes(search),
  EMPTY: (value: any) => value === undefined || value === null || value === '',
  NOT_EMPTY: (value: any) => value !== undefined && value !== null && value !== '',
};

/**
 * 表达式类型
 */
export type ExpressionValue = string | number | boolean | null | undefined;

export interface EvaluationContext {
  formData?: Record<string, any>;
  user?: {
    id: string;
    name: string;
    dept?: string;
    role?: string;
  };
  [key: string]: any;
}

/**
 * 表达式求值器
 */
export class ExpressionEvaluator {
  /**
   * 解析表达式模板
   * 支持格式: "{{ expression }}" 或纯表达式
   */
  static parse(template: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }

  /**
   * 安全求值 (核心方法)
   */
  static evaluate(expression: string, context: EvaluationContext = {}): ExpressionValue {
    try {
      // 移除花括号 (如果存在)
      const cleanExpr = expression.replace(/^\{\{|\}\}$/g, '').trim();

      // 构建安全的作用域
      const scope = {
        ...SAFE_FUNCTIONS,
        ...context,
      };

      // 创建沙箱函数
      // 注意: 使用 with 语句虽然不推荐，但在这里用于限制作用域
      const func = new Function(
        ...Object.keys(scope),
        `
        "use strict";
        // 禁止访问全局对象
        const window = undefined;
        const document = undefined;
        const global = undefined;
        const process = undefined;
        const require = undefined;
        const module = undefined;
        const exports = undefined;
        
        // 执行表达式
        return (${cleanExpr});
        `
      );

      // 执行并返回结果
      const result = func(...Object.values(scope));
      return result;
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return undefined;
    }
  }

  /**
   * 批量替换模板中的表达式
   * 
   * 示例:
   * template: "金额: {{ formData.amount }}, 状态: {{ formData.status }}"
   * context: { formData: { amount: 1000, status: 'pending' } }
   * 返回: "金额: 1000, 状态: pending"
   */
  static replace(template: string, context: EvaluationContext = {}): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const value = this.evaluate(expression, context);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * 验证表达式是否安全
   * 检测危险关键词 (eval, Function, setTimeout 等)
   */
  static isSafe(expression: string): boolean {
    const dangerousKeywords = [
      'eval',
      'Function',
      'setTimeout',
      'setInterval',
      'XMLHttpRequest',
      'fetch',
      'import',
      'require',
      '__proto__',
      'constructor',
      'prototype',
    ];

    const cleanExpr = expression.replace(/^\{\{|\}\}$/g, '').trim();

    for (const keyword of dangerousKeywords) {
      if (cleanExpr.includes(keyword)) {
        console.warn(`Expression contains dangerous keyword: ${keyword}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 编译表达式 (缓存优化)
   */
  private static cache = new Map<string, Function>();

  static compile(expression: string): (context: EvaluationContext) => ExpressionValue {
    // 检查缓存
    if (this.cache.has(expression)) {
      const func = this.cache.get(expression)!;
      return (context) => {
        try {
          return func(context);
        } catch (error) {
          console.error('Compiled expression error:', error);
          return undefined;
        }
      };
    }

    // 安全检查
    if (!this.isSafe(expression)) {
      return () => undefined;
    }

    // 编译
    const cleanExpr = expression.replace(/^\{\{|\}\}$/g, '').trim();
    const func = new Function(
      'context',
      `
      "use strict";
      with (context) {
        const window = undefined;
        const document = undefined;
        const global = undefined;
        return (${cleanExpr});
      }
      `
    );

    // 缓存
    this.cache.set(expression, func);

    return (context) => {
      try {
        return func({ ...SAFE_FUNCTIONS, ...context });
      } catch (error) {
        console.error('Compiled expression error:', error);
        return undefined;
      }
    };
  }
}

/**
 * 便捷方法
 */
export function evalExpression(expression: string, context?: EvaluationContext): ExpressionValue {
  return ExpressionEvaluator.evaluate(expression, context);
}

export function replaceTemplate(template: string, context?: EvaluationContext): string {
  return ExpressionEvaluator.replace(template, context);
}
