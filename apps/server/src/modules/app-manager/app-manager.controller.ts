import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
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
  create(@Body() createAppDto: CreateAppDto) {
    return this.appManagerService.create(createAppDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all applications' })
  @ApiResponse({
    status: 200,
    description: 'Return all apps.',
    type: [AppResponseDto],
  })
  findAll() {
    return this.appManagerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the app.',
    type: AppResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.appManagerService.findOne(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish application' })
  @ApiResponse({
    status: 200,
    description: 'The app has been published.',
    type: AppResponseDto,
  })
  publish(@Param('id') id: string) {
    return this.appManagerService.publish(id);
  }
}
