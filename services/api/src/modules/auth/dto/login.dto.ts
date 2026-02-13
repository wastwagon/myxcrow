import { IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^(\+?233[0-9]{9}|0[0-9]{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/, {
    message: 'Enter email or Ghana phone (e.g. 0551234567)',
  })
  identifier: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}




