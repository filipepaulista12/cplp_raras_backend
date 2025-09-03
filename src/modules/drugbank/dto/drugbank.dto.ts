/**
 * DTOs específicos para o módulo DrugBank
 * Estruturas de dados para medicamentos e interações
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para medicamento DrugBank básico
 */
export class DrugBankDrugDto {
  @ApiProperty({
    description: 'ID único DrugBank',
    example: 'DB00945'
  })
  drugbankId: string;

  @ApiProperty({
    description: 'Nome do medicamento',
    example: 'Aspirin'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Nomes alternativos/sinônimos',
    example: ['Acetylsalicylic acid', 'ASA']
  })
  synonyms?: string[];

  @ApiProperty({
    description: 'Tipo de medicamento',
    example: 'Small molecule',
    enum: [
      'Small molecule',
      'Biotech',
      'Approved drug',
      'Investigational drug',
      'Experimental drug',
      'Withdrawn drug'
    ]
  })
  drugType: string;

  @ApiProperty({
    description: 'Status regulatório',
    example: 'Approved',
    enum: ['Approved', 'Investigational', 'Experimental', 'Withdrawn', 'Illicit']
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Descrição do medicamento',
    example: 'Aspirin is a salicylate used to treat pain, fever, and inflammation...'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Fórmula molecular',
    example: 'C9H8O4'
  })
  formula?: string;

  @ApiPropertyOptional({
    description: 'Peso molecular',
    example: 180.16
  })
  molecularWeight?: number;
}

/**
 * DTO para medicamento DrugBank detalhado
 */
export class DrugBankDrugDetailDto extends DrugBankDrugDto {
  @ApiPropertyOptional({
    description: 'Mecanismo de ação',
    example: 'Aspirin works by inhibiting cyclooxygenase enzymes...'
  })
  mechanismOfAction?: string;

  @ApiPropertyOptional({
    description: 'Indicações aprovadas',
    example: [
      'Pain relief',
      'Fever reduction',
      'Inflammation reduction',
      'Cardiovascular protection'
    ]
  })
  indications?: string[];

  @ApiPropertyOptional({
    description: 'Contraindicações',
    example: [
      'Hypersensitivity to salicylates',
      'Active peptic ulcer disease',
      'Severe renal impairment'
    ]
  })
  contraindications?: string[];

  @ApiPropertyOptional({
    description: 'Alvos moleculares',
    example: [
      {
        name: 'Prostaglandin G/H synthase 1',
        type: 'enzyme',
        action: 'inhibitor'
      }
    ]
  })
  targets?: DrugTargetDto[];

  @ApiPropertyOptional({
    description: 'Vias metabólicas',
    example: [
      {
        pathway: 'Arachidonic acid metabolism',
        role: 'inhibitor'
      }
    ]
  })
  pathways?: DrugPathwayDto[];

  @ApiPropertyOptional({
    description: 'Interações medicamentosas',
    example: [
      {
        drugbankId: 'DB00682',
        name: 'Warfarin',
        severity: 'Major',
        description: 'Increased risk of bleeding'
      }
    ]
  })
  interactions?: DrugInteractionDto[];

  @ApiPropertyOptional({
    description: 'Farmacocinética',
    example: {
      absorption: 'Rapidly absorbed from GI tract',
      distribution: 'Widely distributed',
      metabolism: 'Hepatic',
      elimination: 'Renal'
    }
  })
  pharmacokinetics?: DrugPharmacokineticsDto;

  @ApiPropertyOptional({
    description: 'Doenças relacionadas',
    example: [
      {
        orphaCode: 'ORPHA:558',
        name: 'Marfan syndrome',
        relationship: 'treatment'
      }
    ]
  })
  relatedDiseases?: DrugDiseaseRelationDto[];
}

/**
 * DTO para alvo molecular do medicamento
 */
export class DrugTargetDto {
  @ApiProperty({
    description: 'Nome do alvo',
    example: 'Prostaglandin G/H synthase 1'
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do alvo',
    example: 'enzyme',
    enum: ['enzyme', 'receptor', 'transporter', 'carrier']
  })
  type: string;

  @ApiProperty({
    description: 'Ação no alvo',
    example: 'inhibitor',
    enum: ['inhibitor', 'activator', 'agonist', 'antagonist', 'modulator']
  })
  action: string;

  @ApiPropertyOptional({
    description: 'ID UniProt',
    example: 'P23219'
  })
  uniprotId?: string;

  @ApiPropertyOptional({
    description: 'Símbolo do gene',
    example: 'PTGS1'
  })
  geneSymbol?: string;
}

/**
 * DTO para via metabólica
 */
export class DrugPathwayDto {
  @ApiProperty({
    description: 'Nome da via',
    example: 'Arachidonic acid metabolism'
  })
  pathway: string;

  @ApiProperty({
    description: 'Papel do medicamento na via',
    example: 'inhibitor',
    enum: ['inhibitor', 'activator', 'substrate', 'product', 'cofactor']
  })
  role: string;

