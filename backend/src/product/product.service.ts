/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RedisService } from 'src/common/redis/redis.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { paginationHelper } from 'src/common/helpers/pagination.helper';
import type { Prisma } from '../generated/prisma';
import type { ProductFilterDto } from './dto/product-filter.dto';
import type { IPaginationOptions } from 'src/common/pagination/types';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private redisService?: RedisService,
  ) {}

  private mapProduct(product: any) {
    if (!product) return product;
    const price =
      product.price && typeof product.price?.toNumber === 'function'
        ? product.price.toNumber()
        : Number(product.price);

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price,
      stockQuantity:
        typeof product.stockQuantity === 'number'
          ? product.stockQuantity
          : Number(product.stockQuantity),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.prisma.product.create({
        data: {
          name: createProductDto.name,
          sku: createProductDto.sku,
          price: Number(createProductDto.price),
          stockQuantity: createProductDto.stockQuantity,
        },
      });
      return this.mapProduct(product);
    } catch (err) {
      const e = err;
      if (e?.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  async findAll(
    filters: Partial<ProductFilterDto> = {},
    options: IPaginationOptions = {},
  ) {
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(options);

    const where: Prisma.ProductWhereInput = {};
    const and: Prisma.ProductWhereInput[] = [];

    if (filters.search) {
      and.push({
        OR: [
          { name: { contains: String(filters.search), mode: 'insensitive' } },
          { sku: { contains: String(filters.search), mode: 'insensitive' } },
        ],
      });
    }

    if (filters.sku) {
      and.push({ sku: String(filters.sku) });
    }

    if (filters.minPrice) {
      and.push({ price: { gte: Number(filters.minPrice) } });
    }

    if (filters.maxPrice) {
      and.push({ price: { lte: Number(filters.maxPrice) } });
    }

    if (filters.inStockOnly) {
      and.push({ stockQuantity: { gt: 0 } });
    }

    if (and.length > 0) where.AND = and;

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) orderBy[sortBy] = (sortOrder as 'asc' | 'desc') || 'asc';

    const take = Math.min(limit, 100);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, skip, take, orderBy }),
      this.prisma.product.count({ where }),
    ]);

    const mapped = items.map((it) => this.mapProduct(it));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / take) },
    };
  }

  async findOne(id: string) {
    const cacheKey = `product:${id}`;
    try {
      const cached = await this.redisService?.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }

    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    const mapped = this.mapProduct(product);
    try {
      await this.redisService?.set(cacheKey, mapped, 60);
    } catch (e) {
      console.error(e);
    }
    return mapped;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          ...(updateProductDto.price !== undefined
            ? { ...updateProductDto, price: Number(updateProductDto.price) }
            : updateProductDto),
        },
      });
      const mapped = this.mapProduct(product);
      try {
        await this.redisService?.del(`product:${id}`);
      } catch (e) {
        console.error(e);
      }
      return mapped;
    } catch (err) {
      const e = err;
      if (e?.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      if (e?.code === 'P2002') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.product.delete({ where: { id } });
      try {
        await this.redisService?.del(`product:${id}`);
      } catch (e) {
        console.error(e);
      }
      return null;
    } catch (err) {
      const e = err;
      if (e?.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}
