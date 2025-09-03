const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🏗️  VERIFICANDO NOVAS ESTRUTURAS DE SISTEMAS MÉDICOS INTERNACIONAIS\n');
    
    // Verificar tabelas existentes através do Prisma
    const result = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    console.log('📋 TABELAS NO BANCO DE DADOS:');
    console.log('='.repeat(50));
    
    const tableNames = result.map(row => row.name);
    
    // Agrupar por categoria
    const systemTables = tableNames.filter(name => 
      ['icd_codes', 'omim_entries', 'umls_concepts', 'mondo_diseases', 
       'gard_diseases', 'mesh_descriptors', 'meddra_terms', 'cross_system_mappings']
      .includes(name)
    );
    
    const orphaTables = tableNames.filter(name => name.startsWith('orpha_'));
    const drugTables = tableNames.filter(name => name.includes('drug'));
    const hpoTables = tableNames.filter(name => name.includes('hpo'));
    const otherTables = tableNames.filter(name => 
      !systemTables.includes(name) && 
      !orphaTables.includes(name) && 
      !drugTables.includes(name) && 
      !hpoTables.includes(name) &&
      name !== '_prisma_migrations'
    );
    
    console.log('\n🌍 SISTEMAS MÉDICOS INTERNACIONAIS:');
    systemTables.forEach(table => console.log(`  ✅ ${table}`));
    
    console.log('\n🔬 TABELAS ORPHANET:');
    orphaTables.forEach(table => console.log(`  ✅ ${table}`));
    
    console.log('\n💊 TABELAS DRUGBANK:');
    drugTables.forEach(table => console.log(`  ✅ ${table}`));
    
    console.log('\n🧬 TABELAS HPO:');
    hpoTables.forEach(table => console.log(`  ✅ ${table}`));
    
    if (otherTables.length > 0) {
      console.log('\n📋 OUTRAS TABELAS:');
      otherTables.forEach(table => console.log(`  ✅ ${table}`));
    }
    
    console.log('\n🎯 RESUMO FINAL:');
    console.log(`   Total de tabelas: ${tableNames.length}`);
    console.log(`   Sistemas médicos: ${systemTables.length}`);
    console.log(`   Orphanet: ${orphaTables.length}`);
    console.log(`   DrugBank: ${drugTables.length}`);
    console.log(`   HPO: ${hpoTables.length}`);
    
    // Verificar se as novas tabelas foram criadas
    const expectedNewTables = [
      'icd_codes', 'omim_entries', 'umls_concepts', 'mondo_diseases',
      'gard_diseases', 'mesh_descriptors', 'meddra_terms', 'cross_system_mappings'
    ];
    
    const missingTables = expectedNewTables.filter(table => !tableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log('\n✅ TODAS AS NOVAS TABELAS FORAM CRIADAS COM SUCESSO!');
    } else {
      console.log('\n❌ TABELAS EM FALTA:');
      missingTables.forEach(table => console.log(`   - ${table}`));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
