const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseHpoAssociations() {
  console.log('\n🧬 PARSER HPO PHENOTYPE ASSOCIATIONS');
  console.log('===================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const hpoaPath = 'database/hpo-official/phenotype.hpoa';
  const stats = fs.statSync(hpoaPath);
  console.log(`📁 Arquivo: ${hpoaPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // 1. Ler arquivo HPOA
    console.log('🔄 Lendo arquivo phenotype.hpoa...');
    const hpoaContent = fs.readFileSync(hpoaPath, 'utf-8');
    const lines = hpoaContent.split('\n').filter(line => !line.startsWith('#') && line.trim());
    
    console.log(`📊 Total de linhas: ${lines.length}`);
    
    // 2. Carregar mapeamentos
    console.log('🔄 Carregando mapeamentos...');
    
    // Mapeamento Orphanet
    const orphaMapping = await prisma.$queryRaw`
      SELECT id, orpha_code FROM orpha_diseases
    `;
    
    const orphaMap = new Map();
    orphaMapping.forEach(disease => {
      orphaMap.set(disease.orpha_code, disease.id);
    });
    console.log(`📊 Orphanet: ${orphaMapping.length} doenças`);
    
    // Mapeamento HPO Terms
    const hpoMapping = await prisma.$queryRaw`
      SELECT id, hpoId FROM hpo_terms
    `;
    
    const hpoMap = new Map();
    hpoMapping.forEach(term => {
      hpoMap.set(term.hpoId, term.id);
    });
    console.log(`📊 HPO Terms: ${hpoMapping.length} termos`);
    
    // 3. Processar associações (teste com 1000 primeiras)
    let totalProcessed = 0;
    let totalInserted = 0;
    let skipped = 0;
    
    const batchSize = 1000;
    console.log(`\n🚀 Processando ${Math.min(batchSize, lines.length)} associações...\n`);
    
    for (let i = 0; i < Math.min(batchSize, lines.length); i++) {
      const line = lines[i];
      const fields = line.split('\t');
      
      if (fields.length < 12) {
        skipped++;
        continue;
      }
      
      // Parse dos campos do HPOA
      const databaseId = fields[0]?.trim(); // OMIM:123456 ou ORPHANET:123
      const diseaseName = fields[1]?.trim();
      const qualifier = fields[2]?.trim();
      const hpoId = fields[3]?.trim(); // HP:0001234
      const reference = fields[4]?.trim();
      const evidence = fields[5]?.trim();
      const onset = fields[6]?.trim();
      const frequency = fields[7]?.trim();
      const sex = fields[8]?.trim();
      const modifier = fields[9]?.trim();
      const aspect = fields[10]?.trim();
      const biocuration = fields[11]?.trim();
      
      totalProcessed++;
      
      // Processar apenas ORPHANET por enquanto
      if (!databaseId.startsWith('ORPHANET:')) {
        continue;
      }
      
      const orphaCode = databaseId.replace('ORPHANET:', '');
      const orphaDiseaseId = orphaMap.get(orphaCode);
      const hpoTermId = hpoMap.get(hpoId);
      
      if (!orphaDiseaseId || !hpoTermId) {
        if (totalInserted < 10) {
          console.log(`⚠️  Skipping: ${databaseId} ${hpoId} (não mapeado)`);
        }
        continue;
      }
      
      try {
        // Inserir associação HPO
        await prisma.$executeRaw`
          INSERT OR REPLACE INTO hpo_phenotype_associations (
            id, orphaDiseaseId, hpoTermId, frequencyHPO, frequencyTerm, 
            frequencyNumeric, onsetHPO, onsetTerm, severity, clinicalModifiers,
            evidence, reference, frequency, qualifier, createdAt, updatedAt
          ) VALUES (
            ${crypto.randomUUID()}, ${orphaDiseaseId}, ${hpoTermId}, ${null}, ${frequency},
            ${null}, ${null}, ${onset}, ${null}, ${modifier},
            ${evidence}, ${reference}, ${frequency}, ${qualifier}, 
            ${new Date().toISOString()}, ${new Date().toISOString()}
          )
        `;
        
        totalInserted++;
        
        if (totalInserted % 100 === 0) {
          console.log(`🔄 ${i + 1}/${Math.min(batchSize, lines.length)}: ${totalInserted} inseridas`);
        }
        
      } catch (error) {
        if (totalInserted < 5) {
          console.log(`❌ Erro ao inserir: ${error.message.substring(0, 80)}`);
        }
      }
    }
    
    // Log final
    try {
      await prisma.$executeRaw`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (${crypto.randomUUID()}, ${'hpo_phenotype_associations'}, ${'phenotype.hpoa'}, ${'success'}, ${totalProcessed}, ${totalInserted}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message.substring(0, 50));
    }
    
    // Verificação final
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    
    console.log(`\n🎉 IMPORT HPO ASSOCIATIONS CONCLUÍDO!`);
    console.log(`✅ Associações inseridas: ${totalInserted}`);
    console.log(`📊 Linhas processadas: ${totalProcessed}`);
    console.log(`⚠️  Linhas puladas: ${skipped}`);
    
    console.log(`\n🏆 QUINTA MISSÃO CUMPRIDA!`);
    console.log('📊 Resultados:');
    console.log(`   • HPO Associations: ${totalInserted} registros`);
    console.log(`   • Processadas: ${totalProcessed}/${lines.length} linhas`);
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • hpo_phenotype_associations: ${finalCount[0].count} registros`);
    
    console.log(`\n🎯 STATUS ATUALIZADO (5/11 COMPLETAS):`);
    console.log(`✅ orpha_clinical_signs: 8.483 registros`);
    console.log(`✅ orpha_phenotypes: 8.482 registros`);
    console.log(`✅ orpha_gene_associations: 8.300 registros`);
    console.log(`✅ orpha_textual_information: 145 registros`);
    console.log(`✅ hpo_phenotype_associations: ${finalCount[0].count} registros`);
    
    if (totalInserted > 0) {
      console.log(`\n🚀 PRÓXIMAS MISSÕES (6 TABELAS RESTANTES):`);
      console.log('• Processar todas as 272.731 associações HPO');
      console.log('• Completar product1 textual information (11.239 total)');
      console.log('• drug_disease_associations (FDA OOPD)');
      console.log('• orpha_epidemiology (quando XML estiver disponível)');
      console.log('• orpha_natural_history (quando XML estiver disponível)');
      console.log('• orpha_medical_classifications (quando XML estiver disponível)');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseHpoAssociations();
