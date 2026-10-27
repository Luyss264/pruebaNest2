import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../../common/types/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Morgan Technician' })
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'morgan.technician@example.com' })
  @IsEmail() @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'TechnicianPass123!' })
  @IsString() @MinLength(8) @MaxLength(72)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TECHNICIAN })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'Morgan Technician', required: false })
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  name?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: true, required: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
