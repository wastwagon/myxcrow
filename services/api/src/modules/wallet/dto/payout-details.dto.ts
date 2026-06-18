import { IsOptional } from 'class-validator';

export class PayoutDetailsDto {
  @IsOptional()
  accountName?: string;

  @IsOptional()
  accountNumber?: string;

  @IsOptional()
  bankName?: string;

  @IsOptional()
  branch?: string;

  @IsOptional()
  mobileNumber?: string;

  @IsOptional()
  network?: string;
}
