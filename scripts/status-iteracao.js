const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function statusIteracao() {
  console.log('\n🎯 STATUS DA ITERAÇÃO SISTEMÁTICA');
  console.log('=================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  try {
    console.log('📊 TABELAS POPULADAS:');
    
    // Verificar cada tabela
    const tables = [
      'orpha_clinical_signs',
      'orpha_phenotypes', 
      'orpha_gene_associations',
      'orpha_textual_information',
      'hpo_phenotype_associations',
      'orpha_epidemiology',
      'orpha_natural_history', 
      'orpha_medical_classifications',
      'drug_disease_associations'
    ];
    
    let populatedCount = 0;
    let totalRecords = 0;
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`${table}`)}`;
        const count = result[0]?.count || 0;
        
        if (count > 0) {
          console.log(`✅ ${table}: ${count.toLocaleString()} registros`);
          populatedCount++;
          totalRecords += parseInt(count);
        } else {
          console.log(`❌ ${table}: 0 registros`);
        }
      } catch (error) {
        console.log(`⚠️  ${table}: ERRO (${error.message.substring(0, 30)}...)`);
      }
    }
    
    console.log(`\n📈 RESUMO EXECUTIVO:`);
    console.log(`✅ Tabelas populadas: ${populatedCount}/${tables.length}`);
    console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
    console.log(`🎯 Progresso: ${(populatedCount/tables.length*100).toFixed(1)}%`);
    
    console.log(`\n🚀 PRÓXIMOS TARGETS:`);
    console.log(`• Completar processamentos em andamento`);
    console.log(`• drug_disease_associations (FDA OOPD)`);
    console.log(`• XMLs epidemiology/natural history quando disponíveis`);
    console.log(`• orphanet_references (relacionamentos)`);
    
    console.log(`\n⏱️ PROCESSAMENTOS ATIVOS:`);
    console.log(`🔄 HPO Phenotype Associations (170.454 registros)`);
    console.log(`🔄 Product1 Textual Information (11.239 disorders)`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

statusIteracao();
