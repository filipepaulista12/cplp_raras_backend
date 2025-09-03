const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHpoTableStructure() {
  console.log('🧬 VERIFICAÇÃO TABELA HPO_PHENOTYPE_ASSOCIATIONS');
  console.log('===============================================\n');
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('📊 ESTRUTURA hpo_phenotype_associations:');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(hpo_phenotype_associations)`;
    console.table(tableInfo);
    
    // 2. Contar registros atuais
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    console.log(`\n📊 Registros atuais: ${count[0].count}`);
    
    // 3. Verificar foreign keys
    console.log('\n🔗 FOREIGN KEYS:');
    const fks = await prisma.$queryRaw`PRAGMA foreign_key_list(hpo_phenotype_associations)`;
    console.table(fks);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHpoTableStructure();
