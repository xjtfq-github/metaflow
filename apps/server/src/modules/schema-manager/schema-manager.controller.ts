import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SchemaDiffService } from './schema-diff.service';
import type { ModelDSL } from '@metaflow/shared-types';

class DiffRequestDto {
  currentModel: ModelDSL;
  newModel: ModelDSL;
}

@ApiTags('Schema Manager')
@Controller('api/schema')
export class SchemaManagerController {
  private schemas: Map<string, ModelDSL> = new Map();

  constructor(private readonly schemaDiffService: SchemaDiffService) {}

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
  create(@Body() body: ModelDSL) {
    this.schemas.set(body.entityName, body);
    return {
      success: true,
      data: {
        id: body.entityName,
        name: body.entityName,
        label: body.entityName,
        description: body.description,
        fields: body.fields,
        timestamps: true,
        tenantIsolation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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
  update(@Param('id') id: string, @Body() body: ModelDSL) {
    if (!this.schemas.has(id)) {
      return {
        success: false,
        message: 'Schema not found',
      };
    }
    this.schemas.set(id, body);
    return {
      success: true,
      data: {
        id: body.entityName,
        name: body.entityName,
        label: body.entityName,
        description: body.description,
        fields: body.fields,
        timestamps: true,
        tenantIsolation: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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
