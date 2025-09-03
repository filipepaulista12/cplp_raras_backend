import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTablesSimple() {
  console.log('📊 STATUS SIMPLES DAS TABELAS');
  console.log('============================\n');
  
  try {
    // Verificar tabelas uma por uma
    console.log('✅ TABELAS POPULADAS:');
    
    try {
      const clinical = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
      console.log(`  orpha_clinical_signs: ${clinical[0].count} registros`);
    } catch(e) { console.log(`  orpha_clinical_signs: ERRO`); }
    
    try {
      const phenotypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
      console.log(`  orpha_phenotypes: ${phenotypes[0].count} registros`);
    } catch(e) { console.log(`  orpha_phenotypes: ERRO`); }
    
    try {
      const genes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_gene_associations`;
      console.log(`  orpha_gene_associations: ${genes[0].count} registros`);
    } catch(e) { console.log(`  orpha_gene_associations: ERRO`); }
    
    try {
      const textual = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_textual_information`;
      console.log(`  orpha_textual_information: ${textual[0].count} registros`);
    } catch(e) { console.log(`  orpha_textual_information: ERRO`); }
    
    console.log('\n❌ TABELAS VAZIAS:');
    
    try {
      const epidemiology = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_epidemiology`;
      console.log(`  orpha_epidemiology: ${epidemiology[0].count} registros`);
    } catch(e) { console.log(`  orpha_epidemiology: ERRO`); }
    
    try {
      const natural = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_natural_history`;
      console.log(`  orpha_natural_history: ${natural[0].count} registros`);
    } catch(e) { console.log(`  orpha_natural_history: ERRO`); }
    
    try {
      const medical = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_medical_classifications`;
      console.log(`  orpha_medical_classifications: ${medical[0].count} registros`);
    } catch(e) { console.log(`  orpha_medical_classifications: ERRO`); }
    
    try {
      const drugs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM drug_disease_associations`;
      console.log(`  drug_disease_associations: ${drugs[0].count} registros`);
    } catch(e) { console.log(`  drug_disease_associations: ERRO`); }
    
    try {
      const hpo = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
      console.log(`  hpo_phenotype_associations: ${hpo[0].count} registros`);
    } catch(e) { console.log(`  hpo_phenotype_associations: ERRO`); }
    
    try {
      const drugbank = await prisma.$queryRaw`SELECT COUNT(*) as count FROM drugbank_interactions`;
      console.log(`  drugbank_interactions: ${drugbank[0].count} registros`);
    } catch(e) { console.log(`  drugbank_interactions: ERRO`); }
    
    try {
      const refs = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orphanet_references`;
      console.log(`  orphanet_references: ${refs[0].count} registros`);
    } catch(e) { console.log(`  orphanet_references: ERRO`); }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTablesSimple();
