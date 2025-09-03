const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
      ORDER BY name
    `;
    
    console.log('📋 TODAS AS TABELAS NO BANCO:');
    tables.forEach(table => console.log(`   - ${table.name}`));
    
    // Verificar especificamente tabelas com 0 registros
    console.log('\n🚫 VERIFICANDO TABELAS VAZIAS:');
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = Number(result[0].count);
        if (count === 0) {
          console.log(`❌ ${table.name}: 0 registros`);
        }
      } catch (error) {
        console.log(`⚠️  ${table.name}: Erro - ${error.message}`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

listTables();
