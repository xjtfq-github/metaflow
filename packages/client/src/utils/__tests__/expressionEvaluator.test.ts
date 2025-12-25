/**
 * 表达式求值器测试
 */

import { describe, it, expect } from '@jest/globals';
import { ExpressionEvaluator, evalExpression, replaceTemplate } from '../expressionEvaluator';

describe('ExpressionEvaluator', () => {
  describe('基础运算', () => {
    it('应该正确计算数学表达式', () => {
      expect(evalExpression('1 + 1')).toBe(2);
      expect(evalExpression('10 - 5')).toBe(5);
      expect(evalExpression('3 * 4')).toBe(12);
      expect(evalExpression('10 / 2')).toBe(5);
      expect(evalExpression('10 % 3')).toBe(1);
    });

    it('应该支持比较运算', () => {
      expect(evalExpression('5 > 3')).toBe(true);
      expect(evalExpression('5 < 3')).toBe(false);
      expect(evalExpression('5 >= 5')).toBe(true);
      expect(evalExpression('5 <= 4')).toBe(false);
      expect(evalExpression('5 === 5')).toBe(true);
      expect(evalExpression('5 !== 5')).toBe(false);
    });

    it('应该支持逻辑运算', () => {
      expect(evalExpression('true && true')).toBe(true);
      expect(evalExpression('true && false')).toBe(false);
      expect(evalExpression('true || false')).toBe(true);
      expect(evalExpression('false || false')).toBe(false);
      expect(evalExpression('!true')).toBe(false);
      expect(evalExpression('!false')).toBe(true);
    });

    it('应该支持三元运算符', () => {
      expect(evalExpression('true ? "yes" : "no"')).toBe('yes');
      expect(evalExpression('false ? "yes" : "no"')).toBe('no');
      expect(evalExpression('5 > 3 ? "大于" : "小于"')).toBe('大于');
    });
  });

  describe('上下文访问', () => {
    it('应该访问 formData', () => {
      const context = {
        formData: {
          amount: 1000,
          status: 'pending',
          level: 'critical',
        },
      };

      expect(evalExpression('formData.amount', context)).toBe(1000);
      expect(evalExpression('formData.status', context)).toBe('pending');
      expect(evalExpression('formData.amount > 500', context)).toBe(true);
    });

    it('应该访问 user 信息', () => {
      const context = {
        user: {
          id: '001',
          name: 'Zhang San',
          dept: 'IT',
          role: 'admin',
        },
      };

      expect(evalExpression('user.name', context)).toBe('Zhang San');
      expect(evalExpression('user.role === "admin"', context)).toBe(true);
      expect(evalExpression('user.dept', context)).toBe('IT');
    });

    it('应该访问嵌套属性', () => {
      const context = {
        formData: {
          nested: {
            value: 42,
            deep: {
              property: 'test',
            },
          },
        },
      };

      expect(evalExpression('formData.nested.value', context)).toBe(42);
      expect(evalExpression('formData.nested.deep.property', context)).toBe('test');
    });
  });

  describe('内置函数', () => {
    it('应该支持 Math 函数', () => {
      expect(evalExpression('Math.abs(-5)')).toBe(5);
      expect(evalExpression('Math.max(1, 2, 3)')).toBe(3);
      expect(evalExpression('Math.min(1, 2, 3)')).toBe(1);
      expect(evalExpression('Math.round(3.7)')).toBe(4);
      expect(evalExpression('Math.floor(3.7)')).toBe(3);
      expect(evalExpression('Math.ceil(3.1)')).toBe(4);
    });

    it('应该支持业务函数 IF', () => {
      expect(evalExpression('IF(true, "yes", "no")')).toBe('yes');
      expect(evalExpression('IF(false, "yes", "no")')).toBe('no');
      expect(evalExpression('IF(5 > 3, 10, 20)')).toBe(10);
    });

    it('应该支持业务函数 SUM', () => {
      expect(evalExpression('SUM(1, 2, 3)')).toBe(6);
      expect(evalExpression('SUM(10, 20, 30, 40)')).toBe(100);
    });

    it('应该支持业务函数 AVG', () => {
      expect(evalExpression('AVG(1, 2, 3)')).toBe(2);
      expect(evalExpression('AVG(10, 20, 30)')).toBe(20);
    });

    it('应该支持业务函数 EMPTY/NOT_EMPTY', () => {
      expect(evalExpression('EMPTY("")')).toBe(true);
      expect(evalExpression('EMPTY(null)')).toBe(true);
      expect(evalExpression('EMPTY("test")')).toBe(false);
      expect(evalExpression('NOT_EMPTY("test")')).toBe(true);
    });

    it('应该支持业务函数 CONTAINS', () => {
      expect(evalExpression('CONTAINS("hello world", "world")')).toBe(true);
      expect(evalExpression('CONTAINS("hello", "test")')).toBe(false);
    });
  });

  describe('联动校验场景', () => {
    it('重大隐患必须填整改方案', () => {
      const context = {
        formData: {
          level: 'critical',
          solution: '',
        },
      };

      const rule = 'formData.level === "critical" && EMPTY(formData.solution)';
      expect(evalExpression(rule, context)).toBe(true);
    });

    it('金额超过1000需要审批', () => {
      const context1 = { formData: { amount: 1500 } };
      const context2 = { formData: { amount: 500 } };

      const rule = 'formData.amount > 1000';
      expect(evalExpression(rule, context1)).toBe(true);
      expect(evalExpression(rule, context2)).toBe(false);
    });

    it('管理员可见特殊字段', () => {
      const adminContext = { user: { role: 'admin' } };
      const userContext = { user: { role: 'user' } };

      const rule = 'user.role === "admin"';
      expect(evalExpression(rule, adminContext)).toBe(true);
      expect(evalExpression(rule, userContext)).toBe(false);
    });
  });

  describe('模板替换', () => {
    it('应该替换单个表达式', () => {
      const context = { formData: { name: 'Zhang San' } };
      expect(replaceTemplate('Hello {{ formData.name }}', context)).toBe('Hello Zhang San');
    });

    it('应该替换多个表达式', () => {
      const context = {
        formData: { amount: 1000, status: 'pending' },
      };

      const template = '金额: {{ formData.amount }}, 状态: {{ formData.status }}';
      expect(replaceTemplate(template, context)).toBe('金额: 1000, 状态: pending');
    });

    it('应该处理计算表达式', () => {
      const context = { formData: { price: 100, quantity: 5 } };
      const template = '总价: {{ formData.price * formData.quantity }}';
      expect(replaceTemplate(template, context)).toBe('总价: 500');
    });

    it('应该保留无效表达式', () => {
      const template = 'Hello {{ invalidVar }}';
      expect(replaceTemplate(template, {})).toBe('Hello {{ invalidVar }}');
    });
  });

  describe('安全性', () => {
    it('应该阻止访问全局对象', () => {
      expect(evalExpression('window')).toBeUndefined();
      expect(evalExpression('document')).toBeUndefined();
      expect(evalExpression('global')).toBeUndefined();
      expect(evalExpression('process')).toBeUndefined();
    });

    it('应该检测危险关键词', () => {
      expect(ExpressionEvaluator.isSafe('1 + 1')).toBe(true);
      expect(ExpressionEvaluator.isSafe('eval("alert(1)")')).toBe(false);
      expect(ExpressionEvaluator.isSafe('Function("return 1")()')).toBe(false);
      expect(ExpressionEvaluator.isSafe('setTimeout(() => {}, 0)')).toBe(false);
    });

    it('应该安全处理错误表达式', () => {
      expect(evalExpression('invalid syntax !!!')).toBeUndefined();
      expect(evalExpression('formData.nonexistent.prop', { formData: {} })).toBeUndefined();
    });
  });

  describe('编译与缓存', () => {
    it('应该正确编译表达式', () => {
      const compiled = ExpressionEvaluator.compile('formData.amount > 1000');
      
      expect(compiled({ formData: { amount: 1500 } })).toBe(true);
      expect(compiled({ formData: { amount: 500 } })).toBe(false);
    });

    it('应该缓存编译结果', () => {
      const expr = 'formData.value * 2';
      
      const compiled1 = ExpressionEvaluator.compile(expr);
      const compiled2 = ExpressionEvaluator.compile(expr);
      
      // 同一个表达式应返回缓存的函数
      expect(compiled1({ formData: { value: 10 } })).toBe(20);
      expect(compiled2({ formData: { value: 10 } })).toBe(20);
    });
  });

  describe('解析表达式', () => {
    it('应该解析模板中的表达式', () => {
      const template = 'Hello {{ user.name }}, your amount is {{ formData.amount }}';
      const expressions = ExpressionEvaluator.parse(template);
      
      expect(expressions).toEqual(['user.name', 'formData.amount']);
    });

    it('应该处理空模板', () => {
      expect(ExpressionEvaluator.parse('No expressions here')).toEqual([]);
    });

    it('应该处理多行模板', () => {
      const template = `
        Name: {{ user.name }}
        Amount: {{ formData.amount }}
        Status: {{ formData.status }}
      `;
      const expressions = ExpressionEvaluator.parse(template);
      
      expect(expressions).toEqual(['user.name', 'formData.amount', 'formData.status']);
    });
  });
});
