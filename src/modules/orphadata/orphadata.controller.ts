import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrphadataService } from './orphadata.service';

@ApiTags('orphadata')
@Controller('api/orphadata')
export class OrphadataController {
  constructor(private readonly orphadataService: OrphadataService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar dados Orphanet com paginação',
    description: 'Retorna dados paginados das tabelas relacionadas ao Orphanet'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Dados listados com sucesso' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.orphadataService.findAll(pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas da base de dados Orphanet',
    description: 'Retorna estatísticas sobre as tabelas e dados Orphanet disponíveis'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas obtidas com sucesso' })
  getStats() {
    return this.orphadataService.getStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar doença específica pelo ID',
    description: 'Busca uma doença específica usando seu identificador'
  })
  @ApiParam({ name: 'id', description: 'ID da doença Orphanet (ORPHA:xxxxx)' })
  @ApiResponse({ status: 200, description: 'Doença encontrada' })
  @ApiResponse({ status: 404, description: 'Doença não encontrada' })
  findOne(@Param('id') id: string) {
    return this.orphadataService.findOne(id);
  }
}
