import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CplpService } from './cplp.service';

@ApiTags('cplp')
@Controller('api/cplp')
export class CplpController {
  constructor(private readonly cplpService: CplpService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Listar dados CPLP com paginação',
    description: 'Retorna dados paginados da rede CPLP-Raras (Comunidade dos Países de Língua Portuguesa)'
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (default: 10)' })
  @ApiResponse({ status: 200, description: 'Dados CPLP listados com sucesso' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.cplpService.findAll(pageNum, limitNum);
  }

  @Get('countries')
  @ApiOperation({ 
    summary: 'Listar países da CPLP',
    description: 'Retorna a lista completa dos países membros da Comunidade dos Países de Língua Portuguesa'
  })
  @ApiResponse({ status: 200, description: 'Países CPLP listados com sucesso' })
  getCountries() {
    return this.cplpService.getCountries();
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas da rede CPLP-Raras',
    description: 'Retorna estatísticas sobre os dados disponíveis da rede CPLP-Raras'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas CPLP obtidas com sucesso' })
  getStats() {
    return this.cplpService.getStats();
  }

  @Get('country/:code')
  @ApiOperation({ 
    summary: 'Buscar dados por país da CPLP',
    description: 'Busca dados específicos de doenças raras por país da CPLP'
  })
  @ApiParam({ name: 'code', description: 'Código do país (BR, PT, AO, MZ, etc.)' })
  @ApiResponse({ status: 200, description: 'Dados do país encontrados' })
  @ApiResponse({ status: 404, description: 'País não encontrado' })
  findByCountry(@Param('code') code: string) {
    return this.cplpService.findByCountry(code.toUpperCase());
  }
}
