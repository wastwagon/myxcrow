import { IsString, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'Enter Ghana phone number (e.g. 0551234567)',
  })
  phone: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}




