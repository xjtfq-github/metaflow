import { Module } from '@nestjs/common';
import { VersionController } from './version.controller';
import { VersionService } from './version.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [VersionController],
  providers: [
    VersionService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
  exports: [VersionService],
})
export class VersionModule {}
