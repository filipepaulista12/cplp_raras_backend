const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    const schema = await prisma.$queryRaw`
      PRAGMA table_info(drugbank_drugs)
    `;
    
    console.log('📋 ESTRUTURA DA TABELA drugbank_drugs:');
    schema.forEach(col => {
      console.log(`   - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkSchema();
