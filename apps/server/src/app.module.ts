import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppManagerModule } from './modules/app-manager/app-manager.module';
import { DataModule } from './modules/data-engine/data.module';
import { AiQueryModule } from './modules/ai-query/ai-query.module';
import { SchemaManagerModule } from './modules/schema-manager/schema-manager.module';
import { TenantContextMiddleware } from './common/middlewares/tenant-context.middleware';
import { ContextMiddleware } from './common/middlewares/context.middleware';
import { CacheController } from './common/cache.controller';
import { CacheService } from './common/cache.service';

@Module({
  imports: [AppManagerModule, DataModule, AiQueryModule, SchemaManagerModule],
  controllers: [AppController, CacheController],
  providers: [AppService, CacheService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware, TenantContextMiddleware)
      .forRoutes('*');
  }
}
