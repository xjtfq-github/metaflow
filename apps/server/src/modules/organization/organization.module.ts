import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { RoleService } from './role.service';
import { PolicyService } from './policy.service';
import { OrganizationController } from './organization.controller';

@Module({
  controllers: [OrganizationController],
  providers: [DepartmentService, RoleService, PolicyService],
  exports: [DepartmentService, RoleService, PolicyService]
})
export class OrganizationModule {}