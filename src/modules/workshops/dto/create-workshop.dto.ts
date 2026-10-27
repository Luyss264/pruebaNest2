import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkshopStatus } from '../../../common/types/enums';

export class CreateWorkshopDto {
  @ApiProperty({ example: 'Central Workshop' })
  @IsString() @MinLength(2) @MaxLength(140)
  name!: string;

  @ApiProperty({ example: '123 Industrial Avenue, Barranquilla' })
  @IsString() @MinLength(5) @MaxLength(240)
  address!: string;

  @ApiProperty({ enum: WorkshopStatus, example: WorkshopStatus.ACTIVE, required: false })
  @IsOptional() @IsEnum(WorkshopStatus)
  status?: WorkshopStatus;
}
