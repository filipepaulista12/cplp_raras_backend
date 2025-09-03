const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickBackupCheck() {
  console.log('🔍 VERIFICAÇÃO RÁPIDA DO SISTEMA HPO');
  
  try {
    // Verificar HPO Terms
    const hpoCount = await prisma.hPOTerm.count();
    console.log(`🧬 HPO Terms: ${hpoCount.toLocaleString()}`);
    
    // Verificar associações de doença
    const diseaseAssocCount = await prisma.hPODiseaseAssociation.count();
    console.log(`🏥 HPO Disease Associations: ${diseaseAssocCount.toLocaleString()}`);
    
    // Verificar associações de gene
    const geneAssocCount = await prisma.hPOGeneAssociation.count();
    console.log(`🔗 HPO Gene Associations: ${geneAssocCount.toLocaleString()}`);
    
    // Total de associações HPO
    const totalAssoc = diseaseAssocCount + geneAssocCount;
    console.log(`📈 Total HPO Associations: ${totalAssoc.toLocaleString()}`);
    
    // Verificar algumas outras tabelas principais
    let orphaCount = 0, drugCount = 0, gardCount = 0;
    
    try {
      orphaCount = await prisma.orphaDisease.count();
      console.log(`🔸 Orpha Diseases: ${orphaCount.toLocaleString()}`);
    } catch (e) {
      console.log('🔸 Orpha Diseases: Tabela não encontrada');
    }
    
    try {
      drugCount = await prisma.drugBankDrug.count();
      console.log(`💊 DrugBank Drugs: ${drugCount.toLocaleString()}`);
    } catch (e) {
      console.log('💊 DrugBank Drugs: Tabela não encontrada');
    }
    
    try {
      gardCount = await prisma.gARDDisease.count();
      console.log(`🎯 GARD Diseases: ${gardCount.toLocaleString()}`);
    } catch (e) {
      console.log('🎯 GARD Diseases: Tabela não encontrada');
    }
    
    const totalRecords = hpoCount + diseaseAssocCount + geneAssocCount + orphaCount + drugCount + gardCount;
    
    console.log('\n🎉 RESUMO SISTEMA CPLP-RARAS:');
    console.log(`📊 Total de registros principais: ${totalRecords.toLocaleString()}`);
    console.log(`🏆 HPO Sistema: ${hpoCount.toLocaleString()} termos + ${totalAssoc.toLocaleString()} associações`);
    
    if (hpoCount > 18000) {
      console.log('🎯 ✅ MISSÃO HPO CUMPRIDA! Mais de 18.000 termos como o site oficial!');
    }
    
    return {
      success: true,
      hpoCount,
      diseaseAssocCount,
      geneAssocCount,
      totalRecords
    };
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

quickBackupCheck().catch(console.error);
