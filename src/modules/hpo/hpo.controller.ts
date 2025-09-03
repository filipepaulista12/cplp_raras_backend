import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HpoService } from './hpo.service';

@ApiTags('hpo')
@Controller('api/hpo')
export class HpoController {
  constructor(private readonly hpoService: HpoService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar dados HPO com paginação',
    description: 'Retorna dados paginados das tabelas relacionadas ao Human Phenotype Ontology (HPO)'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Dados HPO listados com sucesso' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.hpoService.findAll(pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas da base de dados HPO',
    description: 'Retorna estatísticas sobre as tabelas e dados HPO (Human Phenotype Ontology) disponíveis'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas HPO obtidas com sucesso' })
  getStats() {
    return this.hpoService.getStats();
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Buscar fenótipos HPO',
    description: 'Busca fenótipos na ontologia HPO por termo de consulta'
  })
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca para fenótipos' })
  @ApiResponse({ status: 200, description: 'Fenótipos encontrados' })
  searchPhenotypes(@Query('q') query: string) {
    return this.hpoService.searchPhenotypes(query);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar termo HPO específico pelo ID',
    description: 'Busca um termo HPO específico usando seu identificador (ex: HP:0000001)'
  })
  @ApiParam({ name: 'id', description: 'ID do termo HPO (HP:xxxxxxx)' })
  @ApiResponse({ status: 200, description: 'Termo HPO encontrado' })
  @ApiResponse({ status: 404, description: 'Termo HPO não encontrado' })
  findOne(@Param('id') id: string) {
    return this.hpoService.findOne(id);
  }
}
