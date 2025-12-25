import Ajv, { type JSONSchemaType } from 'ajv';
import type { ErrorObject } from 'ajv';
import localize from 'ajv-i18n';
import type { ExecutionContext, ExecutionResult, Pipeline } from './logic';
import type { ModelDSL } from './model';
import type { PageDSL } from './page';
import type { WorkflowDSL } from './workflow';

export type DSLKind = 'model' | 'page' | 'logic' | 'workflow';

export type DSLValidationResult =
  | { valid: true }
  | { valid: false; errors: string[]; rawErrors?: ErrorObject[] };

// 临时定义LogicDSL类型，待完善
interface LogicDSL {
  id: string;
  version: string;
  name: string;
  events: Record<string, any>;
}

export class DSLValidator {
  private readonly ajv: Ajv;

  private readonly schemaByKind: Record<
    DSLKind,
    JSONSchemaType<ModelDSL> | JSONSchemaType<PageDSL> | JSONSchemaType<LogicDSL> | JSONSchemaType<WorkflowDSL>
  >;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
    });

    this.schemaByKind = {
      model: modelSchema as JSONSchemaType<ModelDSL>,
      page: pageSchema as JSONSchemaType<PageDSL>,
      logic: logicSchema as JSONSchemaType<LogicDSL>,
      workflow: workflowSchema as JSONSchemaType<WorkflowDSL>,
    };
  }

  validate(kind: DSLKind, dsl: unknown): DSLValidationResult {
    const schema = this.schemaByKind[kind] as JSONSchemaType<unknown>;
    const validate = this.ajv.compile(schema);
    const valid = validate(dsl);
    if (valid) return { valid: true };

    const errors = validate.errors ?? [];
    localize.zh(errors);
    return {
      valid: false,
      errors: formatErrors(errors),
      rawErrors: errors,
    };
  }
}

function formatErrors(errors: ErrorObject[]): string[] {
  return errors.map((e) => {
    const path = e.instancePath || '/';
    const message = e.message ?? 'invalid';
    return `${path}: ${message}`;
  });
}

const modelSchema: JSONSchemaType<ModelDSL> = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'version', 'entityName', 'displayName', 'fields', 'relations'],
  properties: {
    id: { type: 'string' },
    version: { type: 'string' },
    entityName: { type: 'string' },
    displayName: { type: 'string' },
    description: { type: 'string', nullable: true },
    timestamps: { type: 'boolean', nullable: true },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['key', 'label', 'type'],
        properties: {
          key: { type: 'string' },
          label: { type: 'string' },
          type: { type: 'string' },
          required: { type: 'boolean', nullable: true },
          defaultValue: { nullable: true } as any,
          validation: { nullable: true } as any,
          computed: { nullable: true } as any,
          hidden: { type: 'boolean', nullable: true },
        },
      } as any,
    },
    relations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['type', 'target', 'foreignKey'],
        properties: {
          type: { type: 'string' },
          target: { type: 'string' },
          foreignKey: { type: 'string' },
          as: { type: 'string', nullable: true },
        },
      } as any,
    },
    indexes: { type: 'array', nullable: true, items: { type: 'object' } as any },
  },
};

const pageSchema: JSONSchemaType<PageDSL> = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'version', 'name', 'layout', 'components'],
  properties: {
    id: { type: 'string' },
    version: { type: 'string' },
    name: { type: 'string' },
    layout: { type: 'string' } as any,
    components: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['id', 'type'],
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          props: { nullable: true } as any,
          children: { nullable: true } as any,
        },
      } as any,
    },
    state: { nullable: true } as any,
    styles: { nullable: true } as any,
  },
};

const logicSchema: JSONSchemaType<LogicDSL> = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'version', 'name', 'events'],
  properties: {
    id: { type: 'string' },
    version: { type: 'string' },
    name: { type: 'string' },
    events: { type: 'object', additionalProperties: true } as any,
  },
};

const workflowSchema: JSONSchemaType<WorkflowDSL> = {
  type: 'object',
  additionalProperties: true,
  required: ['id', 'version', 'name', 'nodes', 'edges'],
  properties: {
    id: { type: 'string' },
    version: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    nodes: { type: 'array', items: { type: 'object' } as any },
    edges: { type: 'array', items: { type: 'object' } as any },
  },
};
