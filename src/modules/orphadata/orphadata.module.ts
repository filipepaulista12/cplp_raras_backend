import { Module } from '@nestjs/common';
import { OrphadataController } from './orphadata.controller';
import { OrphadataService } from './orphadata.service';

@Module({
  controllers: [OrphadataController],
  providers: [OrphadataService],
  exports: [OrphadataService],
})
export class OrphadataModule {}
