/**
 * Módulo Open Data - Sistema 5-Star para CPLP-Raras
 * Implementa todos os formatos necessários para Open Data de 5 estrelas
 */

import { Module } from '@nestjs/common';
import { OpenDataController } from './opendata.controller';
import { OpenDataService } from './opendata.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { LoggerModule } from '../../shared/logger/logger.module';

// Importar services dos módulos para agregação
import { OrphanetModule } from '../orphanet/orphanet.module';
import { HpoModule } from '../hpo/hpo.module';
import { DrugbankModule } from '../drugbank/drugbank.module';
import { CplpModule } from '../cplp/cplp.module';
import { DiseasesModule } from '../diseases/diseases.module';

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    OrphanetModule,
    HpoModule,
    DrugbankModule,
    CplpModule,
    DiseasesModule
  ],
  controllers: [OpenDataController],
  providers: [OpenDataService],
  exports: [OpenDataService]
})
export class OpenDataModule {}
