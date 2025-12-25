/**
 * 依赖图与拓扑排序
 * 用于计算字段的依赖分析和自动重算
 */

import { ExpressionEngine } from './expression';

export interface FieldNode {
  name: string;
  expression: string | undefined;
  dependencies: string[];
}

/**
 * 依赖图
 */
export class DependencyGraph {
  private fields: Map<string, FieldNode> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacencyList: Map<string, Set<string>> = new Map();
  private expressionEngine: ExpressionEngine;

  constructor() {
    this.expressionEngine = new ExpressionEngine();
  }

  /**
   * 添加字段节点
   */
  addField(field: { name: string; expression?: string }) {
    const dependencies = field.expression
      ? this.expressionEngine.extractDependencies(field.expression)
      : [];

    const node: FieldNode = {
      name: field.name,
      expression: field.expression,
      dependencies,
    };

    this.fields.set(field.name, node);

    // 构建邻接表（依赖关系）
    if (!this.adjacencyList.has(field.name)) {
      this.adjacencyList.set(field.name, new Set());
    }

    // 构建反向邻接表（被依赖关系）
    for (const dep of dependencies) {
      if (!this.reverseAdjacencyList.has(dep)) {
        this.reverseAdjacencyList.set(dep, new Set());
      }
      this.reverseAdjacencyList.get(dep)!.add(field.name);

      if (!this.adjacencyList.has(dep)) {
        this.adjacencyList.set(dep, new Set());
      }
    }
  }

  /**
   * 拓扑排序（Kahn 算法）
   */
  topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const result: string[] = [];
    const queue: string[] = [];

    // 计算所有节点的入度
    for (const [fieldName, node] of this.fields.entries()) {
      inDegree.set(fieldName, node.dependencies.length);
      if (node.dependencies.length === 0) {
        queue.push(fieldName);
      }
    }

    // Kahn 算法
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // 减少所有依赖当前节点的节点的入度
      const dependents = this.reverseAdjacencyList.get(current);
      if (dependents) {
        for (const dependent of dependents) {
          const degree = inDegree.get(dependent)! - 1;
          inDegree.set(dependent, degree);

          if (degree === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    // 检查是否有环
    if (result.length !== this.fields.size) {
      const cycleNodes = Array.from(this.fields.keys()).filter(
        (name) => !result.includes(name)
      );
      throw new Error(`Circular dependency detected: ${cycleNodes.join(', ')}`);
    }

    return result;
  }

  /**
   * 获取受影响的字段（某字段变化后需要重算的字段）
   */
  getAffectedFields(fieldName: string): string[] {
    const affected = new Set<string>();
    const queue = [fieldName];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.reverseAdjacencyList.get(current);

      if (dependents) {
        for (const dependent of dependents) {
          if (!affected.has(dependent)) {
            affected.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * 检测循环依赖
   */
  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const fieldNode = this.fields.get(node);
      if (fieldNode) {
        for (const dep of fieldNode.dependencies) {
          if (!visited.has(dep)) {
            dfs(dep, [...path]);
          } else if (recursionStack.has(dep)) {
            // 发现环
            const cycleStart = path.indexOf(dep);
            cycles.push([...path.slice(cycleStart), dep]);
          }
        }
      }

      recursionStack.delete(node);
    };

    for (const fieldName of this.fields.keys()) {
      if (!visited.has(fieldName)) {
        dfs(fieldName, []);
      }
    }

    return cycles;
  }

  /**
   * 获取字段依赖
   */
  getDependencies(fieldName: string): string[] {
    return this.fields.get(fieldName)?.dependencies || [];
  }

  /**
   * 获取所有字段
   */
  getAllFields(): string[] {
    return Array.from(this.fields.keys());
  }
}
