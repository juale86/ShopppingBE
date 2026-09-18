import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    example: 10,
    description: 'Number of items to return',
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Max(100, { message: 'The limit must not exceed 100' })
  @Min(1, { message: 'The limit must be at least 1' })
  limit: number;

  @ApiProperty({
    example: 10,
    description: 'Number of offset',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0, { message: 'The offset must not be negative' })
  offset: number;
}
