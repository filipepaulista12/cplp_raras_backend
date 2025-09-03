// Script usando Prisma para verificar banco
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando banco de dados com Prisma...\n');
    
    // Query raw para listar tabelas
    const tables = await prisma.$queryRaw`
      SELECT name, type 
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    console.log(`📊 Total de tabelas encontradas: ${tables.length}\n`);
    
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name}`);
    });
    
    // Filtrar tabelas relacionadas a doenças raras
    const rareDiseaseTables = tables.filter(table => 
      table.name.toLowerCase().includes('orpha') ||
      table.name.toLowerCase().includes('disease') ||
      table.name.toLowerCase().includes('rare') ||
      table.name.toLowerCase().includes('hpo') ||
      table.name.toLowerCase().includes('drug') ||
      table.name.toLowerCase().includes('gene') ||
      table.name.toLowerCase().includes('phenotype')
    );
    
    console.log('\n🏥 Tabelas relacionadas a doenças raras:');
    rareDiseaseTables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.name}`);
    });
    
    // Verificar contagem em algumas tabelas
    if (rareDiseaseTables.length > 0) {
      console.log('\n📊 Contagem de registros (primeiras 3 tabelas):');
      for (let i = 0; i < Math.min(3, rareDiseaseTables.length); i++) {
        const table = rareDiseaseTables[i];
        try {
          const result = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ${table.name}
          `.catch(() => null);
          
          if (result && result[0]) {
            console.log(`  📈 ${table.name}: ${result[0].count} registros`);
          }
        } catch (error) {
          console.log(`  ❌ ${table.name}: erro ao contar (${error.message})`);
        }
      }
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
