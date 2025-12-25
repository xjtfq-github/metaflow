import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { runWithTenant } from '../tenant-context';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const header = req.headers['x-tenant-id'];
    const tenantId =
      typeof header === 'string'
        ? header
        : Array.isArray(header)
          ? header[0]
          : 'tenant-1';
    runWithTenant({ tenantId }, next);
  }
}
