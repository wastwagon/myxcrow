import { IsEmail, IsString, MinLength, IsOptional, Matches, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'Enter Ghana phone number (e.g. 0551234567)',
  })
  phone: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

