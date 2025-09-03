const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHpoTermsStructure() {
  try {
    console.log('🔍 ESTRUTURA HPO TERMS');
    console.log('====================');
    
    const structure = await prisma.$queryRaw`PRAGMA table_info(hpo_terms)`;
    console.log('\n📊 Colunas:');
    structure.forEach(col => {
      console.log(`   • ${col.name}: ${col.type} ${col.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_terms`;
    console.log(`\n📊 Total de registros: ${count[0].count}`);
    
    if (count[0].count > 0) {
      console.log('\n🔍 Amostras:');
      const samples = await prisma.$queryRaw`SELECT * FROM hpo_terms LIMIT 3`;
      samples.forEach((sample, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(sample, null, 2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHpoTermsStructure();
