#!/usr/bin/env node

/**
 * Script de Teste - População Inicial GARD-BR
 * Cria dados de exemplo para desenvolvimento e teste
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧬 Iniciando população da base de dados GARD-BR...\n');

  try {
    // 1. Criar categorias de doenças
    console.log('1. Criando categorias de doenças...');
    const categories = await prisma.diseaseCategory.createMany({
      data: [
        {
          code: 'NEUROL',
          namePt: 'Doenças Neurológicas',
          nameEn: 'Neurological Diseases',
          description: 'Doenças que afetam o sistema nervoso',
          colorHex: '#8B5CF6',
          icon: 'brain',
          sortOrder: 1
        },
        {
          code: 'GENETIC',
          namePt: 'Doenças Genéticas',
          nameEn: 'Genetic Diseases', 
          description: 'Doenças causadas por alterações genéticas',
          colorHex: '#10B981',
          icon: 'dna',
          sortOrder: 2
        },
        {
          code: 'METABOLIC',
          namePt: 'Doenças Metabólicas',
          nameEn: 'Metabolic Diseases',
          description: 'Doenças do metabolismo',
          colorHex: '#F59E0B',
          icon: 'molecule',
          sortOrder: 3
        }
      ]
    });
    console.log(`   ✅ ${categories.count} categorias criadas`);

    // 2. Criar países CPLP
    console.log('2. Criando países CPLP...');
    const countries = await prisma.cPLPCountry.createMany({
      data: [
        {
          code: 'BR',
          name: 'Brasil',
          flagEmoji: '🇧🇷',
          population: 215000000,
          healthcareSystem: 'SUS - Sistema Único de Saúde',
          rareDiseasePolicy: 'Política Nacional de Atenção Integral às Pessoas com Doenças Raras'
        },
        {
          code: 'PT',
          name: 'Portugal',
          flagEmoji: '🇵🇹',
          population: 10300000,
          healthcareSystem: 'SNS - Serviço Nacional de Saúde',
          rareDiseasePolicy: 'Programa Nacional de Doenças Raras'
        },
        {
          code: 'AO',
          name: 'Angola',
          flagEmoji: '🇦🇴',
          population: 35000000,
          healthcareSystem: 'Sistema Nacional de Saúde',
          rareDiseasePolicy: 'Em desenvolvimento'
        }
      ]
    });
    console.log(`   ✅ ${countries.count} países criados`);

    // 3. Criar padrões de herança
    console.log('3. Criando padrões de herança...');
    const inheritance = await prisma.inheritancePattern.createMany({
      data: [
        {
          code: 'AR',
          namePt: 'Autossômica Recessiva',
          nameEn: 'Autosomal Recessive',
          description: 'Padrão de herança que requer duas cópias do gene alterado'
        },
        {
          code: 'AD',
          namePt: 'Autossômica Dominante', 
          nameEn: 'Autosomal Dominant',
          description: 'Padrão de herança que requer apenas uma cópia do gene alterado'
        },
        {
          code: 'XL',
          namePt: 'Ligada ao X',
          nameEn: 'X-linked',
          description: 'Padrão de herança ligado ao cromossomo X'
        }
      ]
    });
    console.log(`   ✅ ${inheritance.count} padrões de herança criados`);

    // 4. Criar doenças de exemplo
    console.log('4. Criando doenças de exemplo...');
    
    const category1 = await prisma.diseaseCategory.findUnique({ where: { code: 'NEUROL' } });
    const category2 = await prisma.diseaseCategory.findUnique({ where: { code: 'GENETIC' } });
    const inheritance1 = await prisma.inheritancePattern.findUnique({ where: { code: 'AR' } });
    
    const diseases = [
      {
        gardBrId: 'GARD-BR-00001',
        gardOriginalId: 'GARD-6266',
        namePt: 'Atrofia Muscular Espinal',
        nameEn: 'Spinal Muscular Atrophy',
        synonyms: JSON.stringify(['SMA', 'AME', 'Atrofia Muscular Espinhal']),
        categoryId: category1?.id,
        orphaCode: 'ORPHA:83330',
        icd10Codes: JSON.stringify(['G12.0', 'G12.1']),
        omimCodes: JSON.stringify(['253300', '253550']),
        prevalenceValue: '1-5 casos por 100.000 nascimentos',
        prevalenceType: 'birth',
        ageOfOnset: 'Neonatal/Infantil',
        inheritancePatternId: inheritance1?.id,
        genesInvolved: JSON.stringify(['SMN1', 'SMN2']),
        chromosomalLocation: '5q13.2',
        infoStatus: 'published',
        qualityScore: 95
      },
      {
        gardBrId: 'GARD-BR-00002',
        gardOriginalId: 'GARD-5654',
        namePt: 'Fibrose Cística',
        nameEn: 'Cystic Fibrosis',
        synonyms: JSON.stringify(['FC', 'Mucoviscidose']),
        categoryId: category2?.id,
        orphaCode: 'ORPHA:586',
        icd10Codes: JSON.stringify(['E84']),
        omimCodes: JSON.stringify(['219700']),
        prevalenceValue: '1 caso por 2.500-3.000 nascimentos',
        prevalenceType: 'birth',
        ageOfOnset: 'Neonatal',
        inheritancePatternId: inheritance1?.id,
        genesInvolved: JSON.stringify(['CFTR']),
        chromosomalLocation: '7q31.2',
        infoStatus: 'published',
        qualityScore: 98
      }
    ];

    for (const diseaseData of diseases) {
      const disease = await prisma.disease.create({
        data: {
          ...diseaseData,
          categoryId: diseaseData.categoryId || null,
          inheritancePatternId: diseaseData.inheritancePatternId || null
        }
      });

      // Criar conteúdo detalhado
      await prisma.diseaseContent.create({
        data: {
          diseaseId: disease.id,
          summary: `Descrição detalhada da ${disease.namePt}`,
          symptoms: JSON.stringify([
            'Fraqueza muscular progressiva',
            'Dificuldade respiratória',
            'Problemas de deglutição'
          ]),
          diagnosticTests: JSON.stringify([
            'Teste genético',
            'Eletromiografia',
            'Biópsia muscular'
          ]),
          treatmentOptions: JSON.stringify([
            'Fisioterapia',
            'Suporte respiratório',
            'Terapia genética'
          ])
        }
      });

      console.log(`   ✅ Doença criada: ${disease.namePt} (${disease.gardBrId})`);
    }

    // 5. Estatísticas finais
    console.log('\n📊 Estatísticas da base de dados:');
    const stats = {
      categories: await prisma.diseaseCategory.count(),
      countries: await prisma.cPLPCountry.count(),
      inheritancePatterns: await prisma.inheritancePattern.count(),
      diseases: await prisma.disease.count(),
      content: await prisma.diseaseContent.count()
    };

    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    console.log('\n✅ População inicial da base de dados concluída!');
    console.log('🚀 Execute "npm run dev" para iniciar o servidor');
    
  } catch (error) {
    console.error('❌ Erro durante a população da base de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
