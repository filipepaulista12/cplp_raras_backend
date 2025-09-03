import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DrugbankService } from './drugbank.service';

@ApiTags('drugbank')
@Controller('api/drugbank')
export class DrugbankController {
  constructor(private readonly drugbankService: DrugbankService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar dados Drugbank com paginação',
    description: 'Retorna dados paginados das tabelas relacionadas ao Drugbank (medicamentos e compostos)'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Dados Drugbank listados com sucesso' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.drugbankService.findAll(pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas da base de dados Drugbank',
    description: 'Retorna estatísticas sobre as tabelas e dados Drugbank disponíveis'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas Drugbank obtidas com sucesso' })
  getStats() {
    return this.drugbankService.getStats();
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Buscar medicamentos no Drugbank',
    description: 'Busca medicamentos na base Drugbank por termo de consulta'
  })
  @ApiQuery({ name: 'q', required: true, description: 'Termo de busca para medicamentos' })
  @ApiResponse({ status: 200, description: 'Medicamentos encontrados' })
  searchDrugs(@Query('q') query: string) {
    return this.drugbankService.searchDrugs(query);
  }

  @Get(':id/interactions')
  @ApiOperation({ 
    summary: 'Buscar interações medicamentosas',
    description: 'Busca interações conhecidas para um medicamento específico'
  })
  @ApiParam({ name: 'id', description: 'ID do medicamento no Drugbank' })
  @ApiResponse({ status: 200, description: 'Interações encontradas' })
  getInteractions(@Param('id') id: string) {
    return this.drugbankService.getInteractions(id);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar medicamento específico pelo ID',
    description: 'Busca um medicamento específico usando seu identificador Drugbank'
  })
  @ApiParam({ name: 'id', description: 'ID do medicamento no Drugbank (DB:xxxxxxx)' })
  @ApiResponse({ status: 200, description: 'Medicamento encontrado' })
  @ApiResponse({ status: 404, description: 'Medicamento não encontrado' })
  findOne(@Param('id') id: string) {
    return this.drugbankService.findOne(id);
  }
}
