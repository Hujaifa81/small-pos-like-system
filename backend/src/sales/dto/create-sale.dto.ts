import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class CreateSaleDto {
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  @ArrayMinSize(1)
  items: CreateSaleItemDto[];
}
