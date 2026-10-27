import { PartialType, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';
import { VehicleStatus } from '../../../common/types/enums';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiProperty({ enum: [VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE], example: VehicleStatus.AVAILABLE, required: false, description: 'IN_MAINTENANCE is managed by maintenance transitions.' })
  @IsOptional() @IsIn([VehicleStatus.AVAILABLE, VehicleStatus.INACTIVE])
  status?: VehicleStatus;
}
