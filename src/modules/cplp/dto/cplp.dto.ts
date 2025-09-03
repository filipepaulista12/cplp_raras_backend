/**
 * DTOs específicos para o módulo CPLP
 * Estruturas de dados para países de língua portuguesa
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para país CPLP básico
 */
export class CplpCountryDto {
  @ApiProperty({
    description: 'Código ISO 3166-1 alpha-2',
    example: 'BR'
  })
  countryCode: string;

  @ApiProperty({
    description: 'Nome oficial do país',
    example: 'República Federativa do Brasil'
  })
  officialName: string;

  @ApiProperty({
    description: 'Nome comum',
    example: 'Brasil'
  })
  commonName: string;

  @ApiProperty({
    description: 'Capital',
    example: 'Brasília'
  })
  capital: string;

  @ApiProperty({
    description: 'População estimada',
    example: 215300000
  })
  population: number;

  @ApiProperty({
    description: 'Data de adesão à CPLP',
    example: '1996-07-17T00:00:00.000Z'
  })
  cplpJoinDate: string;

  @ApiProperty({
    description: 'Status na CPLP',
    example: 'Membro fundador',
    enum: [
      'Membro fundador',
      'Membro efetivo',
      'Observador associado',
      'Observador consultivo'
    ]
  })
  cplpStatus: string;
}

/**
 * DTO para dados de saúde CPLP
 */
export class CplpHealthDataDto {
  @ApiProperty({
    description: 'Código do país',
    example: 'BR'
  })
  countryCode: string;

  @ApiPropertyOptional({
    description: 'Esperança de vida (anos)',
    example: 76.2
  })
  lifeExpectancy?: number;

  @ApiPropertyOptional({
    description: 'Taxa de mortalidade infantil (por 1000 nascimentos)',
    example: 13.4
  })
  infantMortalityRate?: number;

  @ApiPropertyOptional({
    description: 'Gasto público em saúde (% PIB)',
    example: 4.2
  })
  healthExpenditureGdp?: number;

  @ApiPropertyOptional({
    description: 'Médicos por 1000 habitantes',
    example: 2.2
  })
  physiciansPerThousand?: number;

  @ApiPropertyOptional({
    description: 'Leitos hospitalares por 1000 habitantes',
    example: 2.1
  })
  hospitalBedsPerThousand?: number;

  @ApiPropertyOptional({
    description: 'Centros de referência em doenças raras',
    example: 15
  })
  rareDiseasesCenters?: number;

  @ApiPropertyOptional({
    description: 'Legislação específica sobre doenças raras',
    example: true
  })
  rareDiseasePolicy?: boolean;

  @ApiProperty({
    description: 'Ano dos dados',
    example: 2023
  })
  dataYear: number;
}

/**
 * DTO para registros de doenças raras CPLP
 */
export class CplpRareDiseaseRecordDto {
  @ApiProperty({
    description: 'ID único do registro',
    example: 'CPLP-RD-BR-001'
  })
  recordId: string;

  @ApiProperty({
    description: 'País de origem',
    example: 'BR'
  })
  countryCode: string;

  @ApiProperty({
    description: 'Código Orphanet',
    example: 'ORPHA:558'
  })
  orphaCode: string;

  @ApiProperty({
    description: 'Nome da doença',
    example: 'Síndrome de Marfan'
  })
  diseaseName: string;

  @ApiPropertyOptional({
    description: 'Nome local da doença',
    example: 'Síndrome de Marfan'
  })
  localName?: string;

  @ApiProperty({
    description: 'Casos reportados',
    example: 1250
  })
  reportedCases: number;

  @ApiPropertyOptional({
    description: 'Prevalência estimada por 100.000 hab',
    example: 0.58
  })
  prevalencePer100k?: number;

  @ApiPropertyOptional({
    description: 'Centro de referência',
    example: 'Hospital das Clínicas - FMUSP'
  })
  referenceCenter?: string;

  @ApiPropertyOptional({
    description: 'Tratamentos disponíveis localmente',
    example: [
      'Betabloqueadores',
      'Cirurgia vascular',
      'Acompanhamento cardiológico'
    ]
  })
  availableTreatments?: string[];

  @ApiProperty({
    description: 'Data do último registro',
    example: '2024-08-15T00:00:00.000Z'
  })
  lastUpdated: string;
}

/**
 * DTO para especialistas CPLP
 */
export class CplpSpecialistDto {
  @ApiProperty({
    description: 'ID único do especialista',
    example: 'CPLP-SP-001'
  })
  specialistId: string;

  @ApiProperty({
    description: 'Nome do especialista',
    example: 'Dr. João Silva'
  })
  name: string;

  @ApiProperty({
    description: 'País',
    example: 'BR'
  })
  countryCode: string;

  @ApiProperty({
    description: 'Especialidades',
    example: ['Genética Médica', 'Doenças Raras']
  })
  specialties: string[];

