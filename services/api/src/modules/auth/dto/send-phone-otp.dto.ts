import { IsString, Matches } from 'class-validator';

export class SendPhoneOtpDto {
  @IsString()
  @Matches(/^0[0-9]{9}$/, {
    message: 'Enter Ghana phone number (e.g. 0551234567)',
  })
  phone: string;
}
