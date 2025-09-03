const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function completeDataInventory() {
  try {
    console.log('📊 INVENTÁRIO COMPLETO DO BANCO CPLP-RARAS');
    console.log('='.repeat(60));
    
    // 1. CORE ORPHANET DATA
    console.log('\n🔬 DADOS PRINCIPAIS ORPHANET:');
    console.log('-'.repeat(40));
    const orphaDisease = await prisma.orphaDisease.count();
    const orphaLinearisation = await prisma.orphaLinearisation.count();
    const orphaExternalMapping = await prisma.orphaExternalMapping.count();
    
    console.log(`OrphaDisease: ${orphaDisease} doenças`);
    console.log(`OrphaLinearisation: ${orphaLinearisation} classificações`);
    console.log(`OrphaExternalMapping: ${orphaExternalMapping} mapeamentos externos`);
    
    // 2. ORPHANET EXTENDED DATA
    console.log('\n🔬 DADOS ESTENDIDOS ORPHANET:');
    console.log('-'.repeat(40));
    
    try { const count = await prisma.orphaMedicalClassification.count(); console.log(`OrphaMedicalClassification: ${count}`); } catch { console.log('OrphaMedicalClassification: ERRO'); }
    try { const count = await prisma.orphaPhenotype.count(); console.log(`OrphaPhenotype: ${count}`); } catch { console.log('OrphaPhenotype: ERRO'); }
    try { const count = await prisma.orphaClinicalSign.count(); console.log(`OrphaClinicalSign: ${count}`); } catch { console.log('OrphaClinicalSign: ERRO'); }
    try { const count = await prisma.orphaGeneAssociation.count(); console.log(`OrphaGeneAssociation: ${count}`); } catch { console.log('OrphaGeneAssociation: ERRO'); }
    try { const count = await prisma.orphaNaturalHistory.count(); console.log(`OrphaNaturalHistory: ${count}`); } catch { console.log('OrphaNaturalHistory: ERRO'); }
    try { const count = await prisma.orphaEpidemiology.count(); console.log(`OrphaEpidemiology: ${count}`); } catch { console.log('OrphaEpidemiology: ERRO'); }
    try { const count = await prisma.orphaTextualInformation.count(); console.log(`OrphaTextualInformation: ${count}`); } catch { console.log('OrphaTextualInformation: ERRO'); }
    
    // 3. CPLP SPECIFIC DATA  
    console.log('\n🌍 DADOS ESPECÍFICOS CPLP:');
    console.log('-'.repeat(40));
    
    try { const count = await prisma.cPLPCountry.count(); console.log(`CPLPCountry: ${count}`); } catch { console.log('CPLPCountry: ERRO'); }
    try { const count = await prisma.orphaCPLPEpidemiology.count(); console.log(`OrphaCPLPEpidemiology: ${count}`); } catch { console.log('OrphaCPLPEpidemiology: ERRO'); }
    try { const count = await prisma.orphaImportLog.count(); console.log(`OrphaImportLog: ${count}`); } catch { console.log('OrphaImportLog: ERRO'); }
    
    // 4. HPO PHENOTYPE SYSTEM
    console.log('\n🧬 SISTEMA HPO (FENÓTIPOS):');
    console.log('-'.repeat(40));
    const hpoTerm = await prisma.hPOTerm.count();
    
    try { const count = await prisma.hPOPhenotypeAssociation.count(); console.log(`HPOPhenotypeAssociation: ${count}`); } catch { console.log('HPOPhenotypeAssociation: ERRO'); }
    try { const count = await prisma.hPOGeneAssociation.count(); console.log(`HPOGeneAssociation: ${count}`); } catch { console.log('HPOGeneAssociation: ERRO'); }
    try { const count = await prisma.hPODiseaseAssociation.count(); console.log(`HPODiseaseAssociation: ${count}`); } catch { console.log('HPODiseaseAssociation: ERRO'); }
    
    console.log(`HPOTerm: ${hpoTerm} termos fenótipicos`);
    
    // 5. INTERNATIONAL MEDICAL SYSTEMS
    console.log('\n🔗 SISTEMAS MÉDICOS INTERNACIONAIS:');
    console.log('-'.repeat(40));
    
    try { const count = await prisma.iCDCode.count(); console.log(`ICDCode: ${count}`); } catch { console.log('ICDCode: ERRO'); }
    try { const count = await prisma.oMIMEntry.count(); console.log(`OMIMEntry: ${count}`); } catch { console.log('OMIMEntry: ERRO'); }
    try { const count = await prisma.uMLSConcept.count(); console.log(`UMLSConcept: ${count}`); } catch { console.log('UMLSConcept: ERRO'); }
    try { const count = await prisma.mONDODisease.count(); console.log(`MONDODisease: ${count}`); } catch { console.log('MONDODisease: ERRO'); }
    
    // 6. DRUGBANK PHARMACEUTICAL SYSTEM
    console.log('\n💊 SISTEMA FARMACÊUTICO DRUGBANK:');
    console.log('-'.repeat(40));
    const drugBankDrug = await prisma.drugBankDrug.count();
    const drugInteraction = await prisma.drugInteraction.count();
    const drugDiseaseAssociation = await prisma.drugDiseaseAssociation.count();
    
    console.log(`DrugBankDrug: ${drugBankDrug} medicamentos`);
    console.log(`DrugInteraction: ${drugInteraction} interações medicamentosas`);
    console.log(`DrugDiseaseAssociation: ${drugDiseaseAssociation} associações droga-doença`);
    
    // 7. RESUMO EXECUTIVO
    console.log('\n📊 RESUMO EXECUTIVO:');
    console.log('='.repeat(60));
    
    const coreData = orphaDisease + orphaLinearisation + orphaExternalMapping;
    const phenotypeData = hpoTerm;
    const pharmaceuticalData = drugBankDrug + drugInteraction + drugDiseaseAssociation;
    
    console.log(`🔬 Dados Orphanet Core: ${coreData} registros`);
    console.log(`🧬 Dados Fenótipicos HPO: ${phenotypeData} registros`);
    console.log(`💊 Dados Farmacêuticos: ${pharmaceuticalData} registros`);
    
    const totalMainRecords = coreData + phenotypeData + pharmaceuticalData;
    console.log(`\n🎯 TOTAL PRINCIPAL: ${totalMainRecords} registros`);
    
    // 8. ANÁLISE DE QUALIDADE
    console.log('\n🏆 ANÁLISE DE QUALIDADE:');
    console.log('-'.repeat(40));
    
    if (orphaDisease > 10000) {
      console.log('✅ Dados Orphanet: EXCELENTE (>10k doenças)');
    } else if (orphaDisease > 5000) {
      console.log('🟡 Dados Orphanet: BOM (5k-10k doenças)');
    } else {
      console.log('🔴 Dados Orphanet: INSUFICIENTE (<5k doenças)');
    }
    
    if (drugBankDrug > 300) {
      console.log('✅ Dados DrugBank: EXCELENTE (>300 medicamentos)');
    } else if (drugBankDrug > 100) {
      console.log('🟡 Dados DrugBank: BOM (100-300 medicamentos)');
    } else {
      console.log('🔴 Dados DrugBank: INSUFICIENTE (<100 medicamentos)');
    }
    
    if (hpoTerm > 100) {
      console.log('✅ Dados HPO: EXCELENTE (>100 termos)');
    } else if (hpoTerm > 20) {
      console.log('🟡 Dados HPO: BOM (20-100 termos)');
    } else {
      console.log('🔴 Dados HPO: INSUFICIENTE (<20 termos)');
    }
    
    // 9. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('-'.repeat(40));
    
    if (drugInteraction < 100) {
      console.log('⚠️  Aumentar interações medicamentosas');
    }
    if (drugDiseaseAssociation < 50) {
      console.log('⚠️  Aumentar associações droga-doença');
    }
    
    console.log('\n🎉 INVENTÁRIO COMPLETO FINALIZADO!');
    
  } catch (error) {
    console.error('❌ ERRO NO INVENTÁRIO:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeDataInventory();
