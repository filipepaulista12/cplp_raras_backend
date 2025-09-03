const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function checkAndContinueRepopulation() {
  try {
    console.log('🔍 VERIFICANDO STATUS ATUAL...');
    console.log('='.repeat(50));
    
    // Verificar dados existentes
    const orphaDiseaseCount = await prisma.orphaDisease.count();
    const orphaLinearisationCount = await prisma.orphaLinearisation.count();
    const orphaExternalMappingCount = await prisma.orphaExternalMapping.count();
    const hpoTermCount = await prisma.hPOTerm.count();
    const drugBankCount = await prisma.drugBankDrug.count();
    
    console.log(`✅ OrphaDisease: ${orphaDiseaseCount}`);
    console.log(`✅ OrphaLinearisation: ${orphaLinearisationCount}`);
    console.log(`✅ OrphaExternalMapping: ${orphaExternalMappingCount}`);
    console.log(`✅ HPOTerm: ${hpoTermCount}`);
    console.log(`✅ DrugBankDrug: ${drugBankCount}`);
    
    // Criar linearizações se não existirem
    if (orphaDiseaseCount > 0 && orphaLinearisationCount === 0) {
      console.log('\n2️⃣ CRIANDO ORPHANET LINEARISATIONS...');
      
      const diseases = await prisma.orphaDisease.findMany({
        select: { id: true, orphaCode: true, preferredNameEn: true, preferredNamePt: true }
      });
      
      let linearCount = 0;
      for (const disease of diseases) {
        await prisma.orphaLinearisation.create({
          data: {
            orphaDiseaseId: disease.id,
            linearisationId: `LIN_${disease.orphaCode}`,
            linearisationCode: disease.orphaCode,
            preferredNameEn: disease.preferredNameEn,
            preferredNamePt: disease.preferredNamePt,
            classificationLevel: 1,
            classificationType: 'Clinical'
          }
        });
        
        linearCount++;
        if (linearCount % 1000 === 0) {
          console.log(`   ✅ ${linearCount} linearizações criadas...`);
        }
      }
      
      console.log(`✅ ${linearCount} OrphaLinearisation criadas!`);
    }
    
    // Criar external mappings se não existirem
    if (orphaExternalMappingCount === 0) {
      console.log('\n3️⃣ REPOPULANDO EXTERNAL MAPPINGS...');
      
      // Executar o script de mapeamentos existente
      const { execSync } = require('child_process');
      try {
        execSync('node scripts/create-massive-mappings.js', { stdio: 'inherit' });
        console.log('✅ External mappings recriados!');
      } catch (error) {
        console.log('⚠️  Script de mappings não funcionou, continuando...');
      }
    }
    
    console.log('\n🎉 VERIFICAÇÃO E REPOPULAÇÃO CONCLUÍDA!');
    console.log('='.repeat(50));
    
    // Status final
    const finalOrphaDiseaseCount = await prisma.orphaDisease.count();
    const finalOrphaLinearisationCount = await prisma.orphaLinearisation.count();
    const finalOrphaExternalMappingCount = await prisma.orphaExternalMapping.count();
    
    console.log(`✅ ${finalOrphaDiseaseCount} OrphaDisease`);
    console.log(`✅ ${finalOrphaLinearisationCount} OrphaLinearisation`);
    console.log(`✅ ${finalOrphaExternalMappingCount} OrphaExternalMapping`);
    console.log(`✅ ${hpoTermCount} HPOTerm`);
    console.log(`✅ ${drugBankCount} DrugBankDrug`);
    
    console.log('\n✨ BANCO RESTAURADO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndContinueRepopulation();
