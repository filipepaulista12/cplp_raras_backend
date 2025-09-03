const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrphaDiseases() {
  try {
    console.log('🔍 ESTRUTURA ORPHA_DISEASES');
    console.log('===========================');
    
    const structure = await prisma.$queryRaw`PRAGMA table_info(orpha_diseases)`;
    console.log('\n📊 Colunas:');
    structure.forEach(col => {
      console.log(`   • ${col.name}: ${col.type} ${col.pk ? '(PK)' : ''}`);
    });
    
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_diseases`;
    console.log(`\n📊 Total: ${count[0].count} doenças`);
    
    // Verificar uma amostra
    const sample = await prisma.$queryRaw`SELECT * FROM orpha_diseases LIMIT 2`;
    console.log('\n🔍 AMOSTRAS:');
    sample.forEach((s, i) => {
      console.log(`${i + 1}. ORPHA:${s.orpha_code} - ${s.name_en?.substring(0, 50)}...`);
      console.log(`   Colunas com OMIM/external:`, Object.keys(s).filter(k => 
        k.toLowerCase().includes('omim') || 
        k.toLowerCase().includes('external') || 
        k.toLowerCase().includes('ref')
      ));
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrphaDiseases();
