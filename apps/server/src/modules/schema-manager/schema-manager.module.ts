import { Module } from '@nestjs/common';
import { SchemaManagerController } from './schema-manager.controller';
import { SchemaDiffService } from './schema-diff.service';

@Module({
  controllers: [SchemaManagerController],
  providers: [SchemaDiffService],
  exports: [SchemaDiffService],
})
export class SchemaManagerModule {}
