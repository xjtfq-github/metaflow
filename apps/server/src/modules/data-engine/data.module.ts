import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';
import { CacheService } from '../../common/cache.service';

@Module({
  controllers: [DataController],
  providers: [
    DataService,
    PrismaService,
    CacheService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
})
export class DataModule {}
