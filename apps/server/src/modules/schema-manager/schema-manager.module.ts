import { Module } from '@nestjs/common';
import { SchemaManagerController } from './schema-manager.controller';
import { SchemaDiffService } from './schema-diff.service';
import { PrismaClient } from '@metaflow/database';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [SchemaManagerController],
  providers: [
    SchemaDiffService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
  exports: [SchemaDiffService],
})
export class SchemaManagerModule {}
