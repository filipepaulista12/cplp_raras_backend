import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerConfig } from './shared/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuração global de validação
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validateCustomDecorators: true,
  }));

  // Configuração de CORS para desenvolvimento
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://raras-cplp.org', 'https://www.raras-cplp.org']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Configuração do Swagger/OpenAPI
  const swaggerConfig = SwaggerConfig.getEnvironmentConfig();
  if (swaggerConfig.enabled) {
    const document = SwaggerConfig.createDocument(app);
    console.log(`📚 Swagger UI disponível em: http://localhost:3001/${swaggerConfig.path}`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log('🚀 CPLP-Raras Backend iniciado!');
  console.log(`� Servidor rodando em: http://localhost:${port}`);
  console.log('🔗 Endpoints principais:');
  console.log('   • /api/diseases - Consultas unificadas de doenças');
  console.log('   • /api/orphanet - Base Orphanet Europa');
  console.log('   • /api/hpo - Ontologia de Fenótipos Humanos');
  console.log('   • /api/drugbank - Base de medicamentos');
  console.log('   • /api/cplp - Dados específicos CPLP');
  console.log('   • /health - Status do sistema');
  if (swaggerConfig.enabled) {
    console.log(`   • /${swaggerConfig.path} - Documentação API (Swagger)`);
  }
}

bootstrap().catch(err => {
  console.error('❌ Erro ao inicializar aplicação:', err);
  process.exit(1);
});
