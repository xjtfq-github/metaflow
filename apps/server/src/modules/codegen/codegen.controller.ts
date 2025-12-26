import { Controller, Post, Get, Body, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CodegenService } from './codegen.service';
import type { Response } from 'express';

@Controller('codegen')
@ApiTags('代码生成')
export class CodegenController {
  constructor(private readonly codegenService: CodegenService) {}

  @Post('component')
  @ApiOperation({ summary: '生成组件代码' })
  async generateComponent(@Body() dto: { component: any; name: string }) {
    const code = await this.codegenService.generateComponentCode(
      dto.component,
      dto.name
    );
    return {
      success: true,
      data: { code },
    };
  }

  @Post('page/:pageId')
  @ApiOperation({ summary: '生成页面代码' })
  async generatePage(@Param('pageId') pageId: string) {
    const code = await this.codegenService.generatePageCode(pageId);
    return {
      success: true,
      data: { code },
    };
  }

  @Post('project/:appId')
  @ApiOperation({ summary: '生成项目代码' })
  async generateProject(@Param('appId') appId: string) {
    const files = await this.codegenService.generateProject(appId);
    
    // 转换 Map 为对象
    const fileObj: Record<string, string> = {};
    files.forEach((content, path) => {
      fileObj[path] = content;
    });

    return {
      success: true,
      data: { files: fileObj },
    };
  }

  @Get('export/:appId')
  @ApiOperation({ summary: '导出项目为ZIP' })
  async exportProject(
    @Param('appId') appId: string,
    @Res() res: Response
  ) {
    const buffer = await this.codegenService.exportProjectAsZip(appId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${appId}.json"`);
    res.send(buffer);
  }
}
