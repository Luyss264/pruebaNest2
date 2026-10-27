import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jordan Technician', maxLength: 120 })
  @IsString() @MinLength(2) @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'jordan.technician@example.com' })
  @IsEmail() @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8, description: 'At least 8 characters.' })
  @IsString() @MinLength(8) @MaxLength(72, { message: 'Password cannot exceed 72 characters for bcrypt.' })
  password!: string;
}
