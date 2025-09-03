/**
 * DTOs para respostas padronizadas da API CPLP-Raras
 * Seguindo padrões Open Data de 5 estrelas
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO base para respostas paginadas
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Página atual (começa em 1)',
    example: 1,
    minimum: 1
  })
  page: number;

  @ApiProperty({
    description: 'Número de itens por página',
    example: 10,
    minimum: 1,
    maximum: 100
  })
  limit: number;

  @ApiProperty({
    description: 'Total de itens encontrados',
    example: 150
  })
  total: number;

  @ApiProperty({
    description: 'Total de páginas disponíveis',
    example: 15
  })
  pages: number;
}

/**
 * DTO para metadados de resposta
 */
export class ResponseMetadataDto {
  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2025-09-03T07:30:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Versão da API',
    example: '1.0.0'
  })
  version: string;

  @ApiProperty({
    description: 'Módulo de origem dos dados',
    example: 'orphanet',
    enum: ['diseases', 'orphanet', 'hpo', 'drugbank', 'cplp']
  })
  source: string;

  @ApiPropertyOptional({
    description: 'Informações de paginação (quando aplicável)',
    type: PaginationDto
  })
  pagination?: PaginationDto;
}

/**
 * DTO genérico para respostas de sucesso
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Status da resposta',
    example: 'success',
    enum: ['success', 'error']
  })
  status: string;

  @ApiProperty({
    description: 'Metadados da resposta'
  })
  metadata: ResponseMetadataDto;

  @ApiProperty({
    description: 'Dados da resposta'
  })
  data: T;

  @ApiPropertyOptional({
    description: 'Links relacionados (HATEOAS)',
    example: {
      self: '/api/diseases/1',
      related: '/api/diseases/1/symptoms',
      collection: '/api/diseases'
    }
  })
  links?: Record<string, string>;
}

/**
 * DTO para respostas de erro
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Status da resposta',
    example: 'error'
  })
  status: string;

  @ApiProperty({
    description: 'Código do erro HTTP',
    example: 404
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Doença não encontrada'
  })
  message: string;

  @ApiProperty({
    description: 'Código interno do erro',
    example: 'DISEASE_NOT_FOUND'
  })
  errorCode: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2025-09-03T07:30:00.000Z'
  })
  timestamp: string;

  @ApiProperty({
    description: 'Caminho da requisição que gerou o erro',
    example: '/api/diseases/999'
  })
  path: string;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais do erro (apenas em development)',
    example: 'Stack trace ou informações de debug'
  })
  details?: any;
}

/**
 * DTO para estatísticas de módulo
 */
export class ModuleStatsDto {
  @ApiProperty({
    description: 'Nome do módulo',
    example: 'orphanet'
  })
  module: string;

  @ApiProperty({
    description: 'Total de registros disponíveis',
    example: 7500
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Data da última atualização dos dados',
    example: '2025-09-01T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Fonte dos dados',
    example: 'Orphanet Database v2024.1'
  })
  dataSource: string;

  @ApiPropertyOptional({
    description: 'Estatísticas detalhadas por categoria',
    example: {
      diseases: 6500,
      genes: 4200,
      phenotypes: 3800
    }
  })
  breakdown?: Record<string, number>;
}

/**
 * DTO para informações de saúde do sistema
 */
export class HealthCheckDto {
  @ApiProperty({
    description: 'Status geral do sistema',
    example: 'healthy',
    enum: ['healthy', 'degraded', 'unhealthy']
  })
  status: string;

  @ApiProperty({
    description: 'Versão da aplicação',
    example: '1.0.0'
  })
  version: string;

  @ApiProperty({
    description: 'Tempo de atividade em segundos',
    example: 86400
  })
  uptime: number;

  @ApiProperty({
    description: 'Status dos serviços',
    example: {
      database: 'healthy',
      redis: 'healthy',
      logger: 'healthy'
    }
  })
  services: Record<string, string>;

  @ApiProperty({
    description: 'Timestamp da verificação',
    example: '2025-09-03T07:30:00.000Z'
  })
  timestamp: string;
}
