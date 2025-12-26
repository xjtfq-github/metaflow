import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CopilotService } from './copilot.service';

class TextToQueryDto {
  modelName: string;
  naturalLanguage: string;
  schema?: any;
}

class GenerateSchemaDto {
  description: string;
}

class GeneratePageDto {
  description: string;
}

class CodeCompletionDto {
  context: string;
  partialCode: string;
}

class DiagnoseErrorDto {
  error: string;
  code?: string;
}

@Controller('copilot')
@ApiTags('AI Copilot')
export class CopilotController {
  constructor(private readonly copilotService: CopilotService) {}

  @Post('text-to-query')
  @ApiOperation({ summary: '自然语言转查询条件' })
  async textToQuery(@Body() dto: TextToQueryDto) {
    const query = await this.copilotService.textToQuery(
      dto.modelName,
      dto.naturalLanguage,
      dto.schema
    );
    return {
      success: true,
      data: query,
    };
  }

  @Post('generate-schema')
  @ApiOperation({ summary: 'AI生成数据模型Schema' })
  async generateSchema(@Body() dto: GenerateSchemaDto) {
    const schema = await this.copilotService.generateSchema(dto.description);
    return {
      success: true,
      data: schema,
    };
  }

  @Post('generate-page')
  @ApiOperation({ summary: 'AI生成页面布局' })
  async generatePage(@Body() dto: GeneratePageDto) {
    const layout = await this.copilotService.generatePageLayout(dto.description);
    return {
      success: true,
      data: layout,
    };
  }

  @Post('code-completion')
  @ApiOperation({ summary: '代码补全建议' })
  async codeCompletion(@Body() dto: CodeCompletionDto) {
    const suggestions = await this.copilotService.codeCompletion(
      dto.context,
      dto.partialCode
    );
    return {
      success: true,
      data: suggestions,
    };
  }

  @Post('diagnose-error')
  @ApiOperation({ summary: '错误诊断和修复建议' })
  async diagnoseError(@Body() dto: DiagnoseErrorDto) {
    const result = await this.copilotService.diagnoseError(
      dto.error,
      dto.code
    );
    return {
      success: true,
      data: result,
    };
  }
}
