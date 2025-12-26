import { Module } from '@nestjs/common';
import { PrismaClient } from '@metaflow/database';
import { CodegenController } from './codegen.controller';
import { CodegenService } from './codegen.service';

@Module({
  controllers: [CodegenController],
  providers: [
    CodegenService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [CodegenService],
})
export class CodegenModule {}
