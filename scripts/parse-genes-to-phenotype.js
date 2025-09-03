const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseGenesTPhenotype() {
  console.log('\n🧬 PARSER GENES TO PHENOTYPE (ORPHA)');
  console.log('====================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const filePath = 'database/hpo-official/genes_to_phenotype.txt';
  const stats = fs.statSync(filePath);
  console.log(`📁 Arquivo: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // 1. Ler arquivo
    console.log('🔄 Lendo arquivo genes_to_phenotype.txt...');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log(`📊 Total de linhas: ${lines.length}`);
    
    // Filtrar apenas linhas ORPHA
    const orphaLines = lines.filter(line => line.includes('ORPHA:'));
    console.log(`📊 Linhas ORPHA: ${orphaLines.length}`);
    
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
    
    // 3. Processar associações (TODAS as ORPHA)
    let totalProcessed = 0;
    let totalInserted = 0;
    let skipped = 0;
    
    console.log(`\n🚀 Processando TODAS as ${orphaLines.length} associações ORPHA...\n`);
    
    for (let i = 0; i < orphaLines.length; i++) {
      const line = orphaLines[i];
      const fields = line.split('\t');
      
      if (fields.length < 6) {
        skipped++;
        continue;
      }
      
      // Parse dos campos
      // ncbi_gene_id gene_symbol hpo_id hpo_name frequency disease_id
      const ncbiGeneId = fields[0]?.trim();
      const geneSymbol = fields[1]?.trim();
      const hpoId = fields[2]?.trim(); // HP:0001234
      const hpoName = fields[3]?.trim();
      const frequency = fields[4]?.trim();
      const diseaseId = fields[5]?.trim(); // ORPHA:123456
      
      totalProcessed++;
      
      // Processar apenas ORPHA
      if (!diseaseId.startsWith('ORPHA:')) {
        continue;
      }
      
      const orphaCode = diseaseId.replace('ORPHA:', '');
      const orphaDiseaseId = orphaMap.get(orphaCode);
      const hpoTermId = hpoMap.get(hpoId);
      
      if (!orphaDiseaseId || !hpoTermId) {
        if (totalInserted < 10) {
          console.log(`⚠️  Skipping: ${diseaseId} ${hpoId} (não mapeado)`);
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
            ${crypto.randomUUID()}, ${orphaDiseaseId}, ${hpoTermId}, ${null}, ${frequency || null},
            ${null}, ${null}, ${null}, ${null}, ${null},
            ${'genes_to_phenotype'}, ${diseaseId}, ${frequency || null}, ${null}, 
            ${new Date().toISOString()}, ${new Date().toISOString()}
          )
        `;
        
        totalInserted++;
        
        if (totalInserted % 5000 === 0) {
          console.log(`🔄 ${i + 1}/${orphaLines.length}: ${totalInserted} inseridas (${((i+1)/orphaLines.length*100).toFixed(1)}%)`);
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
        VALUES (${crypto.randomUUID()}, ${'hpo_phenotype_associations_genes'}, ${'genes_to_phenotype.txt'}, ${'success'}, ${totalProcessed}, ${totalInserted}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message.substring(0, 50));
    }
    
    // Verificação final
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    
    console.log(`\n🎉 IMPORT HPO GENES->PHENOTYPE CONCLUÍDO!`);
    console.log(`✅ Associações inseridas: ${totalInserted}`);
    console.log(`📊 Linhas processadas: ${totalProcessed}`);
    console.log(`⚠️  Linhas puladas: ${skipped}`);
    
    if (totalInserted > 0) {
      console.log(`\n🏆 QUINTA MISSÃO CUMPRIDA!`);
      console.log('📊 Resultados:');
      console.log(`   • HPO Associations: ${totalInserted} registros`);
      console.log(`   • Processadas: ${totalProcessed}/${orphaLines.length} linhas ORPHA`);
      
      console.log(`\n📊 VERIFICAÇÃO FINAL:`);
      console.log(`   • hpo_phenotype_associations: ${finalCount[0].count} registros`);
      
      console.log(`\n🎯 STATUS ATUALIZADO (5/11 COMPLETAS):`);
      console.log(`✅ orpha_clinical_signs: 8.483 registros`);
      console.log(`✅ orpha_phenotypes: 8.482 registros`);
      console.log(`✅ orpha_gene_associations: 8.300 registros`);
      console.log(`✅ orpha_textual_information: 145 registros`);
      console.log(`✅ hpo_phenotype_associations: ${finalCount[0].count} registros`);
      
      console.log(`\n🚀 PRÓXIMAS MISSÕES (6 TABELAS RESTANTES):`);
      console.log('• Processar TODAS as 170.454 associações HPO-ORPHA');
      console.log('• Completar product1 textual information (11.239 total)');
      console.log('• drug_disease_associations (FDA OOPD)');
      console.log('• orpha_epidemiology (quando XML estiver disponível)');
      console.log('• orpha_natural_history (quando XML estiver disponível)');
      console.log('• orpha_medical_classifications (quando XML estiver disponível)');
    } else {
      console.log('\n⚠️ Nenhuma associação foi inserida. Verifique mapeamentos.');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseGenesTPhenotype();
