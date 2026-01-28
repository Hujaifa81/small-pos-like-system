import { IsInt, IsOptional, IsString, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { SortOrder } from './types';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: SortOrder;
}
