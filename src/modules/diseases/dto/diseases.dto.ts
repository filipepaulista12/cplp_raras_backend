/**
 * DTOs específicos para o módulo Diseases (Consultas Unificadas)
 * Estruturas de dados para pesquisa agregada de doenças raras
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para doença unificada básica
 */
export class UnifiedDiseaseDto {
  @ApiProperty({
    description: 'Código principal da doença',
    example: 'ORPHA:558'
  })
  primaryCode: string;

  @ApiProperty({
    description: 'Nome da doença',
    example: 'Marfan syndrome'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Nome em português',
    example: 'Síndrome de Marfan'
  })
  namePortuguese?: string;

  @ApiPropertyOptional({
    description: 'Sinônimos da doença',
    example: ['Marfan disease', 'Arachnodactyly contractural', 'Beals syndrome']
  })
  synonyms?: string[];

  @ApiProperty({
    description: 'Fontes de dados',
    example: ['orphanet', 'hpo', 'cplp']
  })
  dataSources: string[];

  @ApiProperty({
    description: 'Códigos alternativos',
    example: {
      'orphanet': 'ORPHA:558',
      'omim': '154700',
      'icd10': 'Q87.4',
      'icd11': 'LD27.0Y'
    }
  })
  alternativeCodes: Record<string, string>;

  @ApiProperty({
    description: 'Categoria principal',
    example: 'Connective tissue disorder',
    enum: [
      'Genetic disorder',
      'Connective tissue disorder',
      'Metabolic disorder',
      'Neurological disorder',
      'Cardiovascular disorder',
      'Immunological disorder',
      'Oncological disorder',
      'Other'
    ]
  })
  category: string;

  @ApiProperty({
    description: 'Score de confiança dos dados (0-1)',
    example: 0.95
  })
  confidenceScore: number;

  @ApiProperty({
    description: 'Última atualização',
    example: '2024-09-01T00:00:00.000Z'
  })
  lastUpdated: string;
}

/**
 * DTO para doença unificada detalhada
 */
export class UnifiedDiseaseDetailDto extends UnifiedDiseaseDto {
  @ApiPropertyOptional({
    description: 'Definição clínica',
    example: 'Marfan syndrome is a multisystem connective tissue disorder...'
  })
  definition?: string;

  @ApiPropertyOptional({
    description: 'Sinais e sintomas principais',
    example: [
      {
        hpoCode: 'HP:0001166',
        term: 'Arachnodactyly',
        frequency: 'Very frequent (99-80%)',
        sources: ['orphanet', 'hpo']
      }
    ]
  })
  symptoms?: UnifiedSymptomDto[];

  @ApiPropertyOptional({
    description: 'Genes associados',
    example: [
      {
        symbol: 'FBN1',
        name: 'fibrillin 1',
        association: 'Disease-causing germline mutation(s) in',
        evidence: 'Strong',
        sources: ['orphanet', 'hpo']
      }
    ]
  })
  associatedGenes?: UnifiedGeneDto[];

  @ApiPropertyOptional({
    description: 'Tratamentos disponíveis',
    example: [
      {
        type: 'Medication',
        name: 'Beta-blockers',
        indication: 'Cardiovascular protection',
        availability: ['BR', 'PT', 'AO'],
        sources: ['drugbank', 'cplp']
      }
    ]
  })
  treatments?: UnifiedTreatmentDto[];

  @ApiPropertyOptional({
    description: 'Dados epidemiológicos',
    example: {
      globalPrevalence: '1/5000',
      cplpData: {
        'BR': { cases: 1250, prevalence: '0.58/100k' },
        'PT': { cases: 650, prevalence: '6.3/100k' }
      }
    }
  })
  epidemiology?: UnifiedEpidemiologyDto;

  @ApiPropertyOptional({
    description: 'Recursos disponíveis na CPLP',
    example: [
      {
        type: 'Reference center',
        name: 'Centro de Genética Médica',
        country: 'BR',
        city: 'São Paulo',
        contact: 'genetica@hospital.br'
      }
    ]
  })
  cplpResources?: UnifiedCplpResourceDto[];

  @ApiPropertyOptional({
    description: 'Critérios diagnósticos',
    example: [
      'Ectopia lentis',
      'Aortic root dilatation Z-score ≥2',
      'Family history of Marfan syndrome'
    ]
  })
  diagnosticCriteria?: string[];

