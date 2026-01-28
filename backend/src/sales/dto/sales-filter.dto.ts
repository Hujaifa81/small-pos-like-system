import { IsOptional, IsUUID, IsISO8601, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesFilterDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxTotal?: number;
}
