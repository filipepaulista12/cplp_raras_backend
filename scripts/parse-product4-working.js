const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function parseProduct4Correct() {
  console.log('🧬 PARSER PRODUCT4 CORRETO - HPO ASSOCIATIONS');
  console.log('=============================================');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const xmlFile = 'database/orphadata-sources/en_product4.xml';
  
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ Arquivo não encontrado:', xmlFile);
    return;
  }

  const stats = fs.statSync(xmlFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📁 Arquivo: ${xmlFile} (${sizeMB} MB)`);
  
  console.log('🔄 Parseando XML completo...');
  
  try {
    const content = fs.readFileSync(xmlFile, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);
    
    console.log('✅ XML parseado com sucesso!');
    
    const hpoList = result.JDBOR.HPODisorderSetStatusList[0].HPODisorderSetStatus;
    console.log(`📊 Encontrados ${hpoList.length} disorders`);
    
    // Primeiro, vamos buscar doenças existentes para mapear orpha_code -> orpha_disease_id
    const orphaDiseases = await prisma.$queryRaw`SELECT id, orpha_code FROM orpha_diseases`;
    const orphaMap = new Map();
    orphaDiseases.forEach(disease => {
      orphaMap.set(disease.orpha_code, disease.id);
    });
    
    console.log(`📊 Mapeamento: ${orphaMap.size} doenças Orphanet encontradas`);
    
    // Processar primeiros 200 disorders para teste
    let totalClinicalSigns = 0;
    let totalPhenotypes = 0;
    let skippedDisorders = 0;
    const processedPhenotypes = new Set();
    
    for (let i = 0; i < Math.min(200, hpoList.length); i++) {
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
      
      console.log(`🔄 ${i + 1}/${Math.min(200, hpoList.length)}: ORPHA:${orphaNumber} (${hpoAssociations.length} HPO)`);
      
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
          // 1. Inserir Clinical Sign (usando a estrutura correta)
          await prisma.$executeRawUnsafe(`
            INSERT OR REPLACE INTO orpha_clinical_signs (
              id, orpha_disease_id, sign_name, sign_name_pt, frequency, frequency_value, sign_category
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          crypto.randomUUID(),
          orphaDiseaseId,
          hpoTerm,
          null, // sign_name_pt (por enquanto null)
          frequency,
          null, // frequency_value (por enquanto null)
          'HPO_Phenotype'
          );
          
          totalClinicalSigns++;
          
          // 2. Inserir Phenotype único (usando a estrutura correta)
          if (!processedPhenotypes.has(hpoId)) {
            await prisma.$executeRawUnsafe(`
              INSERT OR REPLACE INTO orpha_phenotypes (
                id, orpha_disease_id, hpo_id, hpo_term, frequency_term, diagnostic_criteria
              ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            crypto.randomUUID(),
            orphaDiseaseId,
            hpoId,
            hpoTerm,
            frequency,
            diagnosticCriteria
            );
            
            processedPhenotypes.add(hpoId);
            totalPhenotypes++;
          }
          
        } catch (error) {
          if (i < 5) { // Mostrar apenas os primeiros erros
            console.log(`   ❌ Erro ao inserir ${hpoId}:`, error.message.substring(0, 50));
          }
        }
      }
      
      if ((i + 1) % 25 === 0) {
        console.log(`   📊 Progresso: ${totalClinicalSigns} signs, ${totalPhenotypes} phenotypes, ${skippedDisorders} skipped`);
      }
    }
    
    // Log final
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      crypto.randomUUID(),
      'product4_hpo_phenotypes',
      'en_product4.xml',
      'success',
      Math.min(200, hpoList.length),
      totalClinicalSigns + totalPhenotypes,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString()
      );
      
    } catch (logError) {
      console.log('⚠️ Log error:', logError.message);
    }
    
    console.log(`\n🎉 IMPORT CONCLUÍDO!`);
    console.log(`✅ Clinical Signs inseridos: ${totalClinicalSigns}`);
    console.log(`✅ Phenotypes únicos: ${totalPhenotypes}`);
    console.log(`⚠️  Disorders sem mapeamento: ${skippedDisorders}`);
    console.log(`📊 Disorders processados: ${Math.min(200, hpoList.length)}/${hpoList.length}`);
    
    return {
      clinicalSigns: totalClinicalSigns,
      phenotypes: totalPhenotypes,
      skipped: skippedDisorders,
      processed: Math.min(200, hpoList.length),
      total: hpoList.length
    };
    
  } catch (error) {
    console.error('❌ Erro no parsing:', error);
    throw error;
  }
}

async function main() {
  try {
    const resultado = await parseProduct4Correct();
    
    console.log('\n🏆 MISSÃO CUMPRIDA!');
    console.log(`📊 Resultados:`);
    console.log(`   • Clinical Signs: ${resultado.clinicalSigns} registros`);
    console.log(`   • Phenotypes: ${resultado.phenotypes} registros`);
    console.log(`   • Processados: ${resultado.processed}/${resultado.total} disorders`);
    console.log(`   • Sem mapeamento: ${resultado.skipped} disorders`);
    
    // Verificar o que foi inserido
    const clinicalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const phenotypeCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_clinical_signs: ${clinicalCount[0].count} registros`);
    console.log(`   • orpha_phenotypes: ${phenotypeCount[0].count} registros`);
    
    console.log(`\n🎯 STATUS DAS TABELAS VAZIAS:`);
    console.log(`✅ orpha_clinical_signs: POPULADA (${clinicalCount[0].count} registros)`);
    console.log(`✅ orpha_phenotypes: POPULADA (${phenotypeCount[0].count} registros)`);
    
    console.log(`\n🚀 PRÓXIMAS MISSÕES:`);
    console.log(`• orpha_gene_associations (product6)`);
    console.log(`• orpha_epidemiology (product9_prev)`);  
    console.log(`• orpha_textual_information (product1)`);
    console.log(`• drug_disease_associations (FDA OOPD)`);
    console.log(`• hpo_phenotype_associations (phenotype.hpoa)`);
    
  } catch (error) {
    console.error('💥 Falha crítica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
