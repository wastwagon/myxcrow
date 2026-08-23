import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendChatMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;
}
