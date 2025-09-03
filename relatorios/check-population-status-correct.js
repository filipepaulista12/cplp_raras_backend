const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickPopulationStatusCorrect() {
  try {
    console.log('📊 STATUS FINAL - BANCO POPULADO:');
    console.log('='.repeat(50));
    
    // Tabelas principais existentes
    const finalStats = {
      // Orphanet Core
      orphaDisease: await prisma.orphaDisease.count(),
      orphaLinearisation: await prisma.orphaLinearisation.count(),
      orphaExternalMapping: await prisma.orphaExternalMapping.count(),
      orphaMedicalClassification: await prisma.orphaMedicalClassification.count(),
      orphaPhenotype: await prisma.orphaPhenotype.count(),
      orphaClinicalSign: await prisma.orphaClinicalSign.count(),
      orphaGeneAssociation: await prisma.orphaGeneAssociation.count(),
      orphaNaturalHistory: await prisma.orphaNaturalHistory.count(),
      orphaEpidemiology: await prisma.orphaEpidemiology.count(),
      orphaTextualInformation: await prisma.orphaTextualInformation.count(),
      
      // CPLP específico
      cplpCountry: await prisma.cPLPCountry.count(),
      orphaCPLPEpidemiology: await prisma.orphaCPLPEpidemiology.count(),
      orphaImportLog: await prisma.orphaImportLog.count(),
      
      // HPO System
      hpoTerms: await prisma.hPOTerm.count(),
      hpoPhenotypeAssociation: await prisma.hPOPhenotypeAssociation.count(),
      hpoGeneAssociation: await prisma.hPOGeneAssociation.count(),
      hpoDiseaseAssociation: await prisma.hPODiseaseAssociation.count(),
      
      // Medical Systems
      icdCode: await prisma.iCDCode.count(),
      omimEntry: await prisma.oMIMEntry.count(),
      umlsConcept: await prisma.uMLSConcept.count(),
      mondoDisease: await prisma.mONDODisease.count(),
      
      // DrugBank
      drugBankDrug: await prisma.drugBankDrug.count(),
      drugInteraction: await prisma.drugInteraction.count(),
      drugDiseaseAssociation: await prisma.drugDiseaseAssociation.count()
    };
    
    console.log(`🔬 OrphaDisease: ${finalStats.orphaDisease}`);
    console.log(`🔬 OrphaLinearisation: ${finalStats.orphaLinearisation}`);
    console.log(`🔬 OrphaExternalMapping: ${finalStats.orphaExternalMapping}`);
    console.log(`🔬 OrphaMedicalClassification: ${finalStats.orphaMedicalClassification}`);
    console.log(`🔬 OrphaPhenotype: ${finalStats.orphaPhenotype}`);
    console.log(`🔬 OrphaClinicalSign: ${finalStats.orphaClinicalSign}`);
    console.log(`🔬 OrphaGeneAssociation: ${finalStats.orphaGeneAssociation}`);
    console.log(`🔬 OrphaNaturalHistory: ${finalStats.orphaNaturalHistory}`);
    console.log(`🔬 OrphaEpidemiology: ${finalStats.orphaEpidemiology}`);
    console.log(`🔬 OrphaTextualInformation: ${finalStats.orphaTextualInformation}`);
    
    console.log(`\n🌍 CPLPCountry: ${finalStats.cplpCountry}`);
    console.log(`🌍 OrphaCPLPEpidemiology: ${finalStats.orphaCPLPEpidemiology}`);
    console.log(`🌍 OrphaImportLog: ${finalStats.orphaImportLog}`);
    
    console.log(`\n🧬 HPOTerms: ${finalStats.hpoTerms}`);
    console.log(`🧬 HPOPhenotypeAssociation: ${finalStats.hpoPhenotypeAssociation}`);
    console.log(`🧬 HPOGeneAssociation: ${finalStats.hpoGeneAssociation}`);
    console.log(`🧬 HPO-Disease Association: ${finalStats.hpoDiseaseAssociation}`);
    
    console.log(`\n🔗 ICDCode: ${finalStats.icdCode}`);
    console.log(`🔗 OMIMEntry: ${finalStats.omimEntry}`);
    console.log(`🔗 UMLSConcept: ${finalStats.umlsConcept}`);
    console.log(`🔗 MONDODisease: ${finalStats.mondoDisease}`);
    
    console.log(`\n💊 DrugBankDrug: ${finalStats.drugBankDrug}`);
    console.log(`💊 DrugInteraction: ${finalStats.drugInteraction}`);
    console.log(`💊 Drug-Disease Association: ${finalStats.drugDiseaseAssociation}`);
    
    const totalRecords = Object.values(finalStats).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 TOTAL GERAL: ${totalRecords} registros`);
    
    // Verificar quais tabelas estão vazias
    console.log('\n🚫 TABELAS VAZIAS (precisam ser populadas):');
    Object.entries(finalStats).forEach(([table, count]) => {
      if (count === 0) {
        console.log(`   ⚠️  ${table}: ${count}`);
      }
    });
    
    console.log('\n✅ TABELAS POPULADAS:');
    Object.entries(finalStats).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ✅ ${table}: ${count}`);
      }
    });
    
    // Calcular percentual de completude
    const totalTables = Object.keys(finalStats).length;
    const populatedTables = Object.values(finalStats).filter(count => count > 0).length;
    const completionPercentage = Math.round((populatedTables / totalTables) * 100);
    
    console.log(`\n📈 COMPLETUDE DO BANCO: ${populatedTables}/${totalTables} tabelas (${completionPercentage}%)`);
    
    if (completionPercentage < 50) {
      console.log('🔴 BANCO POUCO POPULADO - PRECISA DE MAIS DADOS!');
    } else if (completionPercentage < 80) {
      console.log('🟡 BANCO PARCIALMENTE POPULADO - BOA BASE!');
    } else {
      console.log('🟢 BANCO BEM POPULADO - EXCELENTE!');
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickPopulationStatusCorrect();
