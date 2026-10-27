import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WorkshopStatus } from '../types/enums';
export class UpdateWorkshopStatusDto {
  @ApiProperty({ enum: WorkshopStatus, example: WorkshopStatus.INACTIVE })
  @IsEnum(WorkshopStatus)
  status!: WorkshopStatus;
}
