const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickPopulationStatus() {
  try {
    console.log('📊 STATUS FINAL - BANCO POPULADO:');
    console.log('='.repeat(50));
    
    const finalStats = {
      orphaDisease: await prisma.orphaDisease.count(),
      orphaLinearisation: await prisma.orphaLinearisation.count(),
      orphaExternalMapping: await prisma.orphaExternalMapping.count(),
      hpoTerms: await prisma.hPOTerm.count(),
      hpoDiseaseAssociations: await prisma.hPODiseaseAssociation.count(),
      drugBankDrugs: await prisma.drugBankDrug.count(),
      drugInteractions: await prisma.drugInteraction.count(),
      drugDiseaseAssociations: await prisma.drugDiseaseAssociation.count(),
      icdCodes: await prisma.iCDCode.count(),
      omimEntries: await prisma.oMIMEntry.count(),
      umlsConcepts: await prisma.uMLSConcept.count(),
      mondoDiseases: await prisma.mONDODisease.count(),
      gardDiseases: await prisma.gARDDisease.count(),
      meshDescriptors: await prisma.meSHDescriptor.count(),
      meddrTerms: await prisma.medDRATerm.count(),
      crossSystemMappings: await prisma.crossSystemMapping.count()
    };
    
    console.log(`🔬 OrphaDisease: ${finalStats.orphaDisease}`);
    console.log(`🔬 OrphaLinearisation: ${finalStats.orphaLinearisation}`);
    console.log(`🔬 OrphaExternalMapping: ${finalStats.orphaExternalMapping}`);
    console.log(`🧬 HPOTerms: ${finalStats.hpoTerms}`);
    console.log(`🧬 HPO-Disease Associations: ${finalStats.hpoDiseaseAssociations}`);
    console.log(`💊 DrugBankDrugs: ${finalStats.drugBankDrugs}`);
    console.log(`💊 DrugInteractions: ${finalStats.drugInteractions}`);
    console.log(`💊 Drug-Disease Associations: ${finalStats.drugDiseaseAssociations}`);
    console.log(`🌍 ICDCodes: ${finalStats.icdCodes}`);
    console.log(`🌍 OMIMEntries: ${finalStats.omimEntries}`);
    console.log(`🌍 UMLSConcepts: ${finalStats.umlsConcepts}`);
    console.log(`🌍 MONDODiseases: ${finalStats.mondoDiseases}`);
    console.log(`🌍 GARDDiseases: ${finalStats.gardDiseases}`);
    console.log(`🌍 MeSHDescriptors: ${finalStats.meshDescriptors}`);
    console.log(`🌍 MedDRTerms: ${finalStats.meddrTerms}`);
    console.log(`🌍 CrossSystemMappings: ${finalStats.crossSystemMappings}`);
    
    const totalRecords = Object.values(finalStats).reduce((sum, count) => sum + count, 0);
    console.log(`\n🎯 TOTAL GERAL: ${totalRecords} registros`);
    
    // Verificar quais tabelas estão vazias
    console.log('\n⚠️  TABELAS VAZIAS:');
    Object.entries(finalStats).forEach(([table, count]) => {
      if (count === 0) {
        console.log(`   🚫 ${table}: ${count}`);
      }
    });
    
    console.log('\n✅ TABELAS POPULADAS:');
    Object.entries(finalStats).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ✅ ${table}: ${count}`);
      }
    });
    
    console.log('\n🎉 STATUS ATUAL VERIFICADO!');
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickPopulationStatus();
