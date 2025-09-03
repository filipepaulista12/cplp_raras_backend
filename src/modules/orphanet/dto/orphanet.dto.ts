/**
 * DTOs específicos para o módulo Orphanet
 * Estruturas de dados para doenças raras europeias
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para doença Orphanet básica
 */
export class OrphanetDiseaseDto {
  @ApiProperty({
    description: 'Identificador único Orphanet',
    example: 'ORPHA:558'
  })
  orphaCode: string;

  @ApiProperty({
    description: 'Nome da doença',
    example: 'Marfan syndrome'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Sinônimos da doença',
    example: ['Marfan disease', 'Syndrome de Marfan']
  })
  synonyms?: string[];

  @ApiPropertyOptional({
    description: 'Definição da doença',
    example: 'Marfan syndrome is a connective tissue disorder...'
  })
  definition?: string;

  @ApiProperty({
    description: 'Tipo de entidade Orphanet',
    example: 'Disease',
    enum: ['Disease', 'Group of diseases', 'Subtype of disease', 'Clinical syndrome']
  })
  type: string;

  @ApiProperty({
    description: 'Status da doença',
    example: 'Active',
    enum: ['Active', 'Inactive', 'Under validation']
  })
  status: string;
}

/**
 * DTO para doença Orphanet detalhada
 */
export class OrphanetDiseaseDetailDto extends OrphanetDiseaseDto {
  @ApiPropertyOptional({
    description: 'Códigos ICD-10 relacionados',
    example: ['Q87.4']
  })
  icd10Codes?: string[];

  @ApiPropertyOptional({
    description: 'Códigos OMIM relacionados',
    example: ['154700']
  })
  omimCodes?: string[];

  @ApiPropertyOptional({
    description: 'Genes associados',
    example: [
      {
        symbol: 'FBN1',
        name: 'fibrillin 1',
        orphaCode: 'ORPHA:G558'
      }
    ]
  })
  associatedGenes?: OrphanetGeneDto[];

  @ApiPropertyOptional({
    description: 'Fenótipos clínicos',
    example: [
      {
        hpoCode: 'HP:0001166',
        term: 'Arachnodactyly',
        frequency: 'Frequent (79-30%)'
      }
    ]
  })
  phenotypes?: OrphanetPhenotypeDto[];

  @ApiPropertyOptional({
    description: 'Classificação hierárquica',
    example: [
      'Rare genetic disease',
      'Rare developmental defect during embryogenesis'
    ]
  })
  classification?: string[];

  @ApiPropertyOptional({
    description: 'Prevalência estimada',
    example: {
      value: '1/5000',
      type: 'Point prevalence',
      geographic: 'Worldwide'
    }
  })
  prevalence?: {
    value: string;
    type: string;
    geographic?: string;
    class?: string;
  };
}

/**
 * DTO para gene Orphanet
 */
export class OrphanetGeneDto {
  @ApiProperty({
    description: 'Símbolo oficial do gene',
    example: 'FBN1'
  })
  symbol: string;

  @ApiProperty({
    description: 'Nome completo do gene',
    example: 'fibrillin 1'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Código Orphanet do gene',
    example: 'ORPHA:G558'
  })
  orphaCode?: string;

  @ApiPropertyOptional({
    description: 'Localização cromossômica',
    example: '15q21.1'
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Tipo de associação gene-doença',
    example: 'Disease-causing germline mutation(s) in',
    enum: [
      'Disease-causing germline mutation(s) in',
      'Major susceptibility factor in',
      'Modifying germline mutation in',
      'Part of a fusion gene in'
    ]
  })
  associationType?: string;
}

/**
 * DTO para fenótipo Orphanet
 */
export class OrphanetPhenotypeDto {
  @ApiProperty({
    description: 'Código HPO do fenótipo',
    example: 'HP:0001166'
  })
  hpoCode: string;

  @ApiProperty({
    description: 'Termo do fenótipo',
    example: 'Arachnodactyly'
  })
  term: string;

  @ApiProperty({
    description: 'Frequência do fenótipo',
    example: 'Frequent (79-30%)',
    enum: [
      'Very frequent (99-80%)',
      'Frequent (79-30%)',
      'Occasional (29-5%)',
      'Very rare (<4-1%)',
      'Excluded (0%)'
    ]
  })
  frequency: string;

  @ApiPropertyOptional({
    description: 'Critério diagnóstico',
    example: true
  })
  diagnostic?: boolean;
}

/**
 * DTO para prevalência Orphanet
 */
export class OrphanetPrevalenceDto {
  @ApiProperty({
    description: 'Valor da prevalência',
    example: '1/5000'
  })
  value: string;

  @ApiProperty({
    description: 'Tipo de prevalência',
    example: 'Point prevalence',
    enum: [
      'Point prevalence',
      'Birth prevalence',
      'Lifetime prevalence',
      'Annual incidence'
    ]
  })
  type: string;

  @ApiPropertyOptional({
    description: 'Área geográfica',
    example: 'Worldwide'
  })
  geographic?: string;

  @ApiPropertyOptional({
    description: 'Classe de prevalência',
    example: 'Rare',
    enum: ['Ultra rare', 'Rare', 'Common']
  })
  class?: string;
}

/**
 * DTO para busca Orphanet
 */
export class OrphanetSearchDto {
  @ApiPropertyOptional({
    description: 'Termo de busca por nome',
    example: 'marfan'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Código Orphanet específico',
    example: 'ORPHA:558'
  })
  orphaCode?: string;

  @ApiPropertyOptional({
    description: 'Código ICD-10',
    example: 'Q87.4'
  })
  icd10?: string;

  @ApiPropertyOptional({
    description: 'Código OMIM',
    example: '154700'
  })
  omim?: string;

  @ApiPropertyOptional({
    description: 'Símbolo do gene',
    example: 'FBN1'
  })
  gene?: string;

  @ApiPropertyOptional({
    description: 'Código HPO do fenótipo',
    example: 'HP:0001166'
  })
  hpo?: string;

  @ApiPropertyOptional({
    description: 'Tipo de entidade',
    enum: ['Disease', 'Group of diseases', 'Subtype of disease', 'Clinical syndrome']
  })
  type?: string;
}

/**
 * DTO para estatísticas Orphanet
 */
export class OrphanetStatsDto {
  @ApiProperty({
    description: 'Total de doenças ativas',
    example: 6500
  })
  totalDiseases: number;

  @ApiProperty({
    description: 'Total de genes associados',
    example: 4200
  })
  totalGenes: number;

  @ApiProperty({
    description: 'Total de fenótipos únicos',
    example: 3800
  })
  totalPhenotypes: number;

  @ApiProperty({
    description: 'Distribuição por tipo de entidade',
    example: {
      'Disease': 5500,
      'Group of diseases': 800,
      'Subtype of disease': 200
    }
  })
  byEntityType: Record<string, number>;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-12-01T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Versão dos dados Orphanet',
    example: 'v2024.1'
  })
  version: string;
}