  @ApiProperty({
    description: 'Instituição',
    example: 'Hospital das Clínicas - FMUSP'
  })
  institution: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'São Paulo'
  })
  city: string;

  @ApiPropertyOptional({
    description: 'Doenças de especialização',
    example: ['ORPHA:558', 'ORPHA:773']
  })
  specializationDiseases?: string[];

  @ApiProperty({
    description: 'Email de contato (se público)',
    example: 'j.silva@hospital.org.br'
  })
  contactEmail: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato (se público)',
    example: '+55 11 9999-9999'
  })
  contactPhone?: string;

  @ApiProperty({
    description: 'Status ativo',
    example: true
  })
  isActive: boolean;
}

/**
 * DTO para recursos CPLP
 */
export class CplpResourceDto {
  @ApiProperty({
    description: 'ID único do recurso',
    example: 'CPLP-RES-001'
  })
  resourceId: string;

  @ApiProperty({
    description: 'Título do recurso',
    example: 'Guia de Doenças Raras em Português'
  })
  title: string;

  @ApiProperty({
    description: 'Tipo de recurso',
    example: 'guideline',
    enum: [
      'guideline',
      'protocol',
      'educational_material',
      'research_paper',
      'clinical_trial',
      'registry',
      'support_group'
    ]
  })
  type: string;

  @ApiProperty({
    description: 'Descrição do recurso',
    example: 'Guia completo sobre diagnóstico e tratamento de doenças raras'
  })
  description: string;

  @ApiProperty({
    description: 'País de origem',
    example: 'PT'
  })
  countryCode: string;

  @ApiProperty({
    description: 'Idioma',
    example: 'pt',
    enum: ['pt', 'pt-BR', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST', 'pt-TL']
  })
  language: string;

  @ApiPropertyOptional({
    description: 'URL do recurso',
    example: 'https://exemplo.pt/guia-doencas-raras'
  })
  url?: string;

  @ApiProperty({
    description: 'Data de publicação',
    example: '2024-06-01T00:00:00.000Z'
  })
  publishDate: string;

  @ApiPropertyOptional({
    description: 'Doenças relacionadas',
    example: ['ORPHA:558', 'ORPHA:773']
  })
  relatedDiseases?: string[];

  @ApiProperty({
    description: 'Status de acesso',
    example: 'open',
    enum: ['open', 'restricted', 'subscription']
  })
  accessStatus: string;
}

/**
 * DTO para busca CPLP
 */
export class CplpSearchDto {
  @ApiPropertyOptional({
    description: 'Código do país específico',
    example: 'BR'
  })
  countryCode?: string;

  @ApiPropertyOptional({
    description: 'Buscar por doença',
    example: 'marfan'
  })
  disease?: string;

  @ApiPropertyOptional({
    description: 'Código Orphanet',
    example: 'ORPHA:558'
  })
  orphaCode?: string;

  @ApiPropertyOptional({
    description: 'Especialidade médica',
    example: 'Genética Médica'
  })
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Tipo de recurso',
    enum: [
      'guideline',
      'protocol',
      'educational_material',
      'research_paper',
      'clinical_trial',
      'registry',
      'support_group'
    ]
  })
  resourceType?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'Lisboa'
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'Idioma preferencial',
    enum: ['pt', 'pt-BR', 'pt-AO', 'pt-MZ', 'pt-CV', 'pt-GW', 'pt-ST', 'pt-TL']
  })
  language?: string;
}

/**
 * DTO para estatísticas CPLP
 */
export class CplpStatsDto {
  @ApiProperty({
    description: 'Total de países membros',
    example: 9
  })
  totalCountries: number;

  @ApiProperty({
    description: 'População total CPLP',
    example: 290000000
  })
  totalPopulation: number;

  @ApiProperty({
    description: 'Registros de doenças raras por país',
    example: {
      'BR': 15420,
      'PT': 8950,
      'AO': 1250,
      'MZ': 980,
      'CV': 45,
      'GW': 32,
      'ST': 28,
      'TL': 38
    }
  })
  diseaseRecordsByCountry: Record<string, number>;

  @ApiProperty({
    description: 'Especialistas cadastrados por país',
    example: {
      'BR': 1250,
      'PT': 850,
      'AO': 45,
      'MZ': 38
    }
  })
  specialistsByCountry: Record<string, number>;

  @ApiProperty({
    description: 'Recursos disponíveis por tipo',
    example: {
      'guideline': 125,
      'protocol': 89,
      'educational_material': 234,
      'research_paper': 567
    }
  })
  resourcesByType: Record<string, number>;

  @ApiProperty({
    description: 'Centros de referência totais',
    example: 89
  })
  totalReferenceCenters: number;

  @ApiProperty({
    description: 'Países com legislação específica',
    example: 5
  })
  countriesWithPolicy: number;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-09-01T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Versão dos dados CPLP',
    example: '2024.3'
  })
  version: string;
}
