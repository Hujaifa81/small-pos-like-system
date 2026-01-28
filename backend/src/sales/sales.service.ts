/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { paginationHelper } from 'src/common/helpers/pagination.helper';
import type { IPaginationOptions } from 'src/common/pagination/types';
import { SalesFilterDto } from 'src/sales/dto/sales-filter.dto';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  constructor(
    private prisma: PrismaService,
    private redisService?: RedisService,
  ) {}

  private mapSale(sale: any) {
    return {
      id: sale.id,
      userId: sale.userId,
      total: Number(sale.total),
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      items: (sale.items || []).map((it: any) => ({
        id: it.id,
        productId: it.productId,
        quantity: it.quantity,
        price: Number(it.price),
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
      })),
    };
  }

  async create(userId: string, dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sale must contain at least one item');
    }
    const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
    const locks: any[] = [];
    const lockTTL = 2000;

    if (this.redisService && this.redisService.redlock) {
      try {
        const resources = productIds.map((id) => `locks:product:${id}`);
        const lock = await this.redisService.redlock.acquire(
          resources,
          lockTTL,
        );
        locks.push(lock);
        this.logger.log(`Acquired locks for products: ${productIds.join(',')}`);

        const result = await this.createWithTransaction(userId, dto);

        // release lock
        try {
          await lock.release();
        } catch (e) {
          this.logger.warn('Failed to release redlock: ' + String(e));
        }

        return result;
      } catch (e) {
        this.logger.warn(
          'Failed to acquire distributed locks, falling back to transactional retry',
        );
        return this.createWithRetries(userId, dto, 3);
      }
    }

    return this.createWithRetries(userId, dto, 3);
  }

  private async createWithRetries(
    userId: string,
    dto: CreateSaleDto,
    attempts = 3,
  ) {
    let lastErr: any = null;
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.createWithTransaction(userId, dto);
      } catch (err) {
        lastErr = err;
        if (
          err instanceof BadRequestException ||
          err instanceof ConflictException
        )
          throw err;
        this.logger.warn(`Attempt ${i + 1} failed, retrying...`);
      }
    }
    throw lastErr;
  }

  private async createWithTransaction(userId: string, dto: CreateSaleDto) {
    const affectedProductIds: string[] = [];
    const result = await this.prisma.$transaction(async (tx) => {
      const saleItems: Array<any> = [];
      let total = 0;

      for (const it of dto.items) {
        const product = await tx.product.findUnique({
          where: { id: it.productId },
        });
        if (!product)
          throw new BadRequestException(`Product not found: ${it.productId}`);
        if (product.stockQuantity < it.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.id}`,
          );
        }

        // decrement stock
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: product.stockQuantity - it.quantity },
        });
        affectedProductIds.push(product.id);

        const priceNum = Number(product.price);
        total += priceNum * it.quantity;

        saleItems.push({
          productId: product.id,
          quantity: it.quantity,
          price: product.price,
        });
      }

      const created = await tx.sale.create({
        data: {
          userId: userId ?? undefined,
          total: total,
          items: {
            create: saleItems.map((s) => ({
              productId: s.productId,
              quantity: s.quantity,
              price: s.price,
            })),
          },
        },
        include: { items: true },
      });

      return created;
    });

    // Invalidate cached product entries for affected products
    try {
      for (const pid of affectedProductIds) {
        await this.redisService?.del(`product:${pid}`);
      }
    } catch (e) {
      this.logger.warn('Failed to invalidate product cache: ' + String(e));
    }

    return this.mapSale(result);
  }

  async findAllForMine(
    userId: string,
    options: IPaginationOptions = {},
    filters: Partial<SalesFilterDto> = {},
  ) {
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(options);

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) orderBy[sortBy] = (sortOrder as 'asc' | 'desc') || 'asc';

    const take = Math.min(limit, 100);

    const where: any = { userId };

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.minTotal || filters.maxTotal) {
      where.total = {};
      if (filters.minTotal !== undefined)
        where.total.gte = Number(filters.minTotal);
      if (filters.maxTotal !== undefined)
        where.total.lte = Number(filters.maxTotal);
    }

    // If filtering by productId, require sale to have at least one item with that product
    if (filters.productId) {
      where.items = { some: { productId: filters.productId } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        include: { items: true },
        skip,
        take,
        orderBy,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const mapped = items.map((s) => this.mapSale(s));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / take) },
    };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return null;
    return this.mapSale(sale);
  }

  async findAll(
    options: IPaginationOptions = {},
    filters: Partial<SalesFilterDto> = {},
  ) {
    const { page, limit, skip, sortBy, sortOrder } =
      paginationHelper.calculatePagination(options);

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy) orderBy[sortBy] = (sortOrder as 'asc' | 'desc') || 'asc';

    const take = Math.min(limit, 100);

    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.minTotal || filters.maxTotal) {
      where.total = {};
      if (filters.minTotal !== undefined)
        where.total.gte = Number(filters.minTotal);
      if (filters.maxTotal !== undefined)
        where.total.lte = Number(filters.maxTotal);
    }

    if (filters.productId) {
      where.items = { some: { productId: filters.productId } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        include: { items: true },
        skip,
        take,
        orderBy,
      }),
      this.prisma.sale.count({ where }),
    ]);

    const mapped = items.map((s) => this.mapSale(s));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / take) },
    };
  }
}
