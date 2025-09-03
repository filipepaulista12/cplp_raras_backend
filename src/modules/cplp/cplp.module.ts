import { Module } from '@nestjs/common';
import { CplpController } from './cplp.controller';
import { CplpService } from './cplp.service';

@Module({
  controllers: [CplpController],
  providers: [CplpService],
  exports: [CplpService],
})
export class CplpModule {}
