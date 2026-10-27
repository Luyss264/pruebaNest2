import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { MaintenanceStatus } from '../../../common/types/enums';

export class UpdateMaintenanceStatusDto {
  @ApiProperty({ enum: MaintenanceStatus, example: MaintenanceStatus.IN_PROGRESS })
  @IsEnum(MaintenanceStatus)
  status!: MaintenanceStatus;

  @ApiProperty({ example: 'Replaced filters, changed oil, and inspected the engine.', required: false })
  @IsOptional() @IsString() @MinLength(5) @MaxLength(5000)
  workPerformed?: string;

  @ApiProperty({ example: 350000, minimum: 0, required: false })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999.99)
  finalCost?: number;

  @ApiProperty({ example: '2027-01-15T15:10:00.000Z', required: false })
  @IsOptional() @IsDateString()
  finishedAt?: string;

  @ApiProperty({ example: 45500, minimum: 0, required: false })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 0 }) @Min(0)
  finalMileage?: number;
}
