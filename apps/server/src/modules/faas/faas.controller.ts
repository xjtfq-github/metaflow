import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FaasService } from './faas.service';

@Controller('faas')
@ApiTags('FaaS')
export class FaasController {
  constructor(private readonly faasService: FaasService) {}

  // ========== 脚本管理 ==========

  @Post('scripts')
  @ApiOperation({ summary: '创建自定义脚本' })
  async createScript(@Body() dto: any) {
    const script = await this.faasService.createScript(dto);
    return { success: true, data: script };
  }

  @Get('scripts')
  @ApiOperation({ summary: '获取脚本列表' })
  async listScripts(
    @Query('tenantId') tenantId: string,
    @Query('enabled') enabled?: string
  ) {
    const scripts = await this.faasService.listScripts(tenantId, {
      enabled: enabled === 'true',
    });
    return { success: true, data: scripts };
  }

  @Get('scripts/:id')
  @ApiOperation({ summary: '获取脚本详情' })
  async getScript(@Param('id') id: string) {
    const script = await this.faasService.getScript(id);
    return { success: true, data: script };
  }

  @Put('scripts/:id')
  @ApiOperation({ summary: '更新脚本' })
  async updateScript(@Param('id') id: string, @Body() dto: any) {
    const script = await this.faasService.updateScript(id, dto);
    return { success: true, data: script };
  }

  @Delete('scripts/:id')
  @ApiOperation({ summary: '删除脚本' })
  async deleteScript(@Param('id') id: string) {
    await this.faasService.deleteScript(id);
    return { success: true };
  }

  @Post('scripts/:id/execute')
  @ApiOperation({ summary: '执行脚本' })
  async executeScript(
    @Param('id') id: string,
    @Body() dto: { input?: any; triggeredBy?: string }
  ) {
    const result = await this.faasService.executeScript(
      id,
      dto.input,
      dto.triggeredBy
    );
    return { success: true, data: result };
  }

  @Get('scripts/:id/executions')
  @ApiOperation({ summary: '获取脚本执行历史' })
  async getExecutions(
    @Param('id') id: string,
    @Query('limit') limit?: string
  ) {
    const executions = await this.faasService.getExecutions(
      id,
      limit ? parseInt(limit) : 50
    );
    return { success: true, data: executions };
  }

  // ========== Webhook ==========

  @Post('webhooks')
  @ApiOperation({ summary: '创建Webhook' })
  async createWebhook(@Body() dto: any) {
    const webhook = await this.faasService.createWebhook(dto);
    return { success: true, data: webhook };
  }

  @Get('webhooks')
  @ApiOperation({ summary: '获取Webhook列表' })
  async listWebhooks(@Query('tenantId') tenantId: string) {
    const webhooks = await this.faasService.listWebhooks(tenantId);
    return { success: true, data: webhooks };
  }

  @Post('webhooks/handle')
  @ApiOperation({ summary: '处理Webhook请求' })
  async handleWebhook(@Body() dto: any) {
    const result = await this.faasService.handleWebhookRequest(
      dto.url,
      dto.method,
      dto.headers,
      dto.body,
      dto.query
    );
    return { success: true, data: result };
  }

  // ========== 连接器 ==========

  @Post('connectors')
  @ApiOperation({ summary: '创建连接器' })
  async createConnector(@Body() dto: any) {
    const connector = await this.faasService.createConnector(dto);
    return { success: true, data: connector };
  }

  @Get('connectors')
  @ApiOperation({ summary: '获取连接器列表' })
  async listConnectors(
    @Query('tenantId') tenantId: string,
    @Query('type') type?: string
  ) {
    const connectors = await this.faasService.listConnectors(tenantId, type);
    return { success: true, data: connectors };
  }

  @Post('connectors/:id/test')
  @ApiOperation({ summary: '测试连接器' })
  async testConnector(@Param('id') id: string) {
    const result = await this.faasService.testConnector(id);
    return { success: true, data: result };
  }
}
