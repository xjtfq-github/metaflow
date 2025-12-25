export interface ApiErrorResponse {
  code: string;
  message: string;
  traceId?: string;
  timestamp: string;
  path?: string;
  details?: any;
}

export const ErrorCodes = {
  // System Errors
  INTERNAL_SERVER_ERROR: 'SYS-000-500',
  NOT_IMPLEMENTED: 'SYS-000-501',
  
  // Auth Errors
  UNAUTHORIZED: 'AUTH-001-401',
  FORBIDDEN: 'AUTH-001-403',
  TOKEN_EXPIRED: 'AUTH-001-401-01',
  
  // Data Errors
  RECORD_NOT_FOUND: 'DATA-002-404',
  VALIDATION_FAILED: 'DATA-002-400',
  DUPLICATE_ENTRY: 'DATA-002-409',
  
  // Workflow Errors
  WORKFLOW_ERROR: 'WF-003-500',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
