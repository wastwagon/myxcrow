import { Module, Global } from '@nestjs/common';
import { AntivirusService } from './antivirus.service';

@Global()
@Module({
  providers: [AntivirusService],
  exports: [AntivirusService],
})
export class SecurityModule {}




