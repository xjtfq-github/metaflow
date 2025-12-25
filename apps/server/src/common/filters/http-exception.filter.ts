import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse, ErrorCodes } from '@metaflow/shared-types';
import { getTraceId } from '../als.context';
import { ErrorDiagnosticsService } from '../services/error-diagnostics.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    @Optional()
    @Inject(ErrorDiagnosticsService)
    private readonly diagnosticsService?: ErrorDiagnosticsService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = (
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    ) as HttpStatus;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal Server Error';

    const details =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as Error).stack;

    // In production, do not expose stack trace
    const safeDetails = process.env.NODE_ENV === 'production' ? null : details;

    const errorResponse: ApiErrorResponse = {
      code: this.mapStatusToErrorCode(status),
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      details: safeDetails,
      traceId: getTraceId(), // 从 ALS 获取 TraceID
    };

    // AI 错误诊断 (开发环境)
    if (process.env.NODE_ENV !== 'production' && this.diagnosticsService) {
      try {
        const diagnostics = await this.diagnosticsService.generateReport(
          exception as Error,
        );
        this.logger.debug('AI Diagnostics:', diagnostics.analysis);
        // 可选: 附加到响应中
        if (diagnostics.analysis) {
          (errorResponse as any).diagnostics = diagnostics.analysis;
        }
      } catch (err) {
        this.logger.error('Error diagnostics failed:', err);
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - ${status} - ${message}`,
      (exception as Error).stack,
    );

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.RECORD_NOT_FOUND;
      default:
        return ErrorCodes.INTERNAL_SERVER_ERROR;
    }
  }
}
