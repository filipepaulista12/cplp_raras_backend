import { Module } from '@nestjs/common';
import { HpoController } from './hpo.controller';
import { HpoService } from './hpo.service';

@Module({
  controllers: [HpoController],
  providers: [HpoService],
  exports: [HpoService],
})
export class HpoModule {}
