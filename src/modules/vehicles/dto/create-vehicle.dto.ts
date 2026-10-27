import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC123', description: 'Unique fleet plate.' })
  @Transform(({ value }) => String(value ?? '').trim().toUpperCase())
  @IsString() @MinLength(3) @MaxLength(20) @Matches(/^[A-Z0-9-]+$/)
  plate!: string;

  @ApiProperty({ example: 'Chevrolet' })
  @IsString() @MinLength(1) @MaxLength(80)
  brand!: string;

  @ApiProperty({ example: 'NPR' })
  @IsString() @MinLength(1) @MaxLength(100)
  model!: string;

  @ApiProperty({ example: 2023, minimum: 1950, maximum: 2100 })
  @Type(() => Number) @IsInt() @Min(1950) @Max(2100)
  year!: number;

  @ApiProperty({ example: 45000, minimum: 0 })
  @Type(() => Number) @IsInt() @Min(0)
  mileage!: number;
}
