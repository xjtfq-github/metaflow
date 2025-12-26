import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { RlsService } from '../../common/rls.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, RlsService],
  exports: [TenantService, RlsService],
})
export class TenantModule {}
