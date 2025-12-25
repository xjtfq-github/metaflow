export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json' | 'relation';

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string; // custom validator function name
}

export interface ComputedExpression {
  expression: string; // e.g. "price * quantity"
  dependencies: string[];
}

export interface RelationDefinition {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
  target: string; // Target entity name
  foreignKey: string; // Required for database relationships
  as?: string; // alias
}

export interface IndexDefinition {
  fields: string[];
  unique?: boolean;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  defaultValue?: any;
  validation?: ValidationRules;
  computed?: ComputedExpression;
  hidden?: boolean;
  options?: { label: string; value: any }[]; // For enum
}

export interface ModelDSL {
  id: string;
  version: string;
  entityName: string;
  displayName: string;
  description?: string;
  fields: FieldDefinition[];
  relations: RelationDefinition[];
  indexes?: IndexDefinition[];
  timestamps?: boolean;
}
