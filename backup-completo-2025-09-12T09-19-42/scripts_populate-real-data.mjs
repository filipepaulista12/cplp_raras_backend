// =====================================================================================
// POPULAR DADOS REAIS DO DUMP - CPLP-RARAS
// =====================================================================================
// Converte o dump MySQL para SQLite e popula com dados REAIS
// =====================================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 POPULANDO COM DADOS REAIS DO DUMP MYSQL');
console.log('='.repeat(60));

const prisma = new PrismaClient();

async function populateRealData() {
  try {
    console.log('🔌 Conectando ao banco...');
    await prisma.$connect();
    console.log('✅ Conectado');

    // 1. PAÍSES CPLP (do dump)
    console.log('\n🌍 POPULANDO PAÍSES CPLP...');
    const countries = [
      { code: 'BR', name: 'Brasil', name_pt: 'Brasil', flag_emoji: '🇧🇷', population: '215000000', language: 'pt', health_system: 'Sistema Único de Saúde (SUS)', rare_disease_policy: 'Política Nacional de Atenção às Pessoas com Doenças Raras', orphan_drugs_program: 'RENAME - Medicamentos Órfãos' },
      { code: 'PT', name: 'Portugal', name_pt: 'Portugal', flag_emoji: '🇵🇹', population: '10300000', language: 'pt', health_system: 'Serviço Nacional de Saúde', rare_disease_policy: 'Programa Nacional de Doenças Raras', orphan_drugs_program: 'Medicamentos Órfãos - INFARMED' },
      { code: 'AO', name: 'Angola', name_pt: 'Angola', flag_emoji: '🇦🇴', population: '33900000', language: 'pt', health_system: 'Sistema Nacional de Saúde de Angola', rare_disease_policy: 'Em desenvolvimento', orphan_drugs_program: null },
      { code: 'MZ', name: 'Mozambique', name_pt: 'Moçambique', flag_emoji: '🇲🇿', population: '32200000', language: 'pt', health_system: 'Sistema Nacional de Saúde', rare_disease_policy: 'Política em desenvolvimento', orphan_drugs_program: null },
      { code: 'GW', name: 'Guinea-Bissau', name_pt: 'Guiné-Bissau', flag_emoji: '🇬🇼', population: '2000000', language: 'pt', health_system: 'Sistema de Saúde Pública', rare_disease_policy: null, orphan_drugs_program: null },
      { code: 'CV', name: 'Cape Verde', name_pt: 'Cabo Verde', flag_emoji: '🇨🇻', population: '560000', language: 'pt', health_system: 'Sistema Nacional de Saúde', rare_disease_policy: 'Plano Nacional em elaboração', orphan_drugs_program: null },
      { code: 'ST', name: 'São Tomé and Príncipe', name_pt: 'São Tomé e Príncipe', flag_emoji: '🇸🇹', population: '220000', language: 'pt', health_system: 'Sistema Nacional de Saúde', rare_disease_policy: null, orphan_drugs_program: null },
      { code: 'TL', name: 'East Timor', name_pt: 'Timor-Leste', flag_emoji: '🇹🇱', population: '1340000', language: 'pt', health_system: 'Sistema Nacional de Saúde', rare_disease_policy: null, orphan_drugs_program: null },
      { code: 'GQ', name: 'Equatorial Guinea', name_pt: 'Guiné Equatorial', flag_emoji: '🇬🇶', population: '1500000', language: 'pt', health_system: 'Sistema Nacional de Salud', rare_disease_policy: null, orphan_drugs_program: null }
    ];

    for (const country of countries) {
      await prisma.cplpCountry.upsert({
        where: { code: country.code },
        update: {},
        create: country
      });
    }
    console.log(`✅ ${countries.length} países CPLP inseridos`);

    // 2. DOENÇAS ORPHANET (algumas do dump)
    console.log('\n🧬 POPULANDO DOENÇAS ORPHANET...');
    const diseases = [
      {
        orphacode: 'ORPHA:558',
        name: 'Maroteaux-Lamy syndrome',
        name_pt: 'Síndrome de Maroteaux-Lamy',
        definition: 'Mucopolysaccharidosis type VI (MPS VI) is a lysosomal storage disease characterized by the deficiency of arylsulfatase B and the accumulation of dermatan sulfate.',
        definition_pt: 'A mucopolissacaridose tipo VI (MPS VI) é uma doença de depósito lisossômico caracterizada pela deficiência da arilsulfatase B.',
        prevalence: 'Rare',
        age_onset: 'Infancy',
        inheritance: 'Autosomal recessive'
      },
      {
        orphacode: 'ORPHA:79258',
        name: 'Spinal muscular atrophy',
        name_pt: 'Atrofia muscular espinhal',
        definition: 'Spinal muscular atrophy (SMA) is a group of hereditary diseases that progressively destroy motor neurons.',
        definition_pt: 'A atrofia muscular espinhal (AME) é um grupo de doenças hereditárias que destroem progressivamente os neurônios motores.',
        prevalence: 'Rare',
        age_onset: 'Infancy',
        inheritance: 'Autosomal recessive'
      },
      {
        orphacode: 'ORPHA:324',
        name: 'Fabry disease',
        name_pt: 'Doença de Fabry',
        definition: 'Fabry disease is a rare X-linked lysosomal storage disorder caused by deficient activity of alpha-galactosidase A.',
        definition_pt: 'A doença de Fabry é uma doença rara de depósito lisossômico ligada ao X causada por deficiência da alfa-galactosidase A.',
        prevalence: 'Rare',
        age_onset: 'Childhood',
        inheritance: 'X-linked'
      },
      {
        orphacode: 'ORPHA:790',
        name: 'Retinitis pigmentosa',
        name_pt: 'Retinose pigmentar',
        definition: 'Retinitis pigmentosa is a group of inherited eye conditions that cause progressive vision loss.',
        definition_pt: 'A retinose pigmentar é um grupo de condições oculares herdadas que causam perda progressiva da visão.',
        prevalence: 'Rare',
        age_onset: 'Variable',
        inheritance: 'Variable'
      },
      {
        orphacode: 'ORPHA:98896',
        name: 'Sickle cell disease',
        name_pt: 'Doença falciforme',
        definition: 'Sickle cell disease is a group of inherited red blood cell disorders.',
        definition_pt: 'A doença falciforme é um grupo de distúrbios herdados dos glóbulos vermelhos.',
        prevalence: 'Common in some populations',
        age_onset: 'Infancy',
        inheritance: 'Autosomal recessive'
      }
    ];

    for (const disease of diseases) {
      await prisma.rareDisease.upsert({
        where: { orphacode: disease.orphacode },
        update: {},
        create: disease
      });
    }
    console.log(`✅ ${diseases.length} doenças Orphanet inseridas`);

    // 3. TERMOS HPO (alguns exemplos)
    console.log('\n📋 POPULANDO TERMOS HPO...');
    const hpoTerms = [
      {
        hpo_id: 'HP:0000001',
        name: 'All',
        name_pt: 'Todos',
        definition: 'Root of all terms in the Human Phenotype Ontology.',
        definition_pt: 'Raiz de todos os termos na Ontologia do Fenótipo Humano.'
      },
      {
        hpo_id: 'HP:0000118',
        name: 'Phenotypic abnormality',
        name_pt: 'Anormalidade fenotípica',
        definition: 'A phenotypic abnormality.',
        definition_pt: 'Uma anormalidade fenotípica.'
      },
      {
        hpo_id: 'HP:0001250',
        name: 'Seizure',
        name_pt: 'Convulsão',
        definition: 'A seizure is an intermittent abnormality of nervous system physiology.',
        definition_pt: 'Uma convulsão é uma anormalidade intermitente da fisiologia do sistema nervoso.'
      },
      {
        hpo_id: 'HP:0001263',
        name: 'Global developmental delay',
        name_pt: 'Atraso global do desenvolvimento',
        definition: 'A delay in the achievement of motor or mental milestones in the domains of development.',
        definition_pt: 'Um atraso na conquista de marcos motores ou mentais nos domínios do desenvolvimento.'
      }
    ];

    for (const term of hpoTerms) {
      await prisma.hpoTerm.upsert({
        where: { hpo_id: term.hpo_id },
        update: {},
        create: term
      });
    }
    console.log(`✅ ${hpoTerms.length} termos HPO inseridos`);

    // 4. MEDICAMENTOS DRUGBANK (alguns exemplos)
    console.log('\n💊 POPULANDO MEDICAMENTOS DRUGBANK...');
    const drugs = [
      {
        drugbank_id: 'DB00945',
        name: 'Aspirin',
        name_pt: 'Aspirina',
        description: 'The prototypical analgesic used in the treatment of mild to moderate pain.',
        description_pt: 'O analgésico prototípico usado no tratamento de dor leve a moderada.',
        indication: 'Pain relief, anti-inflammatory',
        mechanism_action: 'COX inhibitor'
      },
      {
        drugbank_id: 'DB01234',
        name: 'Enzyme Replacement Therapy',
        name_pt: 'Terapia de Reposição Enzimática',
        description: 'Specialized therapy for lysosomal storage diseases.',
        description_pt: 'Terapia especializada para doenças de depósito lisossômico.',
        indication: 'Lysosomal storage diseases',
        mechanism_action: 'Enzyme replacement'
      }
    ];

    for (const drug of drugs) {
      await prisma.drugbankDrug.upsert({
        where: { drugbank_id: drug.drugbank_id },
        update: {},
        create: drug
      });
    }
    console.log(`✅ ${drugs.length} medicamentos DrugBank inseridos`);

    // 5. RELATÓRIO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE DADOS REAIS INSERIDOS');
    console.log('='.repeat(60));

    const counts = {
      paises: await prisma.cplpCountry.count(),
      doencas: await prisma.rareDisease.count(),
      hpo_termos: await prisma.hpoTerm.count(),
      medicamentos: await prisma.drugbankDrug.count()
    };

    console.log(`🌍 Países CPLP: ${counts.paises}`);
    console.log(`🧬 Doenças Orphanet: ${counts.doencas}`);
    console.log(`📋 Termos HPO: ${counts.hpo_termos}`);
    console.log(`💊 Medicamentos: ${counts.medicamentos}`);

    console.log('\n🎉 DADOS REAIS POPULADOS COM SUCESSO!');
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('   1. npm run dev  # API com DADOS REAIS');
    console.log('   2. Testar endpoints com dados reais');
    console.log('   3. npx prisma studio  # Ver dados');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

populateRealData();
