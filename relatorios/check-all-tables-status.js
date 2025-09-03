const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTablesStatus() {
  console.log('📊 STATUS COMPLETO DE TODAS AS TABELAS');
  console.log('=====================================\n');
  
  try {
    // Lista de todas as tabelas que precisam ser populadas
    const tables = [
      'orpha_clinical_signs',
      'orpha_phenotypes', 
      'orpha_gene_associations',
      'orpha_textual_information',
      'orpha_epidemiology',
      'orpha_natural_history',
      'orpha_medical_classifications',
      'drug_disease_associations',
      'hpo_phenotype_associations',
      'drugbank_interactions',
      'orphanet_references'
    ];
    
    console.log('🔍 Verificando status de cada tabela:\n');
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`SELECT * FROM ${table} LIMIT 0`)} ${table}`;
        const count = result[0]?.count || 0;
        
        const status = count > 0 ? '✅ POPULADA' : '❌ VAZIA';
        const statusColor = count > 0 ? '32' : '31'; // Green : Red
        
        console.log(`${status} ${table}: ${count} registros`);
        
      } catch (error) {
        console.log(`❓ ERRO ${table}: ${error.message.substring(0, 50)}`);
      }
    }
    
    // Estatísticas gerais
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    
    // Contar tabelas populadas vs vazias
    let populatedCount = 0;
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`SELECT * FROM ${table} LIMIT 0`)} ${table}`;
        const count = result[0]?.count || 0;
        if (count > 0) {
          populatedCount++;
          totalRecords += count;
        }
      } catch (error) {
        // Ignora erros para estatísticas
      }
    }
    
    console.log(`📊 Tabelas populadas: ${populatedCount}/${tables.length}`);
    console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
    console.log(`📊 Progresso: ${Math.round((populatedCount/tables.length)*100)}%`);
    
    // Próximas missões
    console.log('\n🚀 PRÓXIMAS MISSÕES DISPONÍVEIS:');
    console.log('• Completar product1 textual information (11.239 total)');
    console.log('• Completar product4 HPO associations (4.316 total)');
    console.log('• Completar product6 gene associations (já completo!)');
    console.log('• Implementar HPO Phenotype Associations (phenotype.hpoa)');
    console.log('• Implementar Drug-Disease Associations (FDA OOPD)');
    console.log('• DrugBank interactions');
    console.log('• Orphanet references');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTablesStatus();
