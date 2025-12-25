import { Injectable } from '@nestjs/common';
import type { ModelDSL, FieldDefinition } from '@metaflow/shared-types';

export interface SchemaDiff {
  addedFields: FieldDefinition[];
  removedFields: FieldDefinition[];
  modifiedFields: Array<{
    field: FieldDefinition;
    changes: string[];
  }>;
}

export interface MigrationSQL {
  sql: string;
  safe: boolean; // 是否为安全操作
  warning?: string;
}

/**
 * Schema Diff 计算器
 * 
 * 功能:
 * 1. 对比两个 Model DSL 的差异
 * 2. 生成安全的 ALTER TABLE 语句
 * 3. 实施软删除策略 (不实际删除列)
 */
@Injectable()
export class SchemaDiffService {
  /**
   * 计算两个模型之间的差异
   */
  calculateDiff(currentModel: ModelDSL, newModel: ModelDSL): SchemaDiff {
    const currentFields = new Map(
      currentModel.fields.map((f) => [f.key, f]),
    );
    const newFields = new Map(newModel.fields.map((f) => [f.key, f]));

    const addedFields: FieldDefinition[] = [];
    const removedFields: FieldDefinition[] = [];
    const modifiedFields: Array<{ field: FieldDefinition; changes: string[] }> =
      [];

    // 检查新增字段
    for (const [key, field] of newFields) {
      if (!currentFields.has(key)) {
        addedFields.push(field);
      }
    }

    // 检查删除字段
    for (const [key, field] of currentFields) {
      if (!newFields.has(key)) {
        removedFields.push(field);
      }
    }

    // 检查修改字段
    for (const [key, newField] of newFields) {
      const currentField = currentFields.get(key);
      if (currentField) {
        const changes = this.detectFieldChanges(currentField, newField);
        if (changes.length > 0) {
          modifiedFields.push({ field: newField, changes });
        }
      }
    }

    return { addedFields, removedFields, modifiedFields };
  }

  /**
   * 生成迁移 SQL
   */
  generateMigrationSQL(
    tableName: string,
    diff: SchemaDiff,
  ): MigrationSQL[] {
    const sqls: MigrationSQL[] = [];

    // 新增字段 (安全操作)
    for (const field of diff.addedFields) {
      const columnDef = this.fieldToColumnDefinition(field);
      const sql = `ALTER TABLE "${tableName}" ADD COLUMN ${columnDef};`;
      sqls.push({
        sql,
        safe: true,
      });
    }

    // 删除字段 (软删除策略 - 仅标记,不实际删除)
    for (const field of diff.removedFields) {
      const sql = `-- SOFT DELETE: Column "${field.key}" marked as deprecated\n-- ALTER TABLE "${tableName}" DROP COLUMN "${field.key}";`;
      sqls.push({
        sql,
        safe: true,
        warning: `字段 "${field.key}" 已标记为废弃,未实际删除。建议通过应用层隐藏该字段。`,
      });
    }

    // 修改字段 (危险操作 - 需人工审核)
    for (const { field, changes } of diff.modifiedFields) {
      const sql = `-- MANUAL REVIEW REQUIRED: Column "${field.key}" type changed\n-- Changes: ${changes.join(', ')}\n-- 请手动评估数据兼容性后执行迁移`;
      sqls.push({
        sql,
        safe: false,
        warning: `字段 "${field.key}" 类型变更需要人工审核,可能导致数据丢失或截断。`,
      });
    }

    return sqls;
  }

  /**
   * 检测字段变更
   */
  private detectFieldChanges(
    oldField: FieldDefinition,
    newField: FieldDefinition,
  ): string[] {
    const changes: string[] = [];

    if (oldField.type !== newField.type) {
      changes.push(`type: ${oldField.type} -> ${newField.type}`);
    }

    if (oldField.required !== newField.required) {
      changes.push(
        `required: ${oldField.required ?? false} -> ${newField.required ?? false}`,
      );
    }

    if (
      JSON.stringify(oldField.defaultValue) !==
      JSON.stringify(newField.defaultValue)
    ) {
      changes.push(
        `defaultValue: ${oldField.defaultValue} -> ${newField.defaultValue}`,
      );
    }

    return changes;
  }

  /**
   * 将字段定义转换为 SQL 列定义
   */
  private fieldToColumnDefinition(field: FieldDefinition): string {
    const parts: string[] = [`"${field.key}"`];

    // 类型映射
    const typeMap: Record<string, string> = {
      string: 'TEXT',
      number: 'REAL',
      boolean: 'INTEGER', // SQLite 没有 BOOLEAN
      date: 'TEXT', // ISO 8601 字符串
      enum: 'TEXT',
      json: 'TEXT', // SQLite 用 TEXT, PostgreSQL 用 JSONB
    };

    parts.push(typeMap[field.type] || 'TEXT');

    // 必填约束
    if (field.required) {
      parts.push('NOT NULL');
    }

    // 默认值
    if (field.defaultValue !== undefined) {
      const defaultVal =
        typeof field.defaultValue === 'string'
          ? `'${field.defaultValue}'`
          : field.defaultValue;
      parts.push(`DEFAULT ${defaultVal}`);
    }

    return parts.join(' ');
  }

  /**
   * 验证 SQL 安全性
   */
  validateSafety(sqls: MigrationSQL[]): {
    safe: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let allSafe = true;

    for (const item of sqls) {
      if (!item.safe) {
        allSafe = false;
      }
      if (item.warning) {
        warnings.push(item.warning);
      }
    }

    return { safe: allSafe, warnings };
  }
}
