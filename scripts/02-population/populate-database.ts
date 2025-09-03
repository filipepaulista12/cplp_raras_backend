/**
 * 📊 POPULATE DATABASE - ORPHANET COMPLETE
 * 
 * Script para popular o banco PostgreSQL com todos os dados do JSON
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface OrphanetData {
  id: string;
  name: string;
  nameEn?: string;
  definition?: string;
  synonyms?: string[];
  genes?: string[];
  phenotypes?: string[];
  inheritance?: string;
  prevalence?: string;
  classification?: string;
  ageOfOnset?: string;
  icd10?: string[];
  icd11?: string[];
  omim?: string[];
}

async function populateDatabase() {
  try {
    console.log('🚀 Iniciando população do banco PostgreSQL...');

    // Carregar dados do JSON
    const filePath = path.join(process.cwd(), 'src', 'data', 'all-diseases-complete-official.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const diseases: OrphanetData[] = JSON.parse(fileContent);
    
    console.log(`📄 Carregados ${diseases.length} registros do JSON`);

    // 1. Criar categorias de doenças
    console.log('📂 Criando categorias...');
    
    const categories = [
      { code: 'NEURO', namePt: 'Doenças Neurológicas', nameEn: 'Neurological diseases', colorHex: '#3B82F6' },
      { code: 'METAB', namePt: 'Doenças Metabólicas', nameEn: 'Metabolic diseases', colorHex: '#10B981' },
      { code: 'CARDIO', namePt: 'Doenças Cardiovasculares', nameEn: 'Cardiovascular diseases', colorHex: '#EF4444' },
      { code: 'HEMAT', namePt: 'Doenças Hematológicas', nameEn: 'Hematological diseases', colorHex: '#8B5CF6' },
      { code: 'OPHTH', namePt: 'Doenças Oftalmológicas', nameEn: 'Ophthalmological diseases', colorHex: '#F59E0B' },
      { code: 'DERM', namePt: 'Doenças Dermatológicas', nameEn: 'Dermatological diseases', colorHex: '#06B6D4' },
      { code: 'ENDO', namePt: 'Doenças Endócrinas', nameEn: 'Endocrine diseases', colorHex: '#84CC16' },
      { code: 'RENAL', namePt: 'Doenças Renais', nameEn: 'Renal diseases', colorHex: '#F97316' },
      { code: 'GI', namePt: 'Doenças Gastrointestinais', nameEn: 'Gastrointestinal diseases', colorHex: '#EC4899' },
      { code: 'RESP', namePt: 'Doenças Respiratórias', nameEn: 'Respiratory diseases', colorHex: '#6366F1' },
      { code: 'BONE', namePt: 'Doenças Ósseas', nameEn: 'Bone diseases', colorHex: '#14B8A6' },
      { code: 'IMMUNE', namePt: 'Doenças Imunológicas', nameEn: 'Immune diseases', colorHex: '#F43F5E' },
      { code: 'CANCER', namePt: 'Cânceres Raros', nameEn: 'Rare cancers', colorHex: '#7C3AED' },
      { code: 'GENETIC', namePt: 'Síndromes Genéticas', nameEn: 'Genetic syndromes', colorHex: '#059669' }
    ];

    for (const category of categories) {
      await prisma.diseaseCategory.upsert({
        where: { code: category.code },
        update: category,
        create: category
      });
    }

    console.log(`✅ Criadas ${categories.length} categorias`);

    // 2. Criar padrões de herança
    console.log('🧬 Criando padrões de herança...');
    
    const inheritancePatterns = [
      { code: 'AD', namePt: 'Autossômica Dominante', nameEn: 'Autosomal dominant' },
      { code: 'AR', namePt: 'Autossômica Recessiva', nameEn: 'Autosomal recessive' },
      { code: 'XLD', namePt: 'Ligada ao X Dominante', nameEn: 'X-linked dominant' },
      { code: 'XLR', namePt: 'Ligada ao X Recessiva', nameEn: 'X-linked recessive' },
      { code: 'YL', namePt: 'Ligada ao Y', nameEn: 'Y-linked' },
      { code: 'MT', namePt: 'Mitocondrial', nameEn: 'Mitochondrial inheritance' },
      { code: 'MF', namePt: 'Multifatorial', nameEn: 'Multifactorial' },
      { code: 'UNK', namePt: 'Desconhecida', nameEn: 'Unknown' }
    ];

    for (const pattern of inheritancePatterns) {
      await prisma.inheritancePattern.upsert({
        where: { code: pattern.code },
        update: pattern,
        create: pattern
      });
    }

    console.log(`✅ Criados ${inheritancePatterns.length} padrões de herança`);

    // 3. Importar doenças
    console.log('🏥 Importando doenças...');
    
    let imported = 0;
    const batchSize = 100;
    
    for (let i = 0; i < diseases.length; i += batchSize) {
      const batch = diseases.slice(i, i + batchSize);
      
      for (const diseaseData of batch) {
        try {
          // Extrair código ORPHA
          const orphaCode = diseaseData.id?.replace('orpha-', '') || null;
          
          // Determinar categoria baseada no nome/classificação
          let categoryId = null;
          const classification = (diseaseData.classification || '').toLowerCase();
          const name = (diseaseData.name || '').toLowerCase();
          
          if (classification.includes('neuro') || name.includes('neuro') || name.includes('cerebral')) {
            categoryId = 1; // NEURO
          } else if (classification.includes('metab') || name.includes('metab') || name.includes('enzyme')) {
            categoryId = 2; // METAB
          } else if (classification.includes('cardio') || name.includes('cardio') || name.includes('heart')) {
            categoryId = 3; // CARDIO
          } else if (classification.includes('hemat') || name.includes('blood') || name.includes('anemia')) {
            categoryId = 4; // HEMAT
          } else if (classification.includes('opht') || name.includes('eye') || name.includes('vision')) {
            categoryId = 5; // OPHTH
          } else {
            categoryId = 14; // GENETIC (padrão)
          }

          // Determinar padrão de herança
          let inheritancePatternId = 8; // UNK (padrão)
          const inheritance = (diseaseData.inheritance || '').toLowerCase();
          
          if (inheritance.includes('autosomal dominant')) {
            inheritancePatternId = 1; // AD
          } else if (inheritance.includes('autosomal recessive')) {
            inheritancePatternId = 2; // AR
          } else if (inheritance.includes('x-linked dominant')) {
            inheritancePatternId = 3; // XLD
          } else if (inheritance.includes('x-linked recessive') || inheritance.includes('x-linked')) {
            inheritancePatternId = 4; // XLR
          } else if (inheritance.includes('mitochondrial')) {
            inheritancePatternId = 6; // MT
          } else if (inheritance.includes('multifactorial')) {
            inheritancePatternId = 7; // MF
          }

          await prisma.disease.upsert({
            where: { 
              gardBrId: `GARD-BR-${orphaCode || i.toString().padStart(6, '0')}` 
            },
            update: {
              namePt: diseaseData.name || 'Nome não disponível',
              nameEn: diseaseData.nameEn || diseaseData.name,
              synonyms: diseaseData.synonyms || [],
              orphaCode: orphaCode,
              categoryId: categoryId,
              inheritancePatternId: inheritancePatternId,
              genesInvolved: diseaseData.genes || [],
              prevalenceValue: diseaseData.prevalence || 'Desconhecida',
              ageOfOnset: diseaseData.ageOfOnset || 'Variable',
              infoStatus: 'published'
            },
            create: {
              gardBrId: `GARD-BR-${orphaCode || i.toString().padStart(6, '0')}`,
              namePt: diseaseData.name || 'Nome não disponível',
              nameEn: diseaseData.nameEn || diseaseData.name,
              synonyms: diseaseData.synonyms || [],
              orphaCode: orphaCode,
              categoryId: categoryId,
              inheritancePatternId: inheritancePatternId,
              genesInvolved: diseaseData.genes || [],
              prevalenceValue: diseaseData.prevalence || 'Desconhecida',
              ageOfOnset: diseaseData.ageOfOnset || 'Variable',
              infoStatus: 'published'
            }
          });

          imported++;
        } catch (error) {
          console.error(`Erro ao importar doença ${diseaseData.id}:`, error);
        }
      }
      
      if (i % (batchSize * 10) === 0) {
        console.log(`📊 Importadas ${imported} de ${diseases.length} doenças...`);
      }
    }

    console.log(`✅ Importação concluída: ${imported} doenças inseridas`);

    // 4. Criar conteúdo detalhado para algumas doenças
    console.log('📝 Criando conteúdo detalhado...');
    
    const diseasesWithContent = await prisma.disease.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    for (const disease of diseasesWithContent) {
      await prisma.diseaseContent.upsert({
        where: { diseaseId: disease.id },
        update: {
          summary: `Resumo clínico da ${disease.namePt}`,
          symptoms: ['Sintoma 1', 'Sintoma 2', 'Sintoma 3'],
          causes: `Causas da ${disease.namePt}`,
          treatmentOptions: ['Opção 1', 'Opção 2']
        },
        create: {
          diseaseId: disease.id,
          summary: `Resumo clínico da ${disease.namePt}`,
          symptoms: ['Sintoma 1', 'Sintoma 2', 'Sintoma 3'],
          causes: `Causas da ${disease.namePt}`,
          treatmentOptions: ['Opção 1', 'Opção 2']
        }
      });
    }

    console.log('✅ Conteúdo detalhado criado para 50 doenças');

  } catch (error) {
    console.error('❌ Erro na importação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('🎉 População do banco concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

export { populateDatabase };
