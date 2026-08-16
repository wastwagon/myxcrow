import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { WithdrawalMethod } from '@prisma/client';
import { PayoutDetailsDto } from './payout-details.dto';

export { PayoutDetailsDto };

export class RequestWithdrawalDto {
  @IsInt()
  @Min(100, { message: 'Minimum withdrawal is 1.00' })
  amountCents: number;

  @IsOptional()
  @IsUUID()
  payoutMethodId?: string;

  @ValidateIf((o) => !o.payoutMethodId)
  @IsIn([WithdrawalMethod.BANK_ACCOUNT, WithdrawalMethod.MOBILE_MONEY])
  methodType?: WithdrawalMethod;

  @ValidateIf((o) => !o.payoutMethodId)
  @IsObject()
  @ValidateNested()
  @Type(() => PayoutDetailsDto)
  methodDetails?: PayoutDetailsDto;

  @IsOptional()
  @IsBoolean()
  savePayoutMethod?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  payoutLabel?: string;
}
