import { IsBoolean, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class ProcessWithdrawalDto {
  @IsBoolean()
  succeeded: boolean;

  @ValidateIf((o) => o.succeeded === false)
  @IsString()
  @MinLength(3, { message: 'A denial reason is required' })
  reason?: string;
}
