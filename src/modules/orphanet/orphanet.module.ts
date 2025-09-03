import { Module } from '@nestjs/common';
import { OrphanetController } from './orphanet.controller';
import { OrphanetService } from './orphanet.service';
import { DatabaseModule } from '../../shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrphanetController],
  providers: [OrphanetService],
  exports: [OrphanetService],
})
export class OrphanetModule {}
