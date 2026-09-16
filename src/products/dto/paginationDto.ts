import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
      example: 10,
      description: 'Number of items to return',
      default: 10
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit: number;

  @ApiProperty({
      example: 10,
      description: 'Number of offset',
      default: 0
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset: number;
}
