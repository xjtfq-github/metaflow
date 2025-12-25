/**
 * 计算字段管理器
 * 自动追踪字段依赖并重算
 */

import { DependencyGraph } from './dependency-graph';
import { ExpressionEngine } from './expression';

/**
 * 计算字段管理器
 */
export class ComputedFieldManager {
  private dependencyGraph: DependencyGraph;
  private expressionEngine: ExpressionEngine;
  private computedFields: Map<string, string> = new Map();
  private values: Record<string, any> = {};

  constructor() {
    this.dependencyGraph = new DependencyGraph();
    this.expressionEngine = new ExpressionEngine();
  }

  /**
   * 注册计算字段
   */
  registerField(name: string, expression: string) {
    this.computedFields.set(name, expression);
    this.dependencyGraph.addField({ name, expression });
  }

  /**
   * 设置字段值（触发重算）
   */
  setValue(field: string, value: any) {
    this.values[field] = value;

    // 获取受影响的字段
    const affectedFields = this.dependencyGraph.getAffectedFields(field);

    // 按拓扑序重算
    const sortedFields = this.dependencyGraph.topologicalSort();
    const toRecalculate = sortedFields.filter((f) => affectedFields.includes(f));

    for (const fieldName of toRecalculate) {
      this.recalculate(fieldName);
    }
  }

  /**
   * 重算单个字段
   */
  private recalculate(field: string) {
    const expression = this.computedFields.get(field);
    if (!expression) return;

    try {
      const result = this.expressionEngine.evaluate(expression, this.values);
      this.values[field] = result;
      console.log(`[ComputedField] ${field} = ${result}`);
    } catch (error) {
      console.error(`[ComputedField] Failed to calculate ${field}:`, error);
    }
  }

  /**
   * 获取所有值
   */
  getValues(): Record<string, any> {
    return { ...this.values };
  }

  /**
   * 获取单个值
   */
  getValue(field: string): any {
    return this.values[field];
  }

  /**
   * 初始化计算（按拓扑序）
   */
  initialize(initialValues: Record<string, any> = {}) {
    this.values = { ...initialValues };

    // 按拓扑序计算所有字段
    const sortedFields = this.dependencyGraph.topologicalSort();

    for (const field of sortedFields) {
      if (this.computedFields.has(field)) {
        this.recalculate(field);
      }
    }
  }

  /**
   * 检测循环依赖
   */
  checkCycles(): string[][] {
    return this.dependencyGraph.detectCycles();
  }

  /**
   * 重置所有值
   */
  reset() {
    this.values = {};
  }
}
