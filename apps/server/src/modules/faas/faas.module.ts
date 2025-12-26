import { Module } from '@nestjs/common';
import { PrismaClient } from '@metaflow/database';
import { FaasController } from './faas.controller';
import { FaasService } from './faas.service';

@Module({
  controllers: [FaasController],
  providers: [
    FaasService,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [FaasService],
})
export class FaasModule {}
