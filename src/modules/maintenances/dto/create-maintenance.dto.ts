import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { MaintenanceType } from '../../../common/types/enums';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1)
  vehicleId!: number;

  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1)
  mechanicId!: number;

  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1)
  workshopId!: number;

  @ApiProperty({ enum: MaintenanceType, example: MaintenanceType.PREVENTIVE })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty({ example: 'Scheduled engine oil and filter replacement.' })
  @IsString() @MinLength(5) @MaxLength(3000)
  description!: string;

  @ApiProperty({ example: 45000, minimum: 0 }) @Type(() => Number) @IsInt() @Min(0)
  mileage!: number;

  @ApiProperty({ example: '2027-01-15T13:30:00.000Z' }) @IsDateString()
  scheduledStartAt!: string;

  @ApiProperty({ example: '2027-01-15T15:00:00.000Z' }) @IsDateString()
  scheduledEndAt!: string;

  @ApiProperty({ example: 'FLEET-WO-2027-0001', required: false, description: 'Optional unique external reference.' })
  @IsOptional() @IsString() @MaxLength(80)
  referenceCode?: string;
}
