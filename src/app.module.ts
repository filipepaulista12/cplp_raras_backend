import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './shared/database/database.module';
import { LoggerModule } from './shared/logger/logger.module';
import { LoggingInterceptor } from './shared/logger/logging.interceptor';
import { DiseasesModule } from './modules/diseases/diseases.module';
import { OrphanetModule } from './modules/orphanet/orphanet.module';
import { HpoModule } from './modules/hpo/hpo.module';
import { DrugbankModule } from './modules/drugbank/drugbank.module';
import { CplpModule } from './modules/cplp/cplp.module';
import { GraphqlModule } from './modules/graphql/graphql.module';
import { SecurityModule } from './modules/security/security.module';
import { OpenDataModule } from './modules/opendata/opendata.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    LoggerModule,
    SecurityModule,
    DiseasesModule,
    OrphanetModule,
    HpoModule,
    DrugbankModule,
    CplpModule,
    OpenDataModule,
    GraphqlModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
