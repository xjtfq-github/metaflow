/**
 * 表达式求值器
 * 
 * 基于 jsep + 自定义 evaluate 安全求值
 */

import jsep from 'jsep';
import { evaluate as mathEvaluate } from 'mathjs';
import Decimal from 'decimal.js';

/**
 * 表达式求值
 * 
 * @example
 * evaluateExpression('price * quantity', { price: 10, quantity: 5 })
 * // => 50
 */
export function evaluateExpression(expression: string, context: Record<string, any>): any {
  try {
    // 解析为 AST
    const ast = jsep(expression);
    
    // 安全求值
    return evaluateNode(ast, context);
  } catch (error: any) {
    throw new Error(`Expression evaluation failed: ${error.message}`);
  }
}

/**
 * 递归求值 AST 节点
 */
function evaluateNode(node: any, context: Record<string, any>): any {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Identifier':
      return getContextValue(node.name, context);

    case 'MemberExpression':
      return evaluateMemberExpression(node, context);

    case 'BinaryExpression':
      return evaluateBinaryExpression(node, context);

    case 'UnaryExpression':
      return evaluateUnaryExpression(node, context);

    case 'CallExpression':
      return evaluateCallExpression(node, context);

    case 'ConditionalExpression':
      return evaluateConditionalExpression(node, context);

    case 'LogicalExpression':
      return evaluateLogicalExpression(node, context);

    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}

/**
 * 成员访问 (a.b.c)
 */
function evaluateMemberExpression(node: any, context: Record<string, any>): any {
  const object = evaluateNode(node.object, context);
  const property = node.computed
    ? evaluateNode(node.property, context)
    : node.property.name;

  return object?.[property];
}

/**
 * 二元运算 (+, -, *, /, %, ==, !=, <, >, ...)
 */
function evaluateBinaryExpression(node: any, context: Record<string, any>): any {
  const left = evaluateNode(node.left, context);
  const right = evaluateNode(node.right, context);

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
    default:
      throw new Error(`Unsupported operator: ${node.operator}`);
  }
}

/**
 * 一元运算 (!, -, +)
 */
function evaluateUnaryExpression(node: any, context: Record<string, any>): any {
  const argument = evaluateNode(node.argument, context);

  switch (node.operator) {
    case '!': return !argument;
    case '-': return -argument;
    case '+': return +argument;
    default:
      throw new Error(`Unsupported unary operator: ${node.operator}`);
  }
}

/**
 * 函数调用 (SUM, IF, MAX, ...)
 */
function evaluateCallExpression(node: any, context: Record<string, any>): any {
  const funcName = node.callee.name;
  const args = node.arguments.map((arg: any) => evaluateNode(arg, context));

  return callFunction(funcName, args);
}

/**
 * 三元运算 (a ? b : c)
 */
function evaluateConditionalExpression(node: any, context: Record<string, any>): any {
  const test = evaluateNode(node.test, context);
  return test
    ? evaluateNode(node.consequent, context)
    : evaluateNode(node.alternate, context);
}

/**
 * 逻辑运算 (&&, ||)
 */
function evaluateLogicalExpression(node: any, context: Record<string, any>): any {
  const left = evaluateNode(node.left, context);

  if (node.operator === '&&') {
    return left && evaluateNode(node.right, context);
  } else if (node.operator === '||') {
    return left || evaluateNode(node.right, context);
  }

  throw new Error(`Unsupported logical operator: ${node.operator}`);
}

/**
 * 获取上下文变量值
 */
function getContextValue(name: string, context: Record<string, any>): any {
  if (!(name in context)) {
    throw new Error(`Variable "${name}" is not defined`);
  }
  return context[name];
}

/**
 * 内置函数库
 */
function callFunction(name: string, args: any[]): any {
  const functions: Record<string, (...args: any[]) => any> = {
    // 数学函数
    SUM: (...nums) => nums.reduce((a, b) => a + b, 0),
    AVG: (...nums) => nums.reduce((a, b) => a + b, 0) / nums.length,
    MAX: (...nums) => Math.max(...nums),
    MIN: (...nums) => Math.min(...nums),
    ABS: (n) => Math.abs(n),
    ROUND: (n, decimals = 0) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals),

    // 逻辑函数
    IF: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,

    // 字符串函数
    CONCAT: (...strs) => strs.join(''),
    UPPER: (str) => String(str).toUpperCase(),
    LOWER: (str) => String(str).toLowerCase(),
    TRIM: (str) => String(str).trim(),

    // 日期函数
    NOW: () => new Date(),
    TODAY: () => new Date().toISOString().split('T')[0],
  };

  if (!(name in functions)) {
    throw new Error(`Unknown function: ${name}`);
  }

  return functions[name](...args);
}

/**
 * 精确计算 (使用 Decimal.js)
 */
export function evaluatePrecise(expression: string, context: Record<string, any>): Decimal {
  const result = evaluateExpression(expression, context);
  return new Decimal(result);
}
