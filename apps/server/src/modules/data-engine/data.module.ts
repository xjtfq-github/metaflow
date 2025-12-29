import { Module } from '@nestjs/common';
// import { DataController } from './data.controller'; // 暂时注释掉，使用DataManagerController
import { DataService } from './data.service';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';
import { CacheService } from '../../common/cache.service';

@Module({
  controllers: [], // 移除DataController，避免与DataManagerController路由冲突
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
