const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTextualTableStructure() {
  console.log('📚 VERIFICAÇÃO TABELA ORPHA_TEXTUAL_INFORMATION');
  console.log('===============================================\n');
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('📊 ESTRUTURA orpha_textual_information:');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(orpha_textual_information)`;
    console.table(tableInfo);
    
    // 2. Contar registros atuais
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_textual_information`;
    console.log(`\n📊 Registros atuais: ${count[0].count}`);
    
    // 3. Verificar foreign keys
    console.log('\n🔗 FOREIGN KEYS:');
    const fks = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_textual_information)`;
    console.table(fks);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTextualTableStructure();
