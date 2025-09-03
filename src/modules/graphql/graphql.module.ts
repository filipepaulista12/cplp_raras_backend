/**
 * Configuração do módulo GraphQL para CPLP-Raras
 * Integração com Apollo Server e geração automática de schema
 */

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

// Resolvers dos módulos
import { OrphanetResolver } from '../orphanet/orphanet.resolver';
import { HpoResolver } from '../hpo/hpo.resolver';
import { DrugbankResolver } from '../drugbank/drugbank.resolver';
import { CplpResolver } from '../cplp/cplp.resolver';
import { DiseasesResolver } from '../diseases/diseases.resolver';

// Services necessários
import { OrphanetModule } from '../orphanet/orphanet.module';
import { HpoModule } from '../hpo/hpo.module';
import { DrugbankModule } from '../drugbank/drugbank.module';
import { CplpModule } from '../cplp/cplp.module';
import { DiseasesModule } from '../diseases/diseases.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Gerar schema automaticamente
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      // Habilitar GraphQL Playground para desenvolvimento
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
      // Configurações adicionais
      context: ({ req, connection }) => {
        // Context disponível para todos os resolvers
        return {
          req,
          user: req?.user, // Se houver autenticação
          timestamp: new Date().toISOString()
        };
      },
      // Formatação de erros
      formatError: (error) => ({
        message: error.message,
        code: error.extensions?.code,
        timestamp: new Date().toISOString(),
        path: error.path
      }),
      // Plugins adicionais
      plugins: [
        // Plugin para logging de queries (opcional)
      ]
    }),
    // Importar módulos que contêm os services
    OrphanetModule,
    HpoModule,
    DrugbankModule,
    CplpModule,
    DiseasesModule
  ],
  providers: [
    OrphanetResolver,
    HpoResolver,
    DrugbankResolver,
    CplpResolver,
    DiseasesResolver
  ],
  exports: [GraphQLModule]
})
export class GraphqlModule {}
