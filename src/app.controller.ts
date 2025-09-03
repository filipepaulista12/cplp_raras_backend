import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Página inicial do sistema' })
  getHomePage(@Res() res: Response) {
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CPLP-Raras Backend API</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <!-- Header -->
      <header class="bg-blue-800 text-white shadow-lg">
        <div class="container mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <i class="fas fa-dna text-3xl text-green-400"></i>
              <div>
                <h1 class="text-2xl font-bold">CPLP-Raras</h1>
                <p class="text-blue-200 text-sm">Backend API - Doenças Raras</p>
              </div>
            </div>
            <div class="hidden md:flex space-x-6">
              <a href="/api" class="hover:text-green-400 transition-colors">
                <i class="fas fa-book mr-2"></i>Documentação
              </a>
              <a href="/graphql" class="hover:text-green-400 transition-colors">
                <i class="fas fa-project-diagram mr-2"></i>GraphQL
              </a>
              <a href="/opendata" class="hover:text-green-400 transition-colors">
                <i class="fas fa-database mr-2"></i>Open Data
              </a>
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation Menu -->
      <nav class="bg-white shadow-md border-b">
        <div class="container mx-auto px-6">
          <div class="flex space-x-8 overflow-x-auto py-4">
            <a href="/api/orphanet" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 whitespace-nowrap">
              <i class="fas fa-hospital"></i>
              <span>Orphanet</span>
            </a>
            <a href="/api/hpo" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700 whitespace-nowrap">
              <i class="fas fa-microscope"></i>
              <span>HPO</span>
            </a>
            <a href="/api/drugbank" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-purple-700 whitespace-nowrap">
              <i class="fas fa-pills"></i>
              <span>DrugBank</span>
            </a>
            <a href="/api/cplp" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors text-yellow-700 whitespace-nowrap">
              <i class="fas fa-globe-americas"></i>
              <span>CPLP</span>
            </a>
            <a href="/api/diseases" class="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors text-red-700 whitespace-nowrap">
              <i class="fas fa-heartbeat"></i>
              <span>Doenças</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto px-6 py-8">
        <!-- Welcome Section -->
        <section class="bg-white rounded-lg shadow-md p-8 mb-8">
          <div class="text-center mb-8">
            <h2 class="text-4xl font-bold text-gray-800 mb-4">Sistema de Dados de Doenças Raras</h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Plataforma unificada de dados sobre doenças raras para os países da 
              <strong>Comunidade dos Países de Língua Portuguesa (CPLP)</strong>
            </p>
          </div>
          
          <div class="grid md:grid-cols-2 gap-8">
            <div class="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
              <h3 class="text-2xl font-bold text-blue-800 mb-4">
                <i class="fas fa-rocket mr-3"></i>Sistema Operacional
              </h3>
              <div class="space-y-2">
                <p class="flex items-center text-green-600">
                  <i class="fas fa-check-circle mr-2"></i>
                  <strong>19.657</strong> termos HPO catalogados
                </p>
                <p class="flex items-center text-green-600">
                  <i class="fas fa-check-circle mr-2"></i>
                  <strong>11.340</strong> doenças Orphanet
                </p>
                <p class="flex items-center text-green-600">
                  <i class="fas fa-check-circle mr-2"></i>
                  <strong>115.561</strong> associações fenótipo-doença
                </p>
                <p class="flex items-center text-green-600">
                  <i class="fas fa-check-circle mr-2"></i>
                  Sistema <strong>Five-Star Open Data</strong>
                </p>
              </div>
            </div>
            
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg">
              <h3 class="text-2xl font-bold text-purple-800 mb-4">
                <i class="fas fa-globe mr-3"></i>Cobertura CPLP
              </h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇵🇹 Portugal</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇧🇷 Brasil</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇦🇴 Angola</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇲🇿 Moçambique</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇨🇻 Cabo Verde</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇬🇼 Guiné-Bissau</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇸🇹 São Tomé</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded">🇹🇱 Timor-Leste</span>
              </div>
            </div>
          </div>
        </section>

        <!-- API Endpoints -->
        <section class="grid md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 class="text-xl font-bold text-blue-800 mb-4">
              <i class="fas fa-code mr-2"></i>REST API
            </h3>
            <p class="text-gray-600 mb-4">Interface RESTful completa para acesso aos dados</p>
            <a href="/api" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block">
              Ver Documentação
            </a>
          </div>
          
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 class="text-xl font-bold text-green-800 mb-4">
              <i class="fas fa-project-diagram mr-2"></i>GraphQL
            </h3>
            <p class="text-gray-600 mb-4">Consultas flexíveis e eficientes dos dados</p>
            <a href="/graphql" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block">
              Playground GraphQL
            </a>
          </div>
          
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 class="text-xl font-bold text-purple-800 mb-4">
              <i class="fas fa-database mr-2"></i>Open Data
            </h3>
            <p class="text-gray-600 mb-4">Dados abertos em formatos padronizados</p>
            <a href="/opendata" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block">
              Portal de Dados
            </a>
          </div>
        </section>

        <!-- Quick Links -->
        <section class="bg-white rounded-lg shadow-md p-8">
          <h3 class="text-2xl font-bold text-gray-800 mb-6">Links Rápidos</h3>
          <div class="grid md:grid-cols-4 gap-4">
            <a href="/api/orphanet/stats" class="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors">
              <i class="fas fa-chart-bar text-2xl text-blue-600 mb-2"></i>
              <p class="font-semibold text-blue-800">Estatísticas Orphanet</p>
            </a>
            <a href="/api/hpo/stats" class="bg-green-50 hover:bg-green-100 p-4 rounded-lg text-center transition-colors">
              <i class="fas fa-microscope text-2xl text-green-600 mb-2"></i>
              <p class="font-semibold text-green-800">Estatísticas HPO</p>
            </a>
            <a href="/api/cplp/countries" class="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors">
              <i class="fas fa-globe-americas text-2xl text-yellow-600 mb-2"></i>
              <p class="font-semibold text-yellow-800">Países CPLP</p>
            </a>
            <a href="/health" class="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg text-center transition-colors">
              <i class="fas fa-heartbeat text-2xl text-gray-600 mb-2"></i>
              <p class="font-semibold text-gray-800">Status Sistema</p>
            </a>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="bg-blue-800 text-white mt-12 py-8">
        <div class="container mx-auto px-6 text-center">
          <div class="flex items-center justify-center mb-4">
            <i class="fas fa-dna text-2xl text-green-400 mr-3"></i>
            <span class="text-xl font-bold">CPLP-Raras</span>
          </div>
          <p class="text-blue-200 mb-2">
            Sistema de Dados de Doenças Raras - Comunidade dos Países de Língua Portuguesa
          </p>
          <p class="text-blue-300 text-sm">
            Desenvolvido para pesquisa acadêmica e científica
          </p>
        </div>
      </footer>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('api/hello')
  @ApiOperation({ summary: 'API welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/status')
  @ApiOperation({ summary: 'API status endpoint' })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('api/db-test')
  @ApiOperation({ summary: 'Database connection test' })
  testDatabase() {
    return this.appService.testDatabase();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for deployment services' })
  healthCheck() {
    return this.appService.getHealthCheck();
  }
}