  @ApiPropertyOptional({
    description: 'ID KEGG da via',
    example: 'hsa00590'
  })
  keggId?: string;
}

/**
 * DTO para interação medicamentosa
 */
export class DrugInteractionDto {
  @ApiProperty({
    description: 'ID DrugBank do medicamento interagente',
    example: 'DB00682'
  })
  drugbankId: string;

  @ApiProperty({
    description: 'Nome do medicamento interagente',
    example: 'Warfarin'
  })
  name: string;

  @ApiProperty({
    description: 'Severidade da interação',
    example: 'Major',
    enum: ['Minor', 'Moderate', 'Major', 'Contraindicated']
  })
  severity: string;

  @ApiProperty({
    description: 'Descrição da interação',
    example: 'Increased risk of bleeding due to enhanced anticoagulant effect'
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Mecanismo da interação',
    example: 'Pharmacodynamic synergism'
  })
  mechanism?: string;
}

/**
 * DTO para farmacocinética
 */
export class DrugPharmacokineticsDto {
  @ApiPropertyOptional({
    description: 'Absorção',
    example: 'Rapidly absorbed from GI tract (80-100%)'
  })
  absorption?: string;

  @ApiPropertyOptional({
    description: 'Distribuição',
    example: 'Widely distributed; crosses blood-brain barrier'
  })
  distribution?: string;

  @ApiPropertyOptional({
    description: 'Metabolismo',
    example: 'Hepatic via glucuronidation and oxidation'
  })
  metabolism?: string;

  @ApiPropertyOptional({
    description: 'Eliminação',
    example: 'Renal (75%) and fecal (25%)'
  })
  elimination?: string;

  @ApiPropertyOptional({
    description: 'Meia-vida (horas)',
    example: 2.5
  })
  halfLife?: number;

  @ApiPropertyOptional({
    description: 'Ligação proteica (%)',
    example: 99.5
  })
  proteinBinding?: number;
}

/**
 * DTO para relação medicamento-doença
 */
export class DrugDiseaseRelationDto {
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
    description: 'Tipo de relação',
    example: 'treatment',
    enum: [
      'treatment',
      'prevention',
      'management',
      'contraindicated',
      'investigational'
    ]
  })
  relationship: string;

  @ApiPropertyOptional({
    description: 'Evidência clínica',
    example: 'Phase III trial',
    enum: [
      'FDA approved',
      'Phase III trial',
      'Phase II trial',
      'Phase I trial',
      'Case reports',
      'Expert opinion'
    ]
  })
  evidence?: string;
}

/**
 * DTO para busca DrugBank
 */
export class DrugBankSearchDto {
  @ApiPropertyOptional({
    description: 'Termo de busca por nome',
    example: 'aspirin'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'ID DrugBank específico',
    example: 'DB00945'
  })
  drugbankId?: string;

  @ApiPropertyOptional({
    description: 'Fórmula molecular',
    example: 'C9H8O4'
  })
  formula?: string;

  @ApiPropertyOptional({
    description: 'Tipo de medicamento',
    enum: ['Small molecule', 'Biotech', 'Approved drug', 'Investigational drug']
  })
  drugType?: string;

  @ApiPropertyOptional({
    description: 'Status regulatório',
    enum: ['Approved', 'Investigational', 'Experimental', 'Withdrawn']
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Alvo molecular',
    example: 'PTGS1'
  })
  target?: string;

  @ApiPropertyOptional({
    description: 'Indicação terapêutica',
    example: 'pain relief'
  })
  indication?: string;

  @ApiPropertyOptional({
    description: 'Código da doença relacionada',
    example: 'ORPHA:558'
  })
  diseaseCode?: string;
}

/**
 * DTO para estatísticas DrugBank
 */
export class DrugBankStatsDto {
  @ApiProperty({
    description: 'Total de medicamentos aprovados',
    example: 13500
  })
  approvedDrugs: number;

  @ApiProperty({
    description: 'Total de medicamentos investigacionais',
    example: 6200
  })
  investigationalDrugs: number;

  @ApiProperty({
    description: 'Total de pequenas moléculas',
    example: 11800
  })
  smallMolecules: number;

  @ApiProperty({
    description: 'Total de medicamentos biotecnológicos',
    example: 1900
  })
  biotechDrugs: number;

  @ApiProperty({
    description: 'Distribuição por status',
    example: {
      'Approved': 13500,
      'Investigational': 6200,
      'Experimental': 2300,
      'Withdrawn': 150
    }
  })
  byStatus: Record<string, number>;

  @ApiProperty({
    description: 'Total de interações conhecidas',
    example: 485000
  })
  totalInteractions: number;

  @ApiProperty({
    description: 'Total de alvos moleculares',
    example: 4900
  })
  totalTargets: number;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-10-15T00:00:00.000Z'
  })
  lastUpdated: string;

  @ApiProperty({
    description: 'Versão da base DrugBank',
    example: '5.1.11'
  })
  version: string;
}
