import { Module } from '@nestjs/common';
import { DrugbankController } from './drugbank.controller';
import { DrugbankService } from './drugbank.service';

@Module({
  controllers: [DrugbankController],
  providers: [DrugbankService],
  exports: [DrugbankService],
})
export class DrugbankModule {}
