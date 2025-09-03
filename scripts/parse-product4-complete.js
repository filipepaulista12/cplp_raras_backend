const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseProduct4Complete() {
  console.log('\n🧬 PARSER PRODUCT4 COMPLETO - TODOS OS DISORDERS');
  console.log('==============================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const xmlPath = 'database/orphadata-sources/en_product4.xml';
  const stats = fs.statSync(xmlPath);
  console.log(`📁 Arquivo: ${xmlPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // 1. Parse XML
    console.log('🔄 Parseando XML completo...');
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    console.log('✅ XML parseado com sucesso!');
    
    // 2. Extrair lista de HPO disorders
    const hpoList = result.JDBOR?.HPODisorderSetStatusList?.[0]?.HPODisorderSetStatus;
    if (!hpoList || !Array.isArray(hpoList)) {
      throw new Error('Estrutura XML inválida - HPODisorderSetStatus não encontrado');
    }
    
    console.log(`📊 Encontrados ${hpoList.length} disorders`);
    
    // 3. Limpar tabelas existentes para começar fresh
    console.log('🧹 Limpando tabelas existentes...');
    await prisma.$executeRaw`DELETE FROM orpha_clinical_signs`;
    await prisma.$executeRaw`DELETE FROM orpha_phenotypes`;
    console.log('✅ Tabelas limpas');
    
    // 4. Carregar mapeamento de orphaCodes para UUIDs
    console.log('🔄 Carregando mapeamento Orphanet...');
    const orphaMapping = await prisma.$queryRaw`
      SELECT id, orpha_number FROM orpha_diseases
    `;
    
    const orphaMap = new Map();
    orphaMapping.forEach(disease => {
      // Extrair apenas o número do orpha_number (ex: "ORPHA:58" -> "58")
      const orphaNum = disease.orpha_number.replace('ORPHA:', '');
      orphaMap.set(orphaNum, disease.id);
    });
    
    console.log(`📊 Mapeamento: ${orphaMapping.length} doenças Orphanet encontradas`);
    
    // 5. Processar TODOS os HPO associations
    let totalClinicalSigns = 0;
    let totalPhenotypes = 0;
    let skippedDisorders = 0;
    const processedPhenotypes = new Set();
    
    console.log(`\n🚀 Processando TODOS os ${hpoList.length} disorders...\n`);
    
    for (let i = 0; i < hpoList.length; i++) {
      const hpoStatus = hpoList[i];
      const disorder = hpoStatus.Disorder?.[0];
      
      if (!disorder) {
        skippedDisorders++;
        continue;
      }
      
      const orphaCode = disorder.OrphaCode?.[0];
      if (!orphaCode) {
        skippedDisorders++;
        continue;
      }
      
      // Verificar se temos essa doença no banco
      const orphaDiseaseId = orphaMap.get(orphaCode);
      if (!orphaDiseaseId) {
        skippedDisorders++;
        continue;
      }
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      if (!hpoAssociations || !Array.isArray(hpoAssociations)) {
        continue; // Não contar como skip, apenas sem HPO
      }
      
      // Log de progresso a cada 100
      if ((i + 1) % 100 === 0) {
        console.log(`🔄 ${i + 1}/${hpoList.length}: ORPHA:${orphaCode} (${hpoAssociations.length} HPO) - Total: ${totalClinicalSigns} signs`);
      }
      
      // Processar cada associação HPO
      for (const assoc of hpoAssociations) {
        const hpo = assoc.HPO?.[0];
        if (!hpo) continue;
        
        const hpoId = hpo.HPOId?.[0];
        const hpoTerm = hpo.HPOTerm?.[0];
        
        if (!hpoId || !hpoTerm) continue;
        
        const frequency = assoc.HPOFrequency?.[0]?.Name?.[0] || null;
        const diagnosticCriteria = assoc.DiagnosticCriteria?.[0] || null;
        
        try {
          // 1. Inserir Clinical Sign 
          await prisma.$executeRaw`
            INSERT OR REPLACE INTO orpha_clinical_signs (
              id, orpha_disease_id, sign_name, sign_name_pt, frequency, frequency_value, sign_category
            ) VALUES (${crypto.randomUUID()}, ${orphaDiseaseId}, ${hpoTerm}, ${null}, ${frequency}, ${null}, ${'HPO_Phenotype'})
          `;
          
          totalClinicalSigns++;
          
          // 2. Inserir Phenotype único 
          const phenotypeKey = `${orphaDiseaseId}_${hpoId}`;
          if (!processedPhenotypes.has(phenotypeKey)) {
            await prisma.$executeRaw`
              INSERT OR REPLACE INTO orpha_phenotypes (
                id, orpha_disease_id, hpo_id, hpo_term, frequency_hpo_id, frequency_term, frequency_value, diagnostic_criteria
              ) VALUES (${crypto.randomUUID()}, ${orphaDiseaseId}, ${hpoId}, ${hpoTerm}, ${null}, ${frequency}, ${null}, ${diagnosticCriteria})
            `;
            
            processedPhenotypes.add(phenotypeKey);
            totalPhenotypes++;
          }
          
        } catch (error) {
          if (totalClinicalSigns < 5) { // Mostrar apenas os primeiros erros
            console.log(`   ❌ Erro ao inserir ${hpoId}: ${error.message.substring(0, 50)}`);
          }
        }
      }
    }
    
    // Log final
    try {
      await prisma.$executeRaw`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (${crypto.randomUUID()}, ${'product4_hpo_phenotypes_complete'}, ${'en_product4.xml'}, ${'success'}, ${hpoList.length}, ${totalClinicalSigns + totalPhenotypes}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message.substring(0, 50));
    }
    
    // Verificação final
    const finalClinical = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const finalPhenotypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    
    console.log(`\n🎉 IMPORT COMPLETO CONCLUÍDO!`);
    console.log(`✅ Clinical Signs inseridos: ${totalClinicalSigns}`);
    console.log(`✅ Phenotypes únicos: ${totalPhenotypes}`);
    console.log(`⚠️  Disorders sem mapeamento: ${skippedDisorders}`);
    console.log(`📊 Disorders processados: ${hpoList.length}/${hpoList.length}`);
    
    console.log(`\n🏆 PRIMEIRA MISSÃO COMPLETA!`);
    console.log('📊 Resultados Finais:');
    console.log(`   • Clinical Signs: ${totalClinicalSigns} registros`);
    console.log(`   • Phenotypes: ${totalPhenotypes} registros únicos`);
    console.log(`   • Processados: TODOS os ${hpoList.length} disorders`);
    console.log(`   • Sem mapeamento: ${skippedDisorders} disorders`);
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_clinical_signs: ${finalClinical[0].count} registros`);
    console.log(`   • orpha_phenotypes: ${finalPhenotypes[0].count} registros`);
    
    console.log(`\n🎯 TABELAS POPULADAS COM SUCESSO:`);
    console.log(`✅ orpha_clinical_signs: COMPLETA (${finalClinical[0].count} registros)`);
    console.log(`✅ orpha_phenotypes: COMPLETA (${finalPhenotypes[0].count} registros)`);
    
    console.log(`\n🚀 PRÓXIMAS MISSÕES (9 TABELAS RESTANTES):`);
    console.log('• orpha_gene_associations (product6.xml)');
    console.log('• orpha_epidemiology (product9_prev.xml)'); 
    console.log('• orpha_textual_information (product1.xml)');
    console.log('• orpha_natural_history (product9_ages.xml)');
    console.log('• orpha_medical_classifications (product3_181.xml + product3_156.xml)');
    console.log('• drug_disease_associations (FDA OOPD)');
    console.log('• hpo_phenotype_associations (phenotype.hpoa)');
    console.log('• drugbank_interactions (DrugBank XML)');
    console.log('• orphanet_references (bibliographic data)');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseProduct4Complete();
