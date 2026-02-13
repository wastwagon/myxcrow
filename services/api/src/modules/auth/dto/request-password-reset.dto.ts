import { IsString, Matches, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsString()
  @MinLength(1, { message: 'Enter your email or phone number' })
  @Matches(/^(\+?233[0-9]{9}|0[0-9]{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/, {
    message: 'Enter email or Ghana phone (e.g. 0551234567)',
  })
  identifier: string;
}

