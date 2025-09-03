const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS');
  console.log('====================================');
  
  try {
    // Verificar orpha_clinical_signs
    const clinicalSigns = await prisma.$queryRaw`PRAGMA table_info(orpha_clinical_signs)`;
    console.log('📋 orpha_clinical_signs:');
    clinicalSigns.forEach(col => {
      console.log(`   • ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    console.log('');
    
    // Verificar orpha_phenotypes
    const phenotypes = await prisma.$queryRaw`PRAGMA table_info(orpha_phenotypes)`;
    console.log('📋 orpha_phenotypes:');
    phenotypes.forEach(col => {
      console.log(`   • ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    console.log('');
    
    // Verificar orpha_import_logs
    try {
      const importLogs = await prisma.$queryRaw`PRAGMA table_info(orpha_import_logs)`;
      console.log('📋 orpha_import_logs:');
      importLogs.forEach(col => {
        console.log(`   • ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
    } catch (error) {
      console.log('📋 orpha_import_logs: TABELA NÃO EXISTE');
    }
    
    console.log('');
    
    // Contar registros existentes
    const clinicalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const phenotypeCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    
    console.log('📊 CONTAGEM ATUAL:');
    console.log(`   • orpha_clinical_signs: ${clinicalCount[0].count} registros`);
    console.log(`   • orpha_phenotypes: ${phenotypeCount[0].count} registros`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
