import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaClient } from '@metaflow/database';
import { getTenantId } from '../../common/tenant-context';

interface DataRecord {
  id: string;
  [key: string]: any;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('Data Manager')
@Controller('api/data')
export class DataManagerController {
  constructor(private readonly prisma: PrismaClient) {}

  @Get(':modelName')
  @ApiOperation({ summary: 'Get all records for a model' })
  async findAll(@Param('modelName') modelName: string) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找数据模型
    const model = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: modelName },
    });
    
    if (!model) {
      return {
        success: true,
        data: [],
      };
    }
    
    // 获取所有记录
    const records = await this.prisma.dynamicRecord.findMany({
      where: { tenantId, modelId: model.id },
      orderBy: { createdAt: 'desc' },
    });
    
    // 解析JSON数据
    const data = records.map(record => ({
      id: record.id,
      ...JSON.parse(record.data),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
    
    return {
      success: true,
      data,
    };
  }

  @Get(':modelName/:id')
  @ApiOperation({ summary: 'Get a record by id' })
  async findOne(@Param('modelName') modelName: string, @Param('id') id: string) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找数据模型
    const model = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: modelName },
    });
    
    if (!model) {
      return {
        success: false,
        message: `Model ${modelName} not found`,
      };
    }
    
    // 查找记录
    const record = await this.prisma.dynamicRecord.findFirst({
      where: { id, tenantId, modelId: model.id },
    });
    
    if (!record) {
      return {
        success: false,
        message: `Record ${id} not found`,
      };
    }
    
    return {
      success: true,
      data: {
        id: record.id,
        ...JSON.parse(record.data),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  @Post(':modelName')
  @ApiOperation({ summary: 'Create a new record' })
  async create(@Param('modelName') modelName: string, @Body() body: any) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找数据模型
    const model = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: modelName },
    });
    
    if (!model) {
      throw new NotFoundException(`Model ${modelName} not found`);
    }
    
    // 从 body 中移除 id, createdAt, updatedAt 等系统字段
    const { id, createdAt, updatedAt, ...data } = body;
    
    // 创建记录
    const record = await this.prisma.dynamicRecord.create({
      data: {
        tenantId,
        modelId: model.id,
        data: JSON.stringify(data),
      },
    });
    
    return {
      success: true,
      data: {
        id: record.id,
        ...JSON.parse(record.data),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  @Put(':modelName/:id')
  @ApiOperation({ summary: 'Update a record' })
  async update(
    @Param('modelName') modelName: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找数据模型
    const model = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: modelName },
    });
    
    if (!model) {
      throw new NotFoundException(`Model ${modelName} not found`);
    }
    
    // 查找记录
    const existing = await this.prisma.dynamicRecord.findFirst({
      where: { id, tenantId, modelId: model.id },
    });
    
    if (!existing) {
      throw new NotFoundException(`Record ${id} not found`);
    }
    
    // 从 body 中移除系统字段
    const { id: _, createdAt, updatedAt, ...newData } = body;
    
    // 合并现有数据
    const existingData = JSON.parse(existing.data);
    const mergedData = { ...existingData, ...newData };
    
    // 更新记录
    const record = await this.prisma.dynamicRecord.update({
      where: { id },
      data: {
        data: JSON.stringify(mergedData),
      },
    });
    
    return {
      success: true,
      data: {
        id: record.id,
        ...JSON.parse(record.data),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  }

  @Delete(':modelName/:id')
  @ApiOperation({ summary: 'Delete a record' })
  async remove(@Param('modelName') modelName: string, @Param('id') id: string) {
    const tenantId = getTenantId() ?? 'tenant-1';
    
    // 查找数据模型
    const model = await this.prisma.dataModel.findFirst({
      where: { tenantId, entityName: modelName },
    });
    
    if (!model) {
      throw new NotFoundException(`Model ${modelName} not found`);
    }
    
    // 查找记录
    const existing = await this.prisma.dynamicRecord.findFirst({
      where: { id, tenantId, modelId: model.id },
    });
    
    if (!existing) {
      throw new NotFoundException(`Record ${id} not found`);
    }
    
    // 删除记录
    await this.prisma.dynamicRecord.delete({
      where: { id },
    });
    
    return {
      success: true,
      message: 'Record deleted successfully',
    };
  }
}
