import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { DataService } from './data.service';

@ApiTags('Data Engine')
@Controller('api/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get(':modelName')
  @ApiOperation({ summary: 'Find many records' })
  findMany(
    @Param('modelName') modelName: string,
    @Query() query: Record<string, string | undefined>,
    @Headers('x-cache-bypass') cacheBypass?: string,
  ) {
    const prismaQuery = parseFindManyQuery(query);
    // 缓存绕过: 如果请求头包含 x-cache-bypass=true,则不使用缓存
    // 注: 实际缓存逻辑在 Service 层实现,这里仅做标记传递
    return this.dataService.findMany(modelName, prismaQuery);
  }

  @Get(':modelName/:id')
  @ApiOperation({ summary: 'Find unique record' })
  findUnique(@Param('modelName') modelName: string, @Param('id') id: string) {
    return this.dataService.findUnique(modelName, id);
  }

  @Post(':modelName')
  @ApiOperation({ summary: 'Create record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  create(@Param('modelName') modelName: string, @Body() data: unknown) {
    return this.dataService.create(modelName, data);
  }

  @Patch(':modelName/:id')
  @ApiOperation({ summary: 'Update record' })
  @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  update(
    @Param('modelName') modelName: string,
    @Param('id') id: string,
    @Body() data: unknown,
  ) {
    return this.dataService.update(modelName, id, data);
  }

  @Delete(':modelName/:id')
  @ApiOperation({ summary: 'Delete record' })
  delete(@Param('modelName') modelName: string, @Param('id') id: string) {
    return this.dataService.delete(modelName, id);
  }
}

function parseFindManyQuery(query: Record<string, string | undefined>) {
  const whereFromQuery = safeJsonParse<Record<string, unknown>>(query.where);
  const sortField = query._sort ?? query.sortBy;
  const sortOrder = query._order ?? query.sortOrder;

  const page = toPositiveInt(query._page ?? query.page) ?? 1;
  const limit = toPositiveInt(query._limit ?? query.limit ?? query.take);
  const take = limit;
  const skip = take ? (page - 1) * take : undefined;

  const where: Record<string, unknown> = {
    ...(whereFromQuery ?? {}),
  };

  for (const [key, value] of Object.entries(query)) {
    if (!value) continue;
    if (
      key === 'where' ||
      key === '_page' ||
      key === 'page' ||
      key === '_limit' ||
      key === 'limit' ||
      key === 'take' ||
      key === '_sort' ||
      key === 'sortBy' ||
      key === '_order' ||
      key === 'sortOrder'
    ) {
      continue;
    }
    where[key] = coerceScalar(value);
  }

  const orderBy =
    sortField && typeof sortField === 'string'
      ? {
          [sortField]:
            typeof sortOrder === 'string' && sortOrder.toLowerCase() === 'desc'
              ? 'desc'
              : 'asc',
        }
      : undefined;

  return {
    where: Object.keys(where).length ? where : undefined,
    take,
    skip,
    orderBy,
  };
}

function safeJsonParse<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function toPositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.trunc(n);
  if (i <= 0) return undefined;
  return i;
}

function coerceScalar(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  const n = Number(value);
  if (Number.isFinite(n) && String(n) === value) return n;
  return value;
}
