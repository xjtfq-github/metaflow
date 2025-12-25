/**
 * @metaflow/logic-engine - Event Bus & Logic Orchestration
 */

export { EventBus } from './EventBus';
export { ActionExecutor } from './ActionExecutor';
export { WorkflowEngine } from './WorkflowEngine';
export { VersionManager, CanaryManager } from './VersionManager';
export { interpolate } from './interpolate';
export { evaluateExpression, evaluatePrecise } from './ExpressionEvaluator';
export { DependencyGraph, type FieldDefinition } from './DependencyGraph';
export { PermissionEvaluator, permissionEvaluator } from './PermissionEvaluator';
export * from './actions';

export const PACKAGE_NAME = '@metaflow/logic-engine';
export const VERSION = '1.0.0';
