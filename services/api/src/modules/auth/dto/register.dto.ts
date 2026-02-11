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
  @Matches(/^(\+233|0)[0-9]{9}$/, {
    message: 'Invalid Ghana phone number format (e.g., +233XXXXXXXXX or 0XXXXXXXXX)',
  })
  phone: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

