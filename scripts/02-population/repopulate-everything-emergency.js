const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function emergencyRepopulate() {
  try {
    console.log('🚨 REPOPULAÇÃO DE EMERGÊNCIA INICIADA!');
    console.log('='.repeat(50));
    
    // 1. ORPHANET DISEASES (11,340 records)
    console.log('\n1️⃣ REPOPULANDO ORPHANET DISEASES...');
    const diseasesData = JSON.parse(fs.readFileSync('src/data/all-diseases-complete-official.json', 'utf8'));
    
    let diseaseCount = 0;
    for (const disease of diseasesData) {
      // Extrair orphaCode do orpha_code
      const orphaCode = disease.orpha_code ? disease.orpha_code.replace('ORPHA:', '') : disease.id.replace('orpha-', '');
      
      await prisma.orphaDisease.create({
        data: {
          orphaNumber: disease.orpha_code || `ORPHA:${orphaCode}`,
          orphaCode: orphaCode,
          preferredNameEn: disease.nameEn || disease.name,
          preferredNamePt: disease.namePt || disease.name,
          synonymsEn: disease.synonyms ? JSON.stringify(disease.synonyms) : null,
          synonymsPt: null,
          entityType: 'Disease',
          classificationLevel: 1,
          dateCreated: disease.scraped_at || null,
          dateModified: disease.scraped_at || null,
          expertLink: disease.sourceUrl || null,
          isActiveDisease: true,
          isObsolete: false
        }
      });
      
      diseaseCount++;
      if (diseaseCount % 1000 === 0) {
        console.log(`   ✅ ${diseaseCount} doenças inseridas...`);
      }
    }
    
    console.log(`✅ ${diseaseCount} OrphaDisease inseridas!`);
    
    // 2. ORPHANET LINEARISATIONS (11,340 records)
    console.log('\n2️⃣ REPOPULANDO ORPHANET LINEARISATIONS...');
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
          classificationType: 'Clinical',
          linearisationType: 'Disease',
          isLeafNode: true,
          sortingCode: disease.orphaCode,
          dateCreated: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          isActive: true
        }
      });
      
      linearCount++;
      if (linearCount % 1000 === 0) {
        console.log(`   ✅ ${linearCount} linearizações criadas...`);
      }
    }
    
    console.log(`✅ ${linearCount} OrphaLinearisation criadas!`);
    
    console.log('\n🎉 REPOPULAÇÃO DE EMERGÊNCIA CONCLUÍDA!');
    console.log('='.repeat(50));
    console.log(`✅ ${diseaseCount} OrphaDisease`);
    console.log(`✅ ${linearCount} OrphaLinearisation`);
    console.log('\n⏭️  Próximo: External Mappings, HPO e DrugBank...');
    
  } catch (error) {
    console.error('❌ ERRO NA REPOPULAÇÃO:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

emergencyRepopulate();
