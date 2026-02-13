import { IsEmail, IsString, MinLength, IsOptional, Matches, IsEnum, Length } from 'class-validator';
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

  /** 6-digit verification code from SMS (required for registration) */
  @IsString()
  @Length(6, 6, { message: 'Enter the 6-digit code sent to your phone' })
  code: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

