
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.TenantScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  departmentId: 'departmentId',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  parentId: 'parentId',
  path: 'path',
  level: 'level',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  tenantId: 'tenantId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserRoleScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  roleId: 'roleId',
  createdAt: 'createdAt'
};

exports.Prisma.PolicyScalarFieldEnum = {
  id: 'id',
  roleId: 'roleId',
  effect: 'effect',
  resource: 'resource',
  actions: 'actions',
  condition: 'condition',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  icon: 'icon',
  status: 'status',
  tenantId: 'tenantId',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppDraftScalarFieldEnum = {
  id: 'id',
  appId: 'appId',
  snapshot: 'snapshot',
  updatedAt: 'updatedAt',
  updatedBy: 'updatedBy',
  createdAt: 'createdAt'
};

exports.Prisma.AppVersionScalarFieldEnum = {
  id: 'id',
  appId: 'appId',
  version: 'version',
  status: 'status',
  snapshot: 'snapshot',
  changelog: 'changelog',
  publishedBy: 'publishedBy',
  publishedAt: 'publishedAt',
  archivedAt: 'archivedAt',
  createdAt: 'createdAt'
};

exports.Prisma.DeploymentScalarFieldEnum = {
  id: 'id',
  appId: 'appId',
  versionId: 'versionId',
  environment: 'environment',
  status: 'status',
  deployedBy: 'deployedBy',
  deployedAt: 'deployedAt',
  canaryEnabled: 'canaryEnabled',
  canaryPercent: 'canaryPercent',
  canaryWhitelist: 'canaryWhitelist',
  rollbackAt: 'rollbackAt',
  errorMessage: 'errorMessage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.HiddenDangerScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  title: 'title',
  level: 'level',
  status: 'status',
  reporterId: 'reporterId',
  extraData: 'extraData',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssetScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  assetCode: 'assetCode',
  name: 'name',
  category: 'category',
  manufacturer: 'manufacturer',
  model: 'model',
  serialNumber: 'serialNumber',
  location: 'location',
  department: 'department',
  status: 'status',
  healthScore: 'healthScore',
  purchaseDate: 'purchaseDate',
  warrantyExpiry: 'warrantyExpiry',
  lastMaintenance: 'lastMaintenance',
  nextMaintenance: 'nextMaintenance',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WorkOrderScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  orderNo: 'orderNo',
  title: 'title',
  description: 'description',
  type: 'type',
  priority: 'priority',
  status: 'status',
  assetId: 'assetId',
  assigneeId: 'assigneeId',
  scheduledAt: 'scheduledAt',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  workContent: 'workContent',
  workResult: 'workResult',
  usedParts: 'usedParts',
  workHours: 'workHours',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InspectionPlanScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  description: 'description',
  frequency: 'frequency',
  assetId: 'assetId',
  checkItems: 'checkItems',
  inspectorId: 'inspectorId',
  status: 'status',
  nextInspection: 'nextInspection',
  lastInspection: 'lastInspection',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventoryItemScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  partCode: 'partCode',
  partName: 'partName',
  specification: 'specification',
  unit: 'unit',
  quantity: 'quantity',
  minQuantity: 'minQuantity',
  maxQuantity: 'maxQuantity',
  unitPrice: 'unitPrice',
  warehouse: 'warehouse',
  shelf: 'shelf',
  assetId: 'assetId',
  supplier: 'supplier',
  leadTime: 'leadTime',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CustomScriptScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  description: 'description',
  language: 'language',
  code: 'code',
  enabled: 'enabled',
  trigger: 'trigger',
  triggerConfig: 'triggerConfig',
  timeout: 'timeout',
  memoryLimit: 'memoryLimit',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ScriptExecutionScalarFieldEnum = {
  id: 'id',
  scriptId: 'scriptId',
  status: 'status',
  input: 'input',
  output: 'output',
  logs: 'logs',
  errors: 'errors',
  executionTime: 'executionTime',
  memoryUsed: 'memoryUsed',
  triggeredBy: 'triggeredBy',
  startedAt: 'startedAt',
  completedAt: 'completedAt'
};

exports.Prisma.WebhookScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  description: 'description',
  url: 'url',
  secret: 'secret',
  method: 'method',
  headers: 'headers',
  scriptId: 'scriptId',
  enabled: 'enabled',
  lastTriggeredAt: 'lastTriggeredAt',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WebhookRequestScalarFieldEnum = {
  id: 'id',
  webhookId: 'webhookId',
  method: 'method',
  headers: 'headers',
  body: 'body',
  query: 'query',
  status: 'status',
  response: 'response',
  error: 'error',
  responseTime: 'responseTime',
  receivedAt: 'receivedAt'
};

exports.Prisma.ConnectorScalarFieldEnum = {
  id: 'id',
  tenantId: 'tenantId',
  name: 'name',
  description: 'description',
  type: 'type',
  config: 'config',
  credentials: 'credentials',
  enabled: 'enabled',
  createdBy: 'createdBy',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Tenant: 'Tenant',
  User: 'User',
  Department: 'Department',
  Role: 'Role',
  UserRole: 'UserRole',
  Policy: 'Policy',
  App: 'App',
  AppDraft: 'AppDraft',
  AppVersion: 'AppVersion',
  Deployment: 'Deployment',
  HiddenDanger: 'HiddenDanger',
  Asset: 'Asset',
  WorkOrder: 'WorkOrder',
  InspectionPlan: 'InspectionPlan',
  InventoryItem: 'InventoryItem',
  CustomScript: 'CustomScript',
  ScriptExecution: 'ScriptExecution',
  Webhook: 'Webhook',
  WebhookRequest: 'WebhookRequest',
  Connector: 'Connector'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
