import { Module } from '@nestjs/common';
import { AppManagerController } from './app-manager.controller';
import { AppManagerService } from './app-manager.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';

@Module({
  controllers: [AppManagerController],
  providers: [
    AppManagerService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
})
export class AppManagerModule {}
