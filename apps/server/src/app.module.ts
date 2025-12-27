import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppManagerModule } from './modules/app-manager/app-manager.module';
import { DataModule } from './modules/data-engine/data.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { SchemaManagerModule } from './modules/schema-manager/schema-manager.module';
import { VersionModule } from './modules/version/version.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { EamModule } from './modules/eam/eam.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { FaasModule } from './modules/faas/faas.module';
import { CodegenModule } from './modules/codegen/codegen.module';
import { TenantContextMiddleware } from './common/middlewares/tenant-context.middleware';
import { ContextMiddleware } from './common/middlewares/context.middleware';
import { CacheController } from './common/cache.controller';
import { CacheService } from './common/cache.service';
import { PerformanceController } from './common/performance.controller';
import { PerformanceService } from './common/performance.service';
import { ObservabilityController } from './common/observability.controller';

@Module({
  imports: [
    AppManagerModule, 
    DataModule, 
    CopilotModule, 
    SchemaManagerModule,
    VersionModule,
    OrganizationModule,
    EamModule,
    TenantModule,
    // FaasModule, // 临时禁用，isolated-vm编译问题
    CodegenModule,
  ],
  controllers: [AppController, CacheController, PerformanceController, ObservabilityController],
  providers: [AppService, CacheService, PerformanceService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware, TenantContextMiddleware)
      .forRoutes('*');
  }
}
