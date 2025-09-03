/**
 * Configuração centralizada do Swagger/OpenAPI para CPLP-Raras Backend
 * Sistema de documentação automática para APIs de doenças raras
 */

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export class SwaggerConfig {
  /**
   * Configuração principal do Swagger
   */
  static createDocument(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle('CPLP-Raras API')
      .setDescription(`
        API completa para pesquisa de doenças raras nos países de língua portuguesa.
        
        ## Funcionalidades Principais:
        - 🔬 **Diseases**: Consulta unificada de doenças raras
        - 🧬 **Orphanet**: Base de dados europeia de doenças raras  
        - 📊 **HPO**: Ontologia de fenótipos humanos
        - 💊 **DrugBank**: Base de dados de medicamentos
        - 🌍 **CPLP**: Dados específicos dos países lusófonos
        
        ## Padrões Open Data (5 estrelas):
        - ⭐ Dados disponíveis na web com licença aberta
        - ⭐⭐ Dados estruturados e legíveis por máquina
        - ⭐⭐⭐ Formato não-proprietário (JSON)
        - ⭐⭐⭐⭐ URIs para identificar recursos
        - ⭐⭐⭐⭐⭐ Dados linkados para descoberta
      `)
      .setVersion('1.0.0')
      .setContact(
        'Equipe CPLP-Raras',
        'https://raras-cplp.org',
        'contato@raras-cplp.org'
      )
      .setLicense(
        'MIT License',
        'https://opensource.org/licenses/MIT'
      )
      .addServer('http://localhost:3001', 'Servidor de Desenvolvimento')
      .addServer('https://api.raras-cplp.org', 'Servidor de Produção')
      .addTag('diseases', 'Consultas unificadas de doenças raras')
      .addTag('orphanet', 'Base de dados Orphanet Europa')
      .addTag('hpo', 'Ontologia de Fenótipos Humanos')
      .addTag('drugbank', 'Base de dados de medicamentos')
      .addTag('cplp', 'Dados específicos CPLP')
      .addTag('system', 'Status e informações do sistema')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação (futuro)'
        },
        'access-token'
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      customSiteTitle: 'CPLP-Raras API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { background-color: #1e40af; }
        .swagger-ui .topbar-wrapper .link { color: white; }
        .swagger-ui .info .title { color: #1e40af; }
        .swagger-ui .scheme-container { background: #f8fafc; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });

    return document;
  }

  /**
   * Configurações específicas por ambiente
   */
  static getEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      development: {
        enabled: true,
        path: 'api',
        title: 'CPLP-Raras API (Development)',
      },
      production: {
        enabled: process.env.SWAGGER_ENABLED === 'true',
        path: 'docs',
        title: 'CPLP-Raras API (Production)',
      },
      test: {
        enabled: false,
        path: 'api-test',
        title: 'CPLP-Raras API (Test)',
      }
    }[env];
  }
}
