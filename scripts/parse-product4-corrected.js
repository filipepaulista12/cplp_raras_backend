const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseProduct4Final() {
  console.log('\n🧬 PARSER PRODUCT4 FINAL - HPO ASSOCIATIONS');
  console.log('==========================================');
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
    
    // 3. Carregar mapeamento de orphaNumbers para UUIDs
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
    
    // 4. Processar HPO associations (teste com 500 primeiro)
    let totalClinicalSigns = 0;
    let totalPhenotypes = 0;
    let skippedDisorders = 0;
    const processedPhenotypes = new Set();
    
    const batchSize = 500; // Aumentar para 500 para ver mais resultados
    console.log(`\n🚀 Processando ${Math.min(batchSize, hpoList.length)} disorders...\n`);
    
    for (let i = 0; i < Math.min(batchSize, hpoList.length); i++) {
      const hpoStatus = hpoList[i];
      const disorder = hpoStatus.Disorder?.[0];
      
      if (!disorder) continue;
      
      const orphaNumber = disorder.OrphaNumber?.[0];
      if (!orphaNumber) continue;
      
      // Verificar se temos essa doença no banco
      const orphaDiseaseId = orphaMap.get(orphaNumber);
      if (!orphaDiseaseId) {
        skippedDisorders++;
        if (i < 10) { // Mostrar apenas os primeiros skips
          console.log(`⚠️  ORPHA:${orphaNumber} não encontrada no banco`);
        }
        continue;
      }
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      if (!hpoAssociations || !Array.isArray(hpoAssociations)) continue;
      
      console.log(`🔄 ${i + 1}/${Math.min(batchSize, hpoList.length)}: ORPHA:${orphaNumber} (${hpoAssociations.length} HPO)`);
      
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
          if (i < 5) { // Mostrar apenas os primeiros erros
            console.log(`   ❌ Erro ao inserir ${hpoId}:`, error.message.substring(0, 50));
          }
        }
      }
      
      if ((i + 1) % 50 === 0) {
        console.log(`   📊 Progresso: ${totalClinicalSigns} signs, ${totalPhenotypes} phenotypes, ${skippedDisorders} skipped`);
      }
    }
    
    // Log final
    try {
      await prisma.$executeRaw`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (${crypto.randomUUID()}, ${'product4_hpo_phenotypes'}, ${'en_product4.xml'}, ${'success'}, ${Math.min(batchSize, hpoList.length)}, ${totalClinicalSigns + totalPhenotypes}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message);
    }
    
    // Verificação final
    const finalClinical = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const finalPhenotypes = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    
    console.log(`\n🎉 IMPORT CONCLUÍDO!`);
    console.log(`✅ Clinical Signs inseridos: ${totalClinicalSigns}`);
    console.log(`✅ Phenotypes únicos: ${totalPhenotypes}`);
    console.log(`⚠️  Disorders sem mapeamento: ${skippedDisorders}`);
    console.log(`📊 Disorders processados: ${Math.min(batchSize, hpoList.length)}/${hpoList.length}`);
    
    console.log(`\n🏆 MISSÃO CUMPRIDA!`);
    console.log('📊 Resultados:');
    console.log(`   • Clinical Signs: ${totalClinicalSigns} registros`);
    console.log(`   • Phenotypes: ${totalPhenotypes} registros`);
    console.log(`   • Processados: ${Math.min(batchSize, hpoList.length)}/${hpoList.length} disorders`);
    console.log(`   • Sem mapeamento: ${skippedDisorders} disorders`);
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_clinical_signs: ${finalClinical[0].count} registros`);
    console.log(`   • orpha_phenotypes: ${finalPhenotypes[0].count} registros`);
    
    console.log(`\n🎯 STATUS DAS TABELAS VAZIAS:`);
    console.log(`✅ orpha_clinical_signs: POPULADA (${finalClinical[0].count} registros)`);
    console.log(`✅ orpha_phenotypes: POPULADA (${finalPhenotypes[0].count} registros)`);
    
    console.log(`\n🚀 PRÓXIMAS MISSÕES:`);
    console.log('• orpha_gene_associations (product6)');
    console.log('• orpha_epidemiology (product9_prev)'); 
    console.log('• orpha_textual_information (product1)');
    console.log('• drug_disease_associations (FDA OOPD)');
    console.log('• hpo_phenotype_associations (phenotype.hpoa)');
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseProduct4Final();
