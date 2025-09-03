/**
 * DTOs específicos para o módulo HPO (Human Phenotype Ontology)
 * Estruturas de dados para fenótipos humanos
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para termo HPO básico
 */
export class HpoTermDto {
  @ApiProperty({
    description: 'Código HPO único',
    example: 'HP:0001166'
  })
  hpoId: string;

  @ApiProperty({
    description: 'Nome do termo HPO',
    example: 'Arachnodactyly'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Definição do termo',
    example: 'Abnormally long and slender fingers and toes...'
  })
  definition?: string;

  @ApiPropertyOptional({
    description: 'Sinônimos do termo',
    example: ['Long fingers', 'Spider fingers']
  })
  synonyms?: string[];

  @ApiProperty({
    description: 'Status do termo',
    example: 'Active',
    enum: ['Active', 'Obsolete', 'Merged']
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Comentário adicional',
    example: 'This finding is commonly seen in connective tissue disorders'
  })
  comment?: string;
}

/**
 * DTO para termo HPO detalhado
 */
export class HpoTermDetailDto extends HpoTermDto {
  @ApiPropertyOptional({
    description: 'Termos HPO pais (hierarquia)',
    example: [
      {
        hpoId: 'HP:0001155',
        name: 'Abnormality of the hand'
      }
    ]
  })
  parents?: HpoRelationDto[];

  @ApiPropertyOptional({
    description: 'Termos HPO filhos (hierarquia)',
    example: [
      {
        hpoId: 'HP:0001238',
        name: 'Slender finger'
      }
    ]
  })
  children?: HpoRelationDto[];

  @ApiPropertyOptional({
    description: 'Doenças associadas ao termo',
    example: [
      {
        orphaCode: 'ORPHA:558',
        name: 'Marfan syndrome',
        frequency: 'Frequent (79-30%)'
      }
    ]
  })
  associatedDiseases?: HpoDiseaseAssociationDto[];

  @ApiPropertyOptional({
    description: 'Genes associados ao fenótipo',
    example: [
      {
        symbol: 'FBN1',
        name: 'fibrillin 1',
        associationType: 'causative'
      }
    ]
  })
  associatedGenes?: HpoGeneAssociationDto[];

  @ApiPropertyOptional({
    description: 'Nível na hierarquia HPO',
    example: 5
  })
  level?: number;

  @ApiPropertyOptional({
    description: 'Categoria principal HPO',
    example: 'Phenotypic abnormality',
    enum: [
      'Phenotypic abnormality',
      'Clinical modifier',
      'Mortality/Aging',
      'Frequency',
      'Clinical course'
    ]
  })
  category?: string;
}

/**
 * DTO para relação HPO (pai/filho)
 */
export class HpoRelationDto {
  @ApiProperty({
    description: 'Código HPO',
    example: 'HP:0001155'
  })
  hpoId: string;

  @ApiProperty({
    description: 'Nome do termo',
    example: 'Abnormality of the hand'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Tipo de relação',
    example: 'is_a',
    enum: ['is_a', 'part_of', 'has_part']
  })
  relationType?: string;

  @ApiPropertyOptional({
    description: 'Distância na hierarquia',
    example: 1
  })
  distance?: number;
}

/**
 * DTO para associação HPO-Doença
 */
export class HpoDiseaseAssociationDto {
  @ApiProperty({
    description: 'Código Orphanet da doença',
    example: 'ORPHA:558'
  })
  orphaCode: string;

  @ApiProperty({
    description: 'Nome da doença',
    example: 'Marfan syndrome'
  })
  name: string;

  @ApiProperty({
    description: 'Frequência do fenótipo na doença',
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
    description: 'Se é critério diagnóstico',
    example: true
  })
  diagnostic?: boolean;

  @ApiPropertyOptional({
    description: 'Evidência da associação',
    example: 'Clinical study',
    enum: ['Clinical study', 'Case report', 'Expert opinion']
  })
  evidence?: string;
}

/**
 * DTO para associação HPO-Gene
 */
export class HpoGeneAssociationDto {
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