  @ApiPropertyOptional({
    description: 'Prognóstico',
    example: {
      lifeExpectancy: 'Near normal with proper management',
      complications: ['Aortic dissection', 'Pneumothorax', 'Retinal detachment']
    }
  })
  prognosis?: UnifiedPrognosisDto;
}

/**
 * DTO para sintoma unificado
 */
export class UnifiedSymptomDto {
  @ApiProperty({
    description: 'Código HPO',
    example: 'HP:0001166'
  })
  hpoCode: string;

  @ApiProperty({
    description: 'Termo do sintoma',
    example: 'Arachnodactyly'
  })
  term: string;

  @ApiPropertyOptional({
    description: 'Termo em português',
    example: 'Aracnodactilia'
  })
  termPortuguese?: string;

  @ApiProperty({
    description: 'Frequência do sintoma',
    example: 'Very frequent (99-80%)',
    enum: [
      'Very frequent (99-80%)',
      'Frequent (79-30%)',
      'Occasional (29-5%)',
      'Very rare (<4-1%)',
      'Excluded (0%)'
    ]
  })
  frequency: string;

  @ApiProperty({
    description: 'Fontes que confirmam o sintoma',
    example: ['orphanet', 'hpo']
  })
  sources: string[];

  @ApiPropertyOptional({
    description: 'Se é critério diagnóstico',
    example: true
  })
  isDiagnostic?: boolean;

  @ApiProperty({
    description: 'Score de confiança (0-1)',
    example: 0.98
  })
  confidence: number;
}

/**
 * DTO para gene unificado
 */
export class UnifiedGeneDto {
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
    description: 'Tipo de associação gene-doença',
    example: 'Disease-causing germline mutation(s) in'
  })
  association: string;

  @ApiProperty({
    description: 'Nível de evidência',
    example: 'Strong',
    enum: ['Strong', 'Moderate', 'Limited', 'Conflicting']
  })
  evidence: string;

  @ApiProperty({
    description: 'Fontes que confirmam a associação',
    example: ['orphanet', 'hpo', 'omim']
  })
  sources: string[];

  @ApiPropertyOptional({
    description: 'Localização cromossômica',
    example: '15q21.1'
  })
  chromosomeLocation?: string;

  @ApiPropertyOptional({
    description: 'ID Entrez do gene',
    example: 2200
  })
  entrezId?: number;
}

/**
 * DTO para tratamento unificado
 */
export class UnifiedTreatmentDto {
  @ApiProperty({
    description: 'Tipo de tratamento',
    example: 'Medication',
    enum: [
      'Medication',
      'Surgery',
      'Physical therapy',
      'Genetic counseling',
      'Supportive care',
      'Experimental'
    ]
  })
  type: string;

  @ApiProperty({
    description: 'Nome do tratamento',
    example: 'Beta-blockers'
  })
  name: string;

  @ApiProperty({
    description: 'Indicação específica',
    example: 'Cardiovascular protection'
  })
  indication: string;

  @ApiProperty({
    description: 'Disponibilidade por país CPLP',
    example: ['BR', 'PT', 'AO']
  })
  availability: string[];

  @ApiProperty({
    description: 'Fontes de informação',
    example: ['drugbank', 'cplp']
  })
  sources: string[];

  @ApiPropertyOptional({
    description: 'Eficácia reportada',
    example: 'High',
    enum: ['High', 'Moderate', 'Low', 'Unknown']
  })
  efficacy?: string;

  @ApiPropertyOptional({
    description: 'ID DrugBank (se medicamento)',
    example: 'DB00612'
  })
  drugbankId?: string;
}

/**
 * DTO para epidemiologia unificada
 */
export class UnifiedEpidemiologyDto {
  @ApiPropertyOptional({
    description: 'Prevalência global estimada',
    example: '1/5000'
  })
  globalPrevalence?: string;

  @ApiPropertyOptional({
    description: 'Incidência ao nascimento',
    example: '1/5000 live births'
  })
  birthIncidence?: string;

  @ApiProperty({
    description: 'Dados específicos da CPLP',
    example: {
      'BR': { cases: 1250, prevalence: '0.58/100k' },
      'PT': { cases: 650, prevalence: '6.3/100k' }
    }
  })
  cplpData: Record<string, CplpEpidemiologyData>;

  @ApiPropertyOptional({
    description: 'Distribuição por gênero',
    example: {
      'male': '50%',
      'female': '50%'
    }
  })
  genderDistribution?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Idade típica de diagnóstico',
    example: 'Childhood to adulthood'
  })
  typicalDiagnosisAge?: string;
}

/**
 * Interface para dados epidemiológicos CPLP
 */
