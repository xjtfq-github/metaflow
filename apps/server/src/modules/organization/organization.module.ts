import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { RoleService } from './role.service';
import { PolicyService } from './policy.service';
import { OrganizationController } from './organization.controller';
import { PrismaService } from '../../common/prisma.service';
import { PrismaClient } from '@metaflow/database';

@Module({
  controllers: [OrganizationController],
  providers: [
    DepartmentService,
    RoleService,
    PolicyService,
    PrismaService,
    {
      provide: PrismaClient,
      useExisting: PrismaService,
    },
  ],
  exports: [DepartmentService, RoleService, PolicyService]
})
export class OrganizationModule {}