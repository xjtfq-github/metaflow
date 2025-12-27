import { Controller, Get, Post, Put, Delete, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateAppDto } from './dto/create-app.dto';
import { AppResponseDto } from './dto/app-response.dto';
import { AppManagerService } from './app-manager.service';

@ApiTags('Apps')
@Controller('apps')
export class AppManagerController {
  constructor(private readonly appManagerService: AppManagerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new application' })
  @ApiResponse({
    status: 201,
    description: 'The app has been successfully created.',
    type: AppResponseDto,
  })
  async create(@Body() createAppDto: CreateAppDto) {
    const data = await this.appManagerService.create(createAppDto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List all applications' })
  @ApiResponse({
    status: 200,
    description: 'Return all apps.',
    type: [AppResponseDto],
  })
  async findAll() {
    const data = await this.appManagerService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the app.',
    type: AppResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const data = await this.appManagerService.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update application' })
  @ApiResponse({
    status: 200,
    description: 'The app has been successfully updated.',
    type: AppResponseDto,
  })
  async update(@Param('id') id: string, @Body() updateAppDto: CreateAppDto) {
    const data = await this.appManagerService.update(id, updateAppDto);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application' })
  @ApiResponse({
    status: 200,
    description: 'The app has been successfully deleted.',
  })
  async delete(@Param('id') id: string) {
    const data = await this.appManagerService.delete(id);
    return data;
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish application' })
  @ApiResponse({
    status: 200,
    description: 'The app has been published.',
    type: AppResponseDto,
  })
  async publish(@Param('id') id: string) {
    const data = await this.appManagerService.publish(id);
    return { success: true, data };
  }
}
