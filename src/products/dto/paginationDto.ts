import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset: number;
}
