/**
 * Controller Open Data - Endpoints 5-Star Open Data
 * Implementa todos os formatos: HTML, CSV, JSON, RDF, Linked Data
 */

import { Controller, Get, Param, Res, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OpenDataService } from './opendata.service';

@ApiTags('opendata')
@Controller('opendata')
export class OpenDataController {
  constructor(private readonly openDataService: OpenDataService) {}

  // ⭐ 1-STAR: Dados na web com licença aberta
  @Get()
  @ApiOperation({ 
    summary: 'Portal Open Data - Catálogo principal',
    description: '⭐ 1-Star: Dados disponíveis na web com licença aberta'
  })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getOpenDataPortal(@Res() res: Response) {
    const html = await this.openDataService.generatePortalHtml();
    res.send(html);
  }

  // ⭐⭐ 2-STAR: Dados estruturados CSV
  @Get('diseases.csv')
  @ApiOperation({ 
    summary: 'Dados de doenças em CSV',
    description: '⭐⭐ 2-Star: Dados estruturados e legíveis por máquina'
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cplp-raras-diseases.csv"')
  async getDiseasesCSV(@Res() res: Response) {
    const csv = await this.openDataService.generateDiseasesCSV();
    res.send(csv);
  }

  // ⭐⭐⭐ 3-STAR: Formato não-proprietário JSON
  @Get('diseases.json')
  @ApiOperation({ 
    summary: 'Dados de doenças em JSON',
    description: '⭐⭐⭐ 3-Star: Formato aberto não-proprietário'
  })
  @Header('Content-Type', 'application/json; charset=utf-8')
  async getDiseasesJSON(@Res() res: Response) {
    const json = await this.openDataService.generateDiseasesJSON();
    res.json(json);
  }

  // ⭐⭐⭐⭐ 4-STAR: URIs para identificar recursos
  @Get('disease/:id')
  @ApiOperation({ 
    summary: 'Doença específica com URI persistente',
    description: '⭐⭐⭐⭐ 4-Star: URIs estáveis para identificar recursos'
  })
  @ApiParam({ name: 'id', description: 'ID da doença (ex: ORPHA:558)' })
  async getDiseaseById(
    @Param('id') id: string,
    @Query('format') format: string = 'html',
    @Res() res: Response
  ) {
    // Content negotiation
    const acceptHeader = res.req.headers.accept || '';
    
    if (format === 'json' || acceptHeader.includes('application/json')) {
      const json = await this.openDataService.getDiseaseAsJSON(id);
      res.header('Content-Type', 'application/json').json(json);
    } else if (format === 'rdf' || acceptHeader.includes('application/rdf+xml')) {
      const rdf = await this.openDataService.getDiseaseAsRDF(id);
      res.header('Content-Type', 'application/rdf+xml').send(rdf);
    } else if (format === 'jsonld' || acceptHeader.includes('application/ld+json')) {
      const jsonld = await this.openDataService.getDiseaseAsJSONLD(id);
      res.header('Content-Type', 'application/ld+json').json(jsonld);
    } else {
      const html = await this.openDataService.getDiseaseAsHTML(id);
      res.header('Content-Type', 'text/html').send(html);
    }
  }

  // ⭐⭐⭐⭐⭐ 5-STAR: Linked Data completo
  @Get('diseases.rdf')
  @ApiOperation({ 
    summary: 'Dados completos em RDF/XML',
    description: '⭐⭐⭐⭐⭐ 5-Star: Linked Data com vocabulários padrão'
  })
  @Header('Content-Type', 'application/rdf+xml; charset=utf-8')
  async getDiseasesRDF(@Res() res: Response) {
    const rdf = await this.openDataService.generateDiseasesRDF();
    res.send(rdf);
  }

  @Get('diseases.ttl')
  @ApiOperation({ 
    summary: 'Dados completos em Turtle',
    description: '⭐⭐⭐⭐⭐ 5-Star: RDF em formato Turtle'
  })
  @Header('Content-Type', 'text/turtle; charset=utf-8')
  async getDiseasesRDFTurtle(@Res() res: Response) {
    const turtle = await this.openDataService.generateDiseasesTurtle();
    res.send(turtle);
  }

  @Get('diseases.jsonld')
  @ApiOperation({ 
    summary: 'Dados completos em JSON-LD',
    description: '⭐⭐⭐⭐⭐ 5-Star: JSON-LD com contextos semânticos'
  })
  @Header('Content-Type', 'application/ld+json; charset=utf-8')
  async getDiseasesJSONLD(@Res() res: Response) {
    const jsonld = await this.openDataService.generateDiseasesJSONLD();
    res.json(jsonld);
  }

  // Contextos e vocabulários
  @Get('context.jsonld')
  @ApiOperation({ 
    summary: 'Contexto JSON-LD para vocabulários',
    description: 'Contexto JSON-LD com prefixos padrão'
  })
  @Header('Content-Type', 'application/ld+json; charset=utf-8')
  async getJSONLDContext(@Res() res: Response) {
    const context = await this.openDataService.generateJSONLDContext();
    res.json(context);
  }

  // SPARQL endpoint (read-only)
  @Get('sparql')
  @ApiOperation({ 
    summary: 'SPARQL Endpoint (consulta)',
    description: 'Endpoint SPARQL para consultas complexas'
  })
  @ApiQuery({ name: 'query', description: 'Query SPARQL', required: true })
  async sparqlQuery(
    @Query('query') query: string,
    @Query('format') format: string = 'json',
    @Res() res: Response
  ) {
    if (!query) {
      const html = await this.openDataService.generateSPARQLInterface();
      res.header('Content-Type', 'text/html').send(html);
    } else {
      const result = await this.openDataService.executeSPARQLQuery(query, format);
      
      if (format === 'xml') {
        res.header('Content-Type', 'application/sparql-results+xml').send(result);
      } else {
        res.header('Content-Type', 'application/sparql-results+json').json(result);
      }
    }
  }

  // Metadados DCAT
  @Get('catalog.rdf')
  @ApiOperation({ 
    summary: 'Catálogo DCAT em RDF',
    description: 'Metadados do catálogo seguindo padrão DCAT'
  })
  @Header('Content-Type', 'application/rdf+xml; charset=utf-8')
  async getCatalogDCAT(@Res() res: Response) {
    const dcat = await this.openDataService.generateDCATCatalog();
    res.send(dcat);
  }
}
