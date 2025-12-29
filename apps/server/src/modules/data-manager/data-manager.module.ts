import { Module } from '@nestjs/common';
import { DataManagerController } from './data-manager.controller';
import { PrismaClient } from '@metaflow/database';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [DataManagerController],
  providers: [
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
})
export class DataManagerModule {}
