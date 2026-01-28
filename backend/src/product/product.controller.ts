import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { PaginationQueryDto } from 'src/common/pagination/dto';
import { ProductFilterDto } from 'src/product/dto/product-filter.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createProductDto: CreateProductDto) {
    const result = await this.productService.create(createProductDto);
    return {
      data: result,
      message: 'Product created successfully',
    };
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query() filters: ProductFilterDto,
  ) {
    const options = pagination || {};
    const result = await this.productService.findAll(filters || {}, options);
    return {
      data: result.data,
      meta: result.meta,
      message: 'Products retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.productService.findOne(id);

    return {
      data: result,
      message: 'Product retrieved successfully',
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.productService.update(id, updateProductDto);
    return {
      data: result,
      message: 'Product updated successfully',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('id') id: string) {
    await this.productService.remove(id);
    return {
      data: null,
      message: 'Product removed successfully',
    };
  }
}
