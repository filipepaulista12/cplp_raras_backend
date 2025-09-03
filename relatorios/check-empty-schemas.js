const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEmptyTableSchemas() {
  const emptyTables = [
    'drug_disease_associations',
    'hpo_phenotype_associations', 
    'orpha_clinical_signs',
    'orpha_cplp_epidemiology',
    'orpha_epidemiology',
    'orpha_gene_associations',
    'orpha_import_logs',
    'orpha_medical_classifications',
    'orpha_natural_history',
    'orpha_phenotypes',
    'orpha_textual_information'
  ];
  
  console.log('📋 SCHEMAS DAS TABELAS VAZIAS:\n');
  
  for (const table of emptyTables) {
    console.log(`🔍 ${table.toUpperCase()}:`);
    try {
      const schema = await prisma.$queryRaw`PRAGMA table_info(${table})`;
      if (schema.length === 0) {
        console.log('   ❌ Tabela não existe');
      } else {
        schema.forEach(col => {
          console.log(`   - ${col.name}: ${col.type}${col.notnull ? ' (NOT NULL)' : ''}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    console.log('');
  }
  
  await prisma.$disconnect();
}

checkEmptyTableSchemas();
