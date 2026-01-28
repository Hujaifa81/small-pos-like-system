import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { PaginationQueryDto } from 'src/common/pagination/dto';
import { SalesFilterDto } from 'src/sales/dto/sales-filter.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() dto: CreateSaleDto) {
    const result = await this.salesService.create(user?.id, dto);
    return { data: result, message: 'Sale created successfully' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async mine(
    @CurrentUser() user: any,
    @Query() pagination: PaginationQueryDto,
    @Query() filters: SalesFilterDto,
  ) {
    const options = pagination || {};
    const result = await this.salesService.findAllForMine(
      user?.id,
      options,
      filters || {},
    );
    return {
      data: result.data,
      meta: result.meta,
      message: 'Sales retrieved successfully',
    };
  }

  @Get(':id')
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: SalesFilterDto,
  ) {
    const options = pagination || {};
    const result = await this.salesService.findAll(options, filters || {});
    return {
      data: result.data,
      meta: result.meta,
      message: 'All sales retrieved successfully',
    };
  }
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const result = await this.salesService.findOne(id);
    return { data: result, message: 'Sale retrieved successfully' };
  }
}
