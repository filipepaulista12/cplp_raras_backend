const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
  console.log('📊 VERIFICAÇÃO DE PROGRESSO');
  console.log('==========================\n');
  
  try {
    // Verificar quantos registros temos nas tabelas
    const clinicalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const phenotypesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    const logsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_import_logs`;
    
    console.log(`✅ orpha_clinical_signs: ${clinicalCount[0].count} registros`);
    console.log(`✅ orpha_phenotypes: ${phenotypesCount[0].count} registros`);
    console.log(`📝 orpha_import_logs: ${logsCount[0].count} logs`);
    
    // Mostrar alguns exemplos
    console.log('\n📋 EXEMPLOS clinical_signs:');
    const clinicalSamples = await prisma.$queryRaw`
      SELECT cs.sign_name, cs.frequency, od.preferred_name_en, od.orpha_code
      FROM orpha_clinical_signs cs
      JOIN orpha_diseases od ON cs.orpha_disease_id = od.id
      LIMIT 5
    `;
    console.table(clinicalSamples);
    
    console.log('\n📋 EXEMPLOS phenotypes:');
    const phenotypeSamples = await prisma.$queryRaw`
      SELECT op.hpo_id, op.hpo_term, op.frequency_term, od.preferred_name_en, od.orpha_code
      FROM orpha_phenotypes op
      JOIN orpha_diseases od ON op.orpha_disease_id = od.id
      LIMIT 5
    `;
    console.table(phenotypeSamples);
    
    // Verificar logs
    if (logsCount[0].count > 0) {
      console.log('\n📝 LOGS DE IMPORT:');
      const logs = await prisma.$queryRaw`
        SELECT import_type, status, records_processed, records_succeeded, created_at
        FROM orpha_import_logs
        ORDER BY created_at DESC
        LIMIT 3
      `;
      console.table(logs);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();
