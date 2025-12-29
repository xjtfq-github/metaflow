import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SchemaDiffService } from './schema-diff.service';
import type { ModelDSL } from '@metaflow/shared-types';
import { PrismaClient } from '@metaflow/database';
import { getTenantId } from '../../common/tenant-context';

class DiffRequestDto {
  currentModel: ModelDSL;
  newModel: ModelDSL;
}

@ApiTags('Schema Manager')
@Controller('api/schema')
export class SchemaManagerController {
  // 内存缓存，用于快速访问
  private schemas: Map<string, ModelDSL> = new Map();

  constructor(
    private readonly schemaDiffService: SchemaDiffService,
    private readonly prisma: PrismaClient,
  ) {
    // 初始化时从数据库加载
    this.loadSchemasFromDB();
  }

  private async loadSchemasFromDB() {
    const tenantId = getTenantId() ?? 'tenant-1';
    const models = await this.prisma.dataModel.findMany({
      where: { tenantId, status: 'active' },
    });
    
    for (const model of models) {
      const schema: ModelDSL = {
        id: model.entityName,
        entityName: model.entityName,
        displayName: model.displayName,
        description: model.description || '',
        fields: JSON.parse(model.fields),
        version: model.version,
        timestamps: model.timestamps,
        relations: [],
      };
      this.schemas.set(model.entityName, schema);
    }
  }

  @Post('diff')
  @ApiOperation({ summary: 'Calculate schema diff and generate migration SQL' })
  @ApiBody({ type: DiffRequestDto })
  calculateDiff(@Body() body: DiffRequestDto) {
    const diff = this.schemaDiffService.calculateDiff(
      body.currentModel,
      body.newModel,
    );

    const tableName = body.newModel.entityName;
    const migrationSQL = this.schemaDiffService.generateMigrationSQL(
      tableName,
      diff,
    );

    const safety = this.schemaDiffService.validateSafety(migrationSQL);

    return {
      diff,
      migrationSQL,
      safety,
      summary: {
        addedFields: diff.addedFields.length,
        removedFields: diff.removedFields.length,
        modifiedFields: diff.modifiedFields.length,
        totalChanges:
          diff.addedFields.length +
          diff.removedFields.length +
          diff.modifiedFields.length,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all schemas' })
  getAll() {
    return {
      success: true,
      data: Array.from(this.schemas.values()).map(schema => ({
        id: schema.entityName,
        name: schema.entityName,
        label: schema.entityName,
        description: schema.description,
        fields: schema.fields,
        timestamps: true,
        tenantIsolation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new schema' })
  async create(@Body() body: ModelDSL) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 保存到数据库
    const model = await this.prisma.dataModel.create({
      data: {
        tenantId,
        entityName: body.entityName,
        displayName: body.displayName || body.entityName,
        description: body.description || '',
        fields: JSON.stringify(body.fields || []),
        version: body.version || '1.0.0',
        timestamps: body.timestamps ?? true,
        status: 'active',
      },
    });
    
    // 更新缓存
    this.schemas.set(body.entityName, body);
    
    return {
      success: true,
      data: {
        id: model.entityName,
        name: model.entityName,
        label: model.displayName,
        description: model.description,
        fields: JSON.parse(model.fields),
        timestamps: model.timestamps,
        tenantIsolation: true,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schema by id' })
  getOne(@Param('id') id: string) {
    const schema = this.schemas.get(id);
    if (!schema) {
      return {
        success: false,
        message: 'Schema not found',
      };
    }
    return {
      success: true,
      data: {
        id: schema.entityName,
        name: schema.entityName,
        label: schema.entityName,
        description: schema.description,
        fields: schema.fields,
        timestamps: true,
        tenantIsolation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update schema' })
  async update(@Param('id') id: string, @Body() body: ModelDSL) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找现有模型
    const existing = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: id },
    });
    
    if (!existing) {
      return {
        success: false,
        message: 'Schema not found',
      };
    }
    
    // 更新数据库
    const model = await this.prisma.dataModel.update({
      where: { id: existing.id },
      data: {
        displayName: body.displayName || body.entityName,
        description: body.description || '',
        fields: JSON.stringify(body.fields || []),
        version: body.version || '1.0.0',
        timestamps: body.timestamps ?? true,
      },
    });
    
    // 更新缓存
    this.schemas.set(id, body);
    
    return {
      success: true,
      data: {
        id: model.entityName,
        name: model.entityName,
        label: model.displayName,
        description: model.description,
        fields: JSON.parse(model.fields),
        timestamps: model.timestamps,
        tenantIsolation: true,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete schema' })
  delete(@Param('id') id: string) {
    if (!this.schemas.has(id)) {
      return {
        success: false,
        message: 'Schema not found',
      };
    }
    this.schemas.delete(id);
    return {
      success: true,
      message: 'Schema deleted successfully',
    };
  }
}