interface CplpEpidemiologyData {
  cases: number;
  prevalence: string;
}

/**
 * DTO para recurso CPLP unificado
 */
export class UnifiedCplpResourceDto {
  @ApiProperty({
    description: 'Tipo de recurso',
    example: 'Reference center',
    enum: [
      'Reference center',
      'Specialist',
      'Support group',
      'Research center',
      'Clinical trial',
      'Educational material'
    ]
  })
  type: string;

  @ApiProperty({
    description: 'Nome do recurso',
    example: 'Centro de Genética Médica'
  })
  name: string;

  @ApiProperty({
    description: 'País',
    example: 'BR'
  })
  country: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Contato',
    example: 'genetica@hospital.br'
  })
  contact?: string;

  @ApiPropertyOptional({
    description: 'Website',
    example: 'https://hospital.br/genetica'
  })
  website?: string;

  @ApiProperty({
    description: 'Status ativo',
    example: true
  })
  isActive: boolean;
}

/**
 * DTO para prognóstico unificado
 */
export class UnifiedPrognosisDto {
  @ApiPropertyOptional({
    description: 'Expectativa de vida',
    example: 'Near normal with proper management'
  })
  lifeExpectancy?: string;

  @ApiPropertyOptional({
    description: 'Qualidade de vida esperada',
    example: 'Good with regular monitoring'
  })
  qualityOfLife?: string;

  @ApiPropertyOptional({
    description: 'Complicações possíveis',
    example: ['Aortic dissection', 'Pneumothorax', 'Retinal detachment']
  })
  complications?: string[];

  @ApiPropertyOptional({
    description: 'Fatores prognósticos',
    example: ['Early diagnosis', 'Regular cardiac monitoring', 'Genetic counseling']
  })
  prognosticFactors?: string[];
}

/**
 * DTO para busca unificada
 */
export class UnifiedSearchDto {
  @ApiPropertyOptional({
    description: 'Termo de busca geral',
    example: 'marfan syndrome'
  })
  query?: string;

  @ApiPropertyOptional({
    description: 'Código específico (qualquer tipo)',
    example: 'ORPHA:558'
  })
  code?: string;

  @ApiPropertyOptional({
    description: 'Sintomas HPO (separados por vírgula)',
    example: 'HP:0001166,HP:0000272,HP:0001519'
  })
  symptoms?: string;

  @ApiPropertyOptional({
    description: 'Gene de interesse',
    example: 'FBN1'
  })
  gene?: string;

  @ApiPropertyOptional({
    description: 'Categoria da doença',
    enum: [
      'Genetic disorder',
      'Connective tissue disorder',
      'Metabolic disorder',
      'Neurological disorder',
      'Cardiovascular disorder',
      'Immunological disorder',
      'Oncological disorder',
      'Other'
    ]
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Países CPLP de interesse',
    example: 'BR,PT'
  })
  countries?: string;

  @ApiPropertyOptional({
    description: 'Incluir apenas doenças com tratamento disponível',
    example: true
  })
  withTreatment?: boolean;

  @ApiPropertyOptional({
    description: 'Score mínimo de confiança (0-1)',
    example: 0.7
  })
  minConfidence?: number;
}

/**
 * DTO para estatísticas de consulta unificada
 */
export class UnifiedStatsDto {
  @ApiProperty({
    description: 'Total de doenças unificadas',
    example: 8500
  })
  totalDiseases: number;

  @ApiProperty({
    description: 'Cobertura por fonte de dados',
    example: {
      'orphanet': 7200,
      'hpo': 6800,
      'drugbank': 3400,
      'cplp': 2100
    }
  })
  coverageBySource: Record<string, number>;

  @ApiProperty({
    description: 'Doenças com dados CPLP',
    example: 2100
  })
  diseasesWithCplpData: number;

  @ApiProperty({
    description: 'Doenças com tratamento identificado',
    example: 3400
  })
  diseasesWithTreatment: number;

  @ApiProperty({
    description: 'Score médio de confiança',
    example: 0.87
  })
  averageConfidenceScore: number;

  @ApiProperty({
    description: 'Distribuição por categoria',
    example: {
      'Genetic disorder': 4200,
      'Neurological disorder': 1800,
      'Metabolic disorder': 1200,
      'Other': 1300
    }
  })
  distributionByCategory: Record<string, number>;

  @ApiProperty({
    description: 'Data da última sincronização',
    example: '2024-09-03T06:00:00.000Z'
  })
  lastSynchronization: string;
}
