import { Controller, Post, Body } from '@nestjs/common';
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
}
