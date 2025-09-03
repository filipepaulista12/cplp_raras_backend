import { 
  Controller, 
  Get, 
  Param, 
  Query,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { OrphanetService } from './orphanet.service';
import { 
  OrphanetDiseaseDto, 
  OrphanetDiseaseDetailDto, 
  OrphanetSearchDto, 
  OrphanetStatsDto 
} from './dto/orphanet.dto';
import { ApiResponseDto, ApiErrorResponseDto } from '../../shared/dto/common.dto';

@ApiTags('orphanet')
@Controller('api/orphanet')
export class OrphanetController {
  constructor(private readonly orphanetService: OrphanetService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Buscar doenças Orphanet',
    description: `
      Busca paginada de doenças raras na base Orphanet.
      Suporte para filtros por nome, código, gene, fenótipo.
      
      **Padrão Open Data 5⭐**: Dados estruturados, linkados e descobríveis
    `
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Número da página (padrão: 1)',
    example: 1,
    type: Number
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Itens por página (padrão: 10, máx: 100)',
    example: 10,
    type: Number
  })
  @ApiQuery({ 
    name: 'name', 
    required: false, 
    description: 'Buscar por nome da doença',
    example: 'marfan'
  })
  @ApiQuery({ 
    name: 'orphaCode', 
    required: false, 
    description: 'Código Orphanet específico',
    example: 'ORPHA:558'
  })
  @ApiQuery({ 
    name: 'gene', 
    required: false, 
    description: 'Símbolo do gene associado',
    example: 'FBN1'
  })
  @ApiQuery({ 
    name: 'hpo', 
    required: false, 
    description: 'Código HPO do fenótipo',
    example: 'HP:0001166'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Lista de doenças encontradas',
    type: ApiResponseDto<OrphanetDiseaseDto[]>
  })
  @ApiBadRequestResponse({ 
    description: 'Parâmetros inválidos',
    type: ApiErrorResponseDto
  })
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('name') name?: string,
    @Query('orphaCode') orphaCode?: string,
    @Query('gene') gene?: string,
    @Query('hpo') hpo?: string,
  ) {
    const pageNum = +page;
    const limitNum = +limit;
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Página deve ser >= 1 e limite entre 1-100');
    }

    const searchParams: OrphanetSearchDto = {
      name,
      orphaCode,
      gene,
      hpo
    };

    return this.orphanetService.findAll(pageNum, limitNum);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Estatísticas do módulo Orphanet',
    description: 'Informações estatísticas sobre a base de dados Orphanet disponível'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Estatísticas detalhadas',
    type: OrphanetStatsDto
  })
  getStats() {
    return this.orphanetService.getStats();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Buscar doença específica',
    description: `
      Retorna detalhes completos de uma doença específica.
      Inclui genes associados, fenótipos, classificação e prevalência.
    `
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Código Orphanet (ORPHA:xxx) ou ID interno',
    example: 'ORPHA:558'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Detalhes da doença',
    type: OrphanetDiseaseDetailDto
  })
  @ApiNotFoundResponse({ 
    description: 'Doença não encontrada',
    type: ApiErrorResponseDto
  })
  findOne(@Param('id') id: string) {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('ID da doença é obrigatório');
    }
    return this.orphanetService.findOne(id);
  }
}
