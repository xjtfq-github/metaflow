import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiQueryService } from './ai-query.service';

class TextToQueryDto {
  text: string;
  modelName?: string;
}

@ApiTags('AI')
@Controller('api/ai')
export class AiQueryController {
  constructor(private readonly aiQueryService: AiQueryService) {}

  @Post('text-to-query')
  @ApiOperation({ summary: 'Convert natural language to query JSON' })
  @ApiBody({ type: TextToQueryDto })
  textToQuery(@Body() body: TextToQueryDto) {
    return this.aiQueryService.textToQuery(body);
  }
}
