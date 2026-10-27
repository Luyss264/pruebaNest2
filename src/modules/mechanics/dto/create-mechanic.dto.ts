import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { MechanicStatus } from '../../../common/types/enums';

export class CreateMechanicDto {
  @ApiProperty({ example: 'Carlos Perez' })
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'carlos.perez@example.com' })
  @IsEmail() @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'Heavy-duty diesel engines' })
  @IsString() @MinLength(2) @MaxLength(120)
  specialty!: string;

  @ApiProperty({ enum: MechanicStatus, example: MechanicStatus.ACTIVE, required: false })
  @IsOptional() @IsEnum(MechanicStatus)
  status?: MechanicStatus;

  @ApiProperty({ example: 2, required: false, description: 'Optional active TECHNICIAN user account to link.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  userId?: number;
}
