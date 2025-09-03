/**
 * SCRIPT DE DEMONSTRAÇÃO - GARD BRASILEIRO
 * Cria dados de exemplo para testar o sistema completo
 * Simula importação do GARD com dados fictícios para desenvolvimento
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// =====================================================================================
// DADOS FICTÍCIOS PARA DEMONSTRAÇÃO
// =====================================================================================

const SAMPLE_DISEASES = [
  {
    gard_id: '0001',
    name: 'Achondroplasia',
    synonyms: ['ACH', 'Dwarfism, achondroplastic', 'Chondrodysplasia'],
    definition: 'A form of short-limbed dwarfism caused by mutations in the FGFR3 gene.',
    symptoms: ['Short stature', 'Disproportionately short arms and legs', 'Large head', 'Prominent forehead'],
    causes: 'Mutations in the FGFR3 gene that affect bone and brain development',
    inheritance: 'Autosomal dominant',
    prevalence: '1 in 25,000 to 1 in 40,000 births',
    age_of_onset: 'Congenital',
    icd10_codes: ['Q77.4'],
    orpha_code: '15',
    omim_codes: ['100800'],
    category: 'Birth defects',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/123456'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0001',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0002',
    name: 'Wilson disease',
    synonyms: ['Hepatolenticular degeneration', 'WD'],
    definition: 'A genetic disorder that prevents the body from removing extra copper.',
    symptoms: ['Liver problems', 'Neurological symptoms', 'Psychiatric symptoms', 'Kayser-Fleischer rings'],
    causes: 'Mutations in the ATP7B gene affecting copper transport',
    inheritance: 'Autosomal recessive',
    prevalence: '1 in 30,000 individuals',
    age_of_onset: 'Childhood to early adulthood',
    icd10_codes: ['E83.0'],
    orpha_code: '905',
    omim_codes: ['277900'],
    category: 'Genetic diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/789012'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0002',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0003',
    name: 'Marfan syndrome',
    synonyms: ['MFS', 'Marfan disorder'],
    definition: 'A connective tissue disorder that affects the heart, eyes, blood vessels, and skeleton.',
    symptoms: ['Tall stature', 'Long limbs', 'Heart problems', 'Eye problems', 'Spine curvature'],
    causes: 'Mutations in the FBN1 gene affecting connective tissue',
    inheritance: 'Autosomal dominant',
    prevalence: '1 in 5,000 individuals',
    age_of_onset: 'Variable',
    icd10_codes: ['Q87.4'],
    orpha_code: '558',
    omim_codes: ['154700'],
    category: 'Birth defects',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/345678'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0003',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0004',
    name: 'Huntington disease',
    synonyms: ['HD', 'Huntington chorea', 'Huntingtons disease'],
    definition: 'A progressive breakdown of nerve cells in the brain affecting movement, cognition and emotions.',
    symptoms: ['Movement problems', 'Cognitive decline', 'Emotional problems', 'Progressive symptoms'],
    causes: 'Mutations in the HTT gene causing progressive neurodegeneration',
    inheritance: 'Autosomal dominant',
    prevalence: '3 to 7 per 100,000 individuals',
    age_of_onset: '30 to 50 years',
    icd10_codes: ['G10'],
    orpha_code: '399',
    omim_codes: ['143100'],
    category: 'Neurological diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/456789'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0004',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0005',
    name: 'Cystic fibrosis',
    synonyms: ['CF', 'Mucoviscidosis'],
    definition: 'A genetic disorder affecting the lungs and digestive system with thick, sticky mucus.',
    symptoms: ['Persistent cough', 'Lung infections', 'Poor weight gain', 'Salty-tasting skin'],
    causes: 'Mutations in the CFTR gene affecting chloride transport',
    inheritance: 'Autosomal recessive', 
    prevalence: '1 in 2,500 to 1 in 3,500 births',
    age_of_onset: 'Infancy',
    icd10_codes: ['E84'],
    orpha_code: '586',
    omim_codes: ['219700'],
    category: 'Respiratory diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/567890'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0005',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0006',
    name: 'Sickle cell disease',
    synonyms: ['SCD', 'Sickle cell anemia', 'Hemoglobin SS disease'],
    definition: 'A group of blood disorders where red blood cells become sickle-shaped.',
    symptoms: ['Anemia', 'Pain episodes', 'Infections', 'Delayed growth', 'Vision problems'],
    causes: 'Mutations in the HBB gene affecting hemoglobin production',
    inheritance: 'Autosomal recessive',
    prevalence: '1 in 365 African American births',
    age_of_onset: 'Early childhood',
    icd10_codes: ['D57'],
    orpha_code: '232',
    omim_codes: ['603903'],
    category: 'Blood diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/678901'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0006',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0007', 
    name: 'Spinal muscular atrophy',
    synonyms: ['SMA', 'Werdnig-Hoffmann disease', 'Kugelberg-Welander disease'],
    definition: 'A genetic disorder that affects motor neurons, causing muscle weakness and atrophy.',
    symptoms: ['Muscle weakness', 'Poor muscle tone', 'Difficulty moving', 'Breathing problems'],
    causes: 'Mutations in the SMN1 gene affecting motor neuron function',
    inheritance: 'Autosomal recessive',
    prevalence: '1 in 6,000 to 1 in 10,000 births',
    age_of_onset: 'Variable',
    icd10_codes: ['G12.0', 'G12.1', 'G12.9'],
    orpha_code: '83330',
    omim_codes: ['253300', '253400', '253550'],
    category: 'Neurological diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/789012'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0007',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0008',
    name: 'Phenylketonuria',
    synonyms: ['PKU', 'Classical phenylketonuria', 'Phenylalanine hydroxylase deficiency'],
    definition: 'A genetic disorder where the body cannot break down the amino acid phenylalanine.',
    symptoms: ['Intellectual disability', 'Seizures', 'Skin disorders', 'Behavioral problems'],
    causes: 'Mutations in the PAH gene affecting phenylalanine metabolism',
    inheritance: 'Autosomal recessive',
    prevalence: '1 in 10,000 to 1 in 15,000 births',
    age_of_onset: 'Infancy',
    icd10_codes: ['E70.1'],
    orpha_code: '716',
    omim_codes: ['261600'],
    category: 'Endocrine diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/890123'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0008',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0009',
    name: 'Tay-Sachs disease',
    synonyms: ['TSD', 'GM2 gangliosidosis type I', 'Hexosaminidase A deficiency'],
    definition: 'A rare genetic disorder that progressively destroys nerve cells in the brain and spinal cord.',
    symptoms: ['Loss of motor skills', 'Increased startle response', 'Progressive blindness', 'Seizures'],
    causes: 'Mutations in the HEXA gene causing enzyme deficiency',
    inheritance: 'Autosomal recessive',
    prevalence: '1 in 320,000 births globally, higher in some populations',
    age_of_onset: 'Infancy',
    icd10_codes: ['E75.0'],
    orpha_code: '845',
    omim_codes: ['272800'],
    category: 'Neurological diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/901234'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0009',
    last_updated: '2024-01-15T10:00:00Z'
  },
  {
    gard_id: '0010',
    name: 'Duchenne muscular dystrophy',
    synonyms: ['DMD', 'Duchenne MD', 'Pseudohypertrophic muscular dystrophy'],
    definition: 'A genetic disorder causing progressive muscle degeneration and weakness.',
    symptoms: ['Progressive muscle weakness', 'Delayed walking', 'Frequent falls', 'Enlarged calf muscles'],
    causes: 'Mutations in the DMD gene affecting dystrophin protein production',
    inheritance: 'X-linked recessive',
    prevalence: '1 in 3,500 to 1 in 5,000 male births',
    age_of_onset: 'Early childhood',
    icd10_codes: ['G71.0'],
    orpha_code: '98896',
    omim_codes: ['310200'],
    category: 'Neurological diseases',
    sources: ['https://pubmed.ncbi.nlm.nih.gov/012345'],
    gard_url: 'https://rarediseases.info.nih.gov/diseases/0010',
    last_updated: '2024-01-15T10:00:00Z'
  }
];

// Categorias para o sistema
const CATEGORIES = [
  { name_en: 'Birth defects', name_pt: 'Defeitos congênitos', diseases: ['0001', '0003'] },
  { name_en: 'Blood diseases', name_pt: 'Doenças do sangue', diseases: ['0006'] },
  { name_en: 'Endocrine diseases', name_pt: 'Doenças endócrinas', diseases: ['0008'] },
  { name_en: 'Genetic diseases', name_pt: 'Doenças genéticas', diseases: ['0002'] },
  { name_en: 'Neurological diseases', name_pt: 'Doenças neurológicas', diseases: ['0004', '0007', '0009', '0010'] },
  { name_en: 'Respiratory diseases', name_pt: 'Doenças respiratórias', diseases: ['0005'] }
];

// Dados epidemiológicos para países CPLP
const CPLP_EPIDEMIOLOGY = [
  {
    disease_id: '0001',
    country_code: 'BRA',
    country_name: 'Brasil',
    prevalence_local: '1 em 30.000 nascimentos',
    incidence_local: 'Aproximadamente 200 casos por ano',
    genetic_variants: ['G380R (comum na população brasileira)'],
    environmental_factors: ['Consanguinidade em algumas regiões'],
    diagnostic_availability: 'available',
    treatment_availability: 'available',
    specialist_availability: 'limited',
    covered_by_public_health: true,
    orphan_drug_policy: 'Disponível via SUS',
    data_source: 'Ministério da Saúde - SINASC',
    data_quality: 'confirmed'
  },
  {
    disease_id: '0002',
    country_code: 'BRA',
    country_name: 'Brasil',
    prevalence_local: '1 em 30.000 indivíduos',
    incidence_local: 'Estimados 7.000 casos no país',
    genetic_variants: ['H1069Q (frequente no Brasil)'],
    environmental_factors: ['Exposição ao cobre ambiental'],
    diagnostic_availability: 'available',
    treatment_availability: 'available',
    specialist_availability: 'available',
    covered_by_public_health: true,
    orphan_drug_policy: 'Penicilamina disponível via SUS',
    data_source: 'Registro Brasileiro de Doença de Wilson',
    data_quality: 'confirmed'
  }
];

// Organizações de apoio
const SUPPORT_ORGANIZATIONS = [
  {
    disease_id: '0001',
    name: 'Associação Brasileira de Acondroplasia',
    name_local: 'ABA',
    country_code: 'BRA',
    city: 'São Paulo',
    region: 'SP',
    organization_type: 'patient_association',
    website: 'https://www.acondroplasia.org.br',
    email: 'contato@acondroplasia.org.br',
    services_offered: ['Suporte psicológico', 'Orientação médica', 'Grupos de apoio'],
    languages_supported: ['pt-BR'],
    is_active: true,
    verified: true
  },
  {
    disease_id: '0002',
    name: 'Associação Wilson Brasil',
    country_code: 'BRA',
    city: 'Porto Alegre',
    region: 'RS',
    organization_type: 'patient_association',
    website: 'https://www.wilson.org.br',
    email: 'contato@wilson.org.br',
    services_offered: ['Informações sobre tratamento', 'Rede de apoio familiar', 'Advocacia'],
    languages_supported: ['pt-BR'],
    is_active: true,
    verified: true
  }
];

// =====================================================================================
// FUNÇÃO PRINCIPAL
// =====================================================================================

async function generateDemoData() {
  console.log('🚀 Gerando dados de demonstração para GARD Brasileiro...');
  
  const DATA_DIR = path.join(process.cwd(), 'data', 'demo');
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  // Gerar dados completos
  const demoData = {
    metadata: {
      generated_at: new Date().toISOString(),
      version: '1.0.0-demo',
      total_diseases: SAMPLE_DISEASES.length,
      description: 'Dados de demonstração para sistema GARD Brasileiro'
    },
    diseases: SAMPLE_DISEASES,
    categories: CATEGORIES,
    cplp_epidemiology: CPLP_EPIDEMIOLOGY,
    support_organizations: SUPPORT_ORGANIZATIONS
  };
  
  // Salvar JSON
  await fs.writeFile(
    path.join(DATA_DIR, 'gard-demo-complete.json'),
    JSON.stringify(demoData, null, 2)
  );
  
  // Gerar SQL de inserção
  const sql = generateDemoSQL(demoData);
  await fs.writeFile(
    path.join(DATA_DIR, 'gard-demo-insert.sql'),
    sql
  );
  
  // Gerar dados para Next.js (formato simplificado)
  const nextjsData = SAMPLE_DISEASES.map(disease => ({
    id: `gard-br-${disease.gard_id}`,
    name: disease.name,
    synonyms: disease.synonyms,
    category: disease.category,
    description: disease.definition,
    symptoms: disease.symptoms,
    prevalence: disease.prevalence,
    inheritance: disease.inheritance,
    icd10: disease.icd10_codes?.[0],
    orpha: disease.orpha_code,
    omim: disease.omim_codes?.[0]
  }));
  
  await fs.writeFile(
    path.join(DATA_DIR, 'diseases-nextjs.json'),
    JSON.stringify(nextjsData, null, 2)
  );
  
  console.log('✅ Dados de demonstração gerados com sucesso!');
  console.log(`📁 Localização: ${DATA_DIR}`);
  console.log(`📊 Total de doenças: ${SAMPLE_DISEASES.length}`);
  console.log(`🏥 Categorias: ${CATEGORIES.length}`);
  console.log(`🌍 Dados CPLP: ${CPLP_EPIDEMIOLOGY.length}`);
  console.log(`🤝 Organizações: ${SUPPORT_ORGANIZATIONS.length}`);
}

function generateDemoSQL(data: any): string {
  const lines = [];
  
  lines.push('-- GARD BRASILEIRO - DADOS DE DEMONSTRAÇÃO');
  lines.push(`-- Gerado em: ${new Date().toISOString()}`);
  lines.push('-- Este arquivo contém dados fictícios para desenvolvimento');
  lines.push('');
  
  // Categorias
  lines.push('-- Inserir categorias');
  for (const category of data.categories) {
    lines.push(`INSERT INTO disease_categories (id, name_en, name_pt, level, sort_order, is_active) VALUES `);
    lines.push(`  (gen_random_uuid(), '${category.name_en}', '${category.name_pt}', 1, 0, true) ON CONFLICT DO NOTHING;`);
  }
  lines.push('');
  
  // Doenças
  lines.push('-- Inserir doenças');
  for (const disease of data.diseases) {
    const synonymsEn = disease.synonyms.map((s: string) => `'${s.replace(/'/g, "''")}'`).join(', ');
    
    lines.push(`INSERT INTO diseases (`);
    lines.push(`  id, gard_br_id, gard_original_id, name_en, name_pt, synonyms_en, synonyms_pt,`);
    lines.push(`  category_en, category_pt, orpha_code, icd10_code, omim_code,`);
    lines.push(`  prevalence_en, prevalence_pt, inheritance_pattern_en, inheritance_pattern_pt,`);
    lines.push(`  age_of_onset_en, age_of_onset_pt, translation_status, is_active`);
    lines.push(`) VALUES (`);
    lines.push(`  gen_random_uuid(), 'gard-br-${disease.gard_id}', '${disease.gard_id}',`);
    lines.push(`  '${disease.name.replace(/'/g, "''")}', NULL,`);
    lines.push(`  ARRAY[${synonymsEn}], ARRAY[]::text[],`);
    lines.push(`  '${disease.category.replace(/'/g, "''")}', NULL,`);
    lines.push(`  ${disease.orpha_code ? `'${disease.orpha_code}'` : 'NULL'},`);
    lines.push(`  ${disease.icd10_codes?.[0] ? `'${disease.icd10_codes[0]}'` : 'NULL'},`);
    lines.push(`  ${disease.omim_codes?.[0] ? `'${disease.omim_codes[0]}'` : 'NULL'},`);
    lines.push(`  '${disease.prevalence?.replace(/'/g, "''") || ''}', NULL,`);
    lines.push(`  '${disease.inheritance?.replace(/'/g, "''") || ''}', NULL,`);
    lines.push(`  '${disease.age_of_onset?.replace(/'/g, "''") || ''}', NULL,`);
    lines.push(`  'pending', true`);
    lines.push(`);`);
    lines.push('');
  }
  
  return lines.join('\n');
}

// Executar se chamado diretamente
if (require.main === module) {
  generateDemoData().catch(console.error);
}

export { generateDemoData };
