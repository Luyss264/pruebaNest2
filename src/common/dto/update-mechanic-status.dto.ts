import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { MechanicStatus } from '../types/enums';
export class UpdateMechanicStatusDto {
  @ApiProperty({ enum: MechanicStatus, example: MechanicStatus.INACTIVE })
  @IsEnum(MechanicStatus)
  status!: MechanicStatus;
}
