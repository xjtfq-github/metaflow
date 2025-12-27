import { Module } from '@nestjs/common';
import { EamController } from './eam.controller';
import { EamService } from './eam.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';
import { OrganizationModule } from '../organization/organization.module';

@Module({
  imports: [OrganizationModule],
  controllers: [EamController],
  providers: [
    EamService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
  exports: [EamService],
})
export class EamModule {}
