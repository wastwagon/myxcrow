import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { WithdrawalMethod } from '@prisma/client';
import { PayoutDetailsDto } from './payout-details.dto';

export class CreatePayoutMethodDto {
  @IsIn([WithdrawalMethod.BANK_ACCOUNT, WithdrawalMethod.MOBILE_MONEY])
  methodType: WithdrawalMethod;

  @IsObject()
  @ValidateNested()
  @Type(() => PayoutDetailsDto)
  methodDetails: PayoutDetailsDto;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsBoolean()
  setDefault?: boolean;
}
