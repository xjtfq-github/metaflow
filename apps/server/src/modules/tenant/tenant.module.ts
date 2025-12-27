import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { RlsService } from '../../common/rls.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [TenantController],
  providers: [
    TenantService,
    RlsService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
  exports: [TenantService, RlsService],
})
export class TenantModule {}
