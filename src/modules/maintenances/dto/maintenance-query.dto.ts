import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MaintenanceStatus } from '../../../common/types/enums';

export class MaintenanceQueryDto {
  @IsOptional() @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  vehicleId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  mechanicId?: number;

  @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean()
  activeOnly?: boolean;
}
