const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDiseases() {
  console.log('🔍 VERIFICAÇÃO DA TABELA ORPHA_DISEASES');
  console.log('====================================\n');
  
  try {
    // 1. Verificar estrutura da tabela orpha_diseases
    console.log('📊 ESTRUTURA orpha_diseases:');
    const diseasesInfo = await prisma.$queryRaw`PRAGMA table_info(orpha_diseases)`;
    console.table(diseasesInfo);
    
    // 2. Contar registros
    const diseaseCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_diseases`;
    console.log(`\n📊 Total de doenças: ${diseaseCount[0].count}\n`);
    
    // 3. Ver primeiras 5 doenças com estrutura correta
    console.log('📋 PRIMEIRAS 5 DOENÇAS:');
    const diseases = await prisma.$queryRaw`
      SELECT id, orpha_code, name 
      FROM orpha_diseases 
      LIMIT 5
    `;
    console.table(diseases);
    
    // 4. Verificar foreign keys das tabelas HPO
    console.log('\n🔗 FOREIGN KEYS orpha_clinical_signs:');
    const fkClinical = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_clinical_signs)`;
    console.table(fkClinical);
    
    console.log('\n🔗 FOREIGN KEYS orpha_phenotypes:');
    const fkPhenotypes = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_phenotypes)`;
    console.table(fkPhenotypes);
    
    // 5. Testar se existe a doença com ID 1
    console.log('\n🔍 TESTE: Existe doença com id=1?');
    const testDisease = await prisma.$queryRaw`
      SELECT id, orpha_code, name 
      FROM orpha_diseases 
      WHERE id = 1
    `;
    if (testDisease.length > 0) {
      console.log('✅ Doença encontrada:', testDisease[0]);
    } else {
      console.log('❌ Não existe doença com id=1');
      
      // Ver qual é o primeiro ID válido
      const firstDisease = await prisma.$queryRaw`
        SELECT id, orpha_code, name 
        FROM orpha_diseases 
        ORDER BY id LIMIT 1
      `;
      console.log('🎯 Primeira doença válida:', firstDisease[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiseases();
