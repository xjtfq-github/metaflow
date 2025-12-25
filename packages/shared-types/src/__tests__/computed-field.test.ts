/**
 * 表达式引擎与计算字段测试
 */

import { describe, it, expect } from '@jest/globals';
import { ExpressionEngine } from '../expression';
import { DependencyGraph } from '../dependency-graph';
import { ComputedFieldManager } from '../computed-field';

describe('ExpressionEngine', () => {
  let engine: ExpressionEngine;

  beforeEach(() => {
    engine = new ExpressionEngine();
  });

  it('应该正确计算简单数学表达式', () => {
    const result = engine.evaluate('2 + 3 * 4', {});
    expect(result).toBe(14);
  });

  it('应该正确处理变量', () => {
    const result = engine.evaluate('price * quantity', {
      price: 100,
      quantity: 5,
    });
    expect(result).toBe(500);
  });

  it('应该支持内置函数', () => {
    const result = engine.evaluate('SUM(10, 20, 30)', {});
    expect(result).toBe(60);
  });

  it('应该支持条件判断', () => {
    const result = engine.evaluate('IF(quantity > 10, price * 0.9, price)', {
      quantity: 15,
      price: 100,
    });
    expect(result).toBe(90);
  });

  it('应该提取依赖', () => {
    const deps = engine.extractDependencies('price * quantity + tax');
    expect(deps).toContain('price');
    expect(deps).toContain('quantity');
    expect(deps).toContain('tax');
  });
});

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  it('应该正确构建依赖图', () => {
    graph.addField({ name: 'price', expression: undefined });
    graph.addField({ name: 'quantity', expression: undefined });
    graph.addField({ name: 'total', expression: 'price * quantity' });

    const deps = graph.getDependencies('total');
    expect(deps).toContain('price');
    expect(deps).toContain('quantity');
  });

  it('应该正确拓扑排序', () => {
    graph.addField({ name: 'a', expression: undefined });
    graph.addField({ name: 'b', expression: 'a + 10' });
    graph.addField({ name: 'c', expression: 'b * 2' });

    const sorted = graph.topologicalSort();
    expect(sorted.indexOf('a')).toBeLessThan(sorted.indexOf('b'));
    expect(sorted.indexOf('b')).toBeLessThan(sorted.indexOf('c'));
  });

  it('应该检测循环依赖', () => {
    graph.addField({ name: 'a', expression: 'b + 1' });
    graph.addField({ name: 'b', expression: 'c + 1' });
    graph.addField({ name: 'c', expression: 'a + 1' });

    expect(() => graph.topologicalSort()).toThrow('Circular dependency');
  });

  it('应该获取受影响的字段', () => {
    graph.addField({ name: 'a', expression: undefined });
    graph.addField({ name: 'b', expression: 'a + 10' });
    graph.addField({ name: 'c', expression: 'b * 2' });

    const affected = graph.getAffectedFields('a');
    expect(affected).toContain('b');
    expect(affected).toContain('c');
  });
});

describe('ComputedFieldManager', () => {
  let manager: ComputedFieldManager;

  beforeEach(() => {
    manager = new ComputedFieldManager();
  });

  it('应该自动计算依赖字段', () => {
    manager.registerField('price', 'price');
    manager.registerField('quantity', 'quantity');
    manager.registerField('total', 'price * quantity');
    manager.registerField('totalWithTax', 'total * 1.13');

    manager.initialize({ price: 100, quantity: 5 });

    expect(manager.getValue('total')).toBe(500);
    expect(manager.getValue('totalWithTax')).toBe(565);
  });

  it('应该在字段变化时自动重算', () => {
    manager.registerField('price', 'price');
    manager.registerField('quantity', 'quantity');
    manager.registerField('total', 'price * quantity');

    manager.initialize({ price: 100, quantity: 5 });
    expect(manager.getValue('total')).toBe(500);

    manager.setValue('price', 120);
    expect(manager.getValue('total')).toBe(600);
  });

  it('应该按拓扑序重算', () => {
    manager.registerField('a', 'a');
    manager.registerField('b', 'a + 10');
    manager.registerField('c', 'b * 2');

    manager.initialize({ a: 5 });

    expect(manager.getValue('b')).toBe(15);
    expect(manager.getValue('c')).toBe(30);

    manager.setValue('a', 10);

    expect(manager.getValue('b')).toBe(20);
    expect(manager.getValue('c')).toBe(40);
  });

  it('应该检测循环依赖', () => {
    manager.registerField('a', 'b + 1');
    manager.registerField('b', 'c + 1');
    manager.registerField('c', 'a + 1');

    const cycles = manager.checkCycles();
    expect(cycles.length).toBeGreaterThan(0);
  });
});