  @ApiProperty({
    description: 'Tipo de associação',
    example: 'causative',
    enum: ['causative', 'contributing', 'candidate']
  })
  associationType: string;

  @ApiPropertyOptional({
    description: 'ID Entrez do gene',
    example: 2200
  })
  entrezId?: number;

  @ApiPropertyOptional({
    description: 'Localização cromossômica',
    example: '15q21.1'
  })
  location?: string;
}

/**
 * DTO para busca HPO
 */
export class HpoSearchDto {
  @ApiPropertyOptional({
    description: 'Termo de busca por nome',
    example: 'arachnodactyly'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Código HPO específico',
    example: 'HP:0001166'
  })
  hpoId?: string;

  @ApiPropertyOptional({
    description: 'Código Orphanet da doença relacionada',
    example: 'ORPHA:558'
  })
  diseaseId?: string;

  @ApiPropertyOptional({
    description: 'Símbolo do gene relacionado',
    example: 'FBN1'
  })
  gene?: string;

  @ApiPropertyOptional({
    description: 'Categoria HPO',
    enum: [
      'Phenotypic abnormality',
      'Clinical modifier',
      'Mortality/Aging',
      'Frequency',
      'Clinical course'
    ]
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Incluir apenas termos ativos',
    example: true
  })
  activeOnly?: boolean;
}

/**
 * DTO para análise de fenótipos
 */
export class HpoPhenotypeAnalysisDto {
  @ApiProperty({
    description: 'Lista de códigos HPO para análise',
    example: ['HP:0001166', 'HP:0000272', 'HP:0001519']
  })
  hpoTerms: string[];

  @ApiProperty({
    description: 'Doenças candidatas encontradas',
    example: [
      {
        orphaCode: 'ORPHA:558',
        name: 'Marfan syndrome',
        matchScore: 0.85,
        matchingTerms: ['HP:0001166', 'HP:0000272']
      }
    ]
  })
  candidateDiseases: HpoDiseaseCandidateDto[];

  @ApiProperty({
    description: 'Score total da análise',
    example: 0.75
  })
  overallScore: number;

  @ApiProperty({
    description: 'Termos não reconhecidos',
    example: []
  })
  unrecognizedTerms: string[];
}

/**
 * DTO para doença candidata em análise
 */
export class HpoDiseaseCandidateDto {
  @ApiProperty({
    description: 'Código Orphanet',
    example: 'ORPHA:558'
  })
  orphaCode: string;

  @ApiProperty({
    description: 'Nome da doença',
    example: 'Marfan syndrome'
  })
  name: string;

  @ApiProperty({
    description: 'Score de compatibilidade (0-1)',
    example: 0.85
  })
  matchScore: number;

  @ApiProperty({
    description: 'Termos HPO que fazem match',
    example: ['HP:0001166', 'HP:0000272']
  })
  matchingTerms: string[];

  @ApiProperty({
    description: 'Total de fenótipos conhecidos da doença',
    example: 15
  })
  totalKnownPhenotypes: number;
}

/**
 * DTO para estatísticas HPO
 */
export class HpoStatsDto {
  @ApiProperty({
    description: 'Total de termos HPO ativos',
    example: 15000
  })
  totalTerms: number;

  @ApiProperty({
    description: 'Total de termos obsoletos',
    example: 850
  })
  obsoleteTerms: number;

  @ApiProperty({
    description: 'Distribuição por categoria',
    example: {
      'Phenotypic abnormality': 13500,
      'Clinical modifier': 800,
      'Mortality/Aging': 200
    }
  })
  byCategory: Record<string, number>;

  @ApiProperty({
    description: 'Total de associações gene-fenótipo',
    example: 120000
  })
  totalGenePhenotypeAssociations: number;

  @ApiProperty({
    description: 'Total de associações doença-fenótipo',
    example: 85000
  })
  totalDiseasePhenotypeAssociations: number;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-11-01T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Versão da ontologia HPO',
    example: 'hp-2024-08-13'
  })
  version: string;
}
