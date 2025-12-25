/**
 * 依赖图与拓扑排序
 * 
 * 用于字段依赖追踪与自动重算
 */

import jsep from 'jsep';

/**
 * 字段定义
 */
export interface FieldDefinition {
  name: string;
  expression?: string; // 计算公式
}

/**
 * 依赖图
 */
export class DependencyGraph {
  private fields: Map<string, FieldDefinition> = new Map();
  private dependencies: Map<string, Set<string>> = new Map(); // field -> 依赖的字段

  /**
   * 添加字段
   */
  addField(field: FieldDefinition): void {
    this.fields.set(field.name, field);

    if (field.expression) {
      const deps = this.extractDependencies(field.expression);
      this.dependencies.set(field.name, new Set(deps));
    }
  }

  /**
   * 提取表达式中的变量引用
   */
  private extractDependencies(expression: string): string[] {
    const deps: string[] = [];

    try {
      const ast = jsep(expression);
      this.traverseAST(ast, (node) => {
        if (node.type === 'Identifier') {
          deps.push(node.name);
        } else if (node.type === 'MemberExpression' && !node.computed) {
          // a.b.c => 提取根对象 'a'
          let obj = node.object;
          while (obj.type === 'MemberExpression') {
            obj = obj.object;
          }
          if (obj.type === 'Identifier') {
            deps.push(obj.name);
          }
        }
      });
    } catch (error) {
      console.error('Failed to parse expression:', expression, error);
    }

    return [...new Set(deps)]; // 去重
  }

  /**
   * 遍历 AST
   */
  private traverseAST(node: any, callback: (node: any) => void): void {
    callback(node);

    if (node.left) this.traverseAST(node.left, callback);
    if (node.right) this.traverseAST(node.right, callback);
    if (node.object) this.traverseAST(node.object, callback);
    if (node.property) this.traverseAST(node.property, callback);
    if (node.arguments) {
      node.arguments.forEach((arg: any) => this.traverseAST(arg, callback));
    }
    if (node.test) this.traverseAST(node.test, callback);
    if (node.consequent) this.traverseAST(node.consequent, callback);
    if (node.alternate) this.traverseAST(node.alternate, callback);
  }

  /**
   * 拓扑排序 (返回计算顺序)
   */
  topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (fieldName: string) => {
      if (visited.has(fieldName)) return;
      if (visiting.has(fieldName)) {
        throw new Error(`Circular dependency detected involving field: ${fieldName}`);
      }

      visiting.add(fieldName);

      // 先访问依赖
      const deps = this.dependencies.get(fieldName) || new Set();
      for (const dep of deps) {
        if (this.fields.has(dep)) {
          visit(dep);
        }
      }

      visiting.delete(fieldName);
      visited.add(fieldName);
      sorted.push(fieldName);
    };

    // 访问所有字段
    for (const fieldName of this.fields.keys()) {
      visit(fieldName);
    }

    return sorted;
  }

  /**
   * 获取受影响的字段 (当某个字段变化时)
   */
  getAffectedFields(changedField: string): string[] {
    const affected: string[] = [];

    for (const [fieldName, deps] of this.dependencies.entries()) {
      if (deps.has(changedField)) {
        affected.push(fieldName);
        // 递归获取间接依赖
        affected.push(...this.getAffectedFields(fieldName));
      }
    }

    return [...new Set(affected)]; // 去重
  }

  /**
   * 计算所有字段 (按依赖顺序)
   */
  computeAll(
    initialValues: Record<string, any>,
    evaluator: (expression: string, context: Record<string, any>) => any
  ): Record<string, any> {
    const result = { ...initialValues };
    const order = this.topologicalSort();

    for (const fieldName of order) {
      const field = this.fields.get(fieldName);
      if (field?.expression) {
        result[fieldName] = evaluator(field.expression, result);
      }
    }

    return result;
  }

  /**
   * 增量计算 (仅重算受影响字段)
   */
  computeIncremental(
    changedFields: string[],
    currentValues: Record<string, any>,
    evaluator: (expression: string, context: Record<string, any>) => any
  ): Record<string, any> {
    const result = { ...currentValues };

    // 收集所有受影响字段
    const affectedSet = new Set<string>();
    for (const field of changedFields) {
      affectedSet.add(field);
      this.getAffectedFields(field).forEach((f) => affectedSet.add(f));
    }

    // 拓扑排序后过滤
    const order = this.topologicalSort().filter((f) => affectedSet.has(f));

    // 按顺序重算
    for (const fieldName of order) {
      const field = this.fields.get(fieldName);
      if (field?.expression) {
        result[fieldName] = evaluator(field.expression, result);
      }
    }

    return result;
  }
}
