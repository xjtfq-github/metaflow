/**
 * 表达式引擎
 * 安全的表达式求值器，支持数学运算、逻辑判断、函数调用
 */

import * as jsep from 'jsep';
import { create, all } from 'mathjs';

const math = create(all as any);

/**
 * 表达式引擎
 */
export class ExpressionEngine {
  private functions: Map<string, Function> = new Map();
  private astCache: Map<string, any> = new Map();

  constructor() {
    this.registerBuiltinFunctions();
  }

  /**
   * 注册内置函数
   */
  private registerBuiltinFunctions() {
    // 数学函数
    this.functions.set('SUM', (...args: number[]) => args.reduce((a, b) => a + b, 0));
    this.functions.set('AVG', (...args: number[]) => {
      return args.reduce((a, b) => a + b, 0) / args.length;
    });
    this.functions.set('MAX', (...args: number[]) => Math.max(...args));
    this.functions.set('MIN', (...args: number[]) => Math.min(...args));
    this.functions.set('ROUND', (value: number, decimals = 0) => {
      return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    });

    // 逻辑函数
    this.functions.set('IF', (condition: boolean, trueValue: any, falseValue: any) => {
      return condition ? trueValue : falseValue;
    });

    // 字符串函数
    this.functions.set('CONCAT', (...args: any[]) => args.join(''));
    this.functions.set('UPPER', (str: string) => str.toUpperCase());
    this.functions.set('LOWER', (str: string) => str.toLowerCase());

    // 日期函数
    this.functions.set('NOW', () => new Date());
    this.functions.set('TODAY', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    });
  }

  /**
   * 求值表达式
   */
  evaluate(expression: string, context: Record<string, any>): any {
    try {
      // 尝试使用 mathjs（纯数学表达式）
      if (this.isMathExpression(expression)) {
        return math.evaluate(expression, context);
      }

      // 使用缓存的 AST
      let ast = this.astCache.get(expression);
      if (!ast) {
        ast = jsep(expression);
        this.astCache.set(expression, ast);
      }

      return this.evaluateAST(ast, context);
    } catch (error) {
      console.error('[ExpressionEngine] Evaluation failed:', error);
      throw new Error(`Expression evaluation failed: ${expression}`);
    }
  }

  /**
   * 判断是否为纯数学表达式
   */
  private isMathExpression(expr: string): boolean {
    return /^[0-9+\-*\/()\s.]+$/.test(expr);
  }

  /**
   * 求值 AST
   */
  private evaluateAST(node: any, context: Record<string, any>): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        return this.resolveIdentifier(node.name, context);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, context);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, context);

      case 'CallExpression':
        return this.evaluateCallExpression(node, context);

      case 'MemberExpression':
        return this.evaluateMemberExpression(node, context);

      case 'ConditionalExpression':
        const test = this.evaluateAST(node.test, context);
        return test
          ? this.evaluateAST(node.consequent, context)
          : this.evaluateAST(node.alternate, context);

      default:
        throw new Error(`Unsupported AST node type: ${node.type}`);
    }
  }

  /**
   * 解析标识符
   */
  private resolveIdentifier(name: string, context: Record<string, any>): any {
    if (name in context) {
      return context[name];
    }
    throw new Error(`Identifier "${name}" not found in context`);
  }

  /**
   * 求值二元表达式
   */
  private evaluateBinaryExpression(node: any, context: Record<string, any>): any {
    const left = this.evaluateAST(node.left, context);
    const right = this.evaluateAST(node.right, context);

    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '==': return left == right;
      case '===': return left === right;
      case '!=': return left != right;
      case '!==': return left !== right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      default:
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
  }

  /**
   * 求值一元表达式
   */
  private evaluateUnaryExpression(node: any, context: Record<string, any>): any {
    const argument = this.evaluateAST(node.argument, context);

    switch (node.operator) {
      case '-': return -argument;
      case '+': return +argument;
      case '!': return !argument;
      default:
        throw new Error(`Unsupported unary operator: ${node.operator}`);
    }
  }

  /**
   * 求值函数调用
   */
  private evaluateCallExpression(node: any, context: Record<string, any>): any {
    const functionName = node.callee.name;
    const func = this.functions.get(functionName);

    if (!func) {
      throw new Error(`Function "${functionName}" not found`);
    }

    const args = node.arguments.map((arg: any) => this.evaluateAST(arg, context));
    return func(...args);
  }

  /**
   * 求值成员访问（如 user.name）
   */
  private evaluateMemberExpression(node: any, context: Record<string, any>): any {
    const object = this.evaluateAST(node.object, context);
    const property = node.computed
      ? this.evaluateAST(node.property, context)
      : node.property.name;

    return object[property];
  }

  /**
   * 提取表达式中的变量依赖
   */
  extractDependencies(expression: string): string[] {
    try {
      const ast = jsep(expression);
      const dependencies = new Set<string>();
      this.collectIdentifiers(ast, dependencies);
      return Array.from(dependencies);
    } catch (error) {
      console.error('[ExpressionEngine] Failed to extract dependencies:', error);
      return [];
    }
  }

  /**
   * 收集 AST 中的所有标识符
   */
  private collectIdentifiers(node: any, dependencies: Set<string>) {
    if (!node) return;

    if (node.type === 'Identifier') {
      dependencies.add(node.name);
    } else if (node.type === 'MemberExpression') {
      if (node.object.type === 'Identifier') {
        dependencies.add(node.object.name);
      }
    } else if (node.type === 'CallExpression') {
      node.arguments.forEach((arg: any) => this.collectIdentifiers(arg, dependencies));
    } else if (node.type === 'BinaryExpression' || node.type === 'LogicalExpression') {
      this.collectIdentifiers(node.left, dependencies);
      this.collectIdentifiers(node.right, dependencies);
    } else if (node.type === 'UnaryExpression') {
      this.collectIdentifiers(node.argument, dependencies);
    } else if (node.type === 'ConditionalExpression') {
      this.collectIdentifiers(node.test, dependencies);
      this.collectIdentifiers(node.consequent, dependencies);
      this.collectIdentifiers(node.alternate, dependencies);
    }
  }
}
