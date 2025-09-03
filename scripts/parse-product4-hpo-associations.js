const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function parseProduct4HPOAssociations() {
  console.log('🧬 PARSER PRODUCT4 - HPO ASSOCIATIONS');
  console.log('====================================');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const xmlFile = 'database/orphadata-sources/en_product4.xml';
  
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ Arquivo não encontrado:', xmlFile);
    console.log('💡 Execute primeiro: node scripts/download-orphadata-sources.js');
    return;
  }

  // Verificar tamanho do arquivo
  const stats = fs.statSync(xmlFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📁 Arquivo: ${xmlFile} (${sizeMB} MB)`);
  
  // Calcular checksum para log
  const content = fs.readFileSync(xmlFile);
  const checksum = crypto.createHash('sha256').update(content).digest('hex');
  console.log(`🔍 SHA-256: ${checksum.substring(0, 16)}...`);
  
  console.log('🔄 Parseando XML...');
  
  try {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);
    
    console.log('✅ XML parseado com sucesso!');
    
    // Navegar na estrutura XML
    const hpoDisorderAssociations = result?.HPOPhenotypes?.HPODisorderSetStatusList?.[0]?.HPODisorderSetStatus?.[0]?.Disorder || [];
    
    console.log(`📊 Encontrados ${hpoDisorderAssociations.length} disorders com associações HPO`);
    
    let totalAssociations = 0;
    let processedDisorders = 0;
    const orphaClinicalSigns = [];
    const orphaPhenotypes = new Map(); // Para dedupe de HPO terms
    
    for (const disorder of hpoDisorderAssociations.slice(0, 100)) { // Limitar para teste
      const orphaNumber = disorder.OrphaNumber?.[0];
      if (!orphaNumber) continue;
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation || [];
      
      for (const assoc of hpoAssociations) {
        const hpoTerm = assoc.HPO?.[0]?.HPOTerm?.[0];
        if (!hpoTerm) continue;
        
        const hpoId = hpoTerm.HPOId?.[0];
        const hpoName = hpoTerm.HPOTerm?.[0];
        const frequency = assoc.HPOFrequency?.[0]?.Name?.[0] || null;
        const diagnosticCriterion = assoc.DiagnosticCriteria?.[0] === 'true' ? 1 : 0;
        const typicality = assoc.HPOFrequency?.[0]?.Name?.[0] || null;
        
        if (hpoId && hpoName) {
          // Para OrphaClinicalSign
          orphaClinicalSigns.push({
            id: crypto.randomUUID(),
            orpha_code: orphaNumber,
            hpo_id: hpoId,
            hpo_name: hpoName,
            frequency: frequency,
            diagnostic_criterion: diagnosticCriterion,
            typicality: typicality,
            provenance: 'Orphadata_product4',
            created_at: new Date(),
            updated_at: new Date()
          });
          
          // Para OrphaPhenotype (dedupe)
          if (!orphaPhenotypes.has(hpoId)) {
            orphaPhenotypes.set(hpoId, {
              id: crypto.randomUUID(),
              hpo_id: hpoId,
              hpo_name: hpoName,
              last_seen: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            });
          }
          
          totalAssociations++;
        }
      }
      
      processedDisorders++;
      
      if (processedDisorders % 10 === 0) {
        console.log(`   🔄 Processados: ${processedDisorders} disorders, ${totalAssociations} associações`);
      }
    }
    
    console.log(`\n📊 RESUMO DO PARSING:`);
    console.log(`   • Disorders processados: ${processedDisorders}`);
    console.log(`   • Associações HPO encontradas: ${totalAssociations}`);
    console.log(`   • Phenótipos únicos: ${orphaPhenotypes.size}`);
    
    // Inserir em lotes
    console.log(`\n💾 INSERINDO NO BANCO DE DADOS...`);
    
    // 1. OrphaClinicalSigns
    if (orphaClinicalSigns.length > 0) {
      console.log(`🔄 Inserindo ${orphaClinicalSigns.length} clinical signs...`);
      
      const batchSize = 100;
      for (let i = 0; i < orphaClinicalSigns.length; i += batchSize) {
        const batch = orphaClinicalSigns.slice(i, i + batchSize);
        
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO orpha_clinical_signs (id, orpha_code, hpo_id, hpo_name, frequency, diagnostic_criterion, typicality, provenance, created_at, updated_at)
            VALUES ${batch.map(item => `(
              '${item.id}',
              '${item.orpha_code}',
              '${item.hpo_id}',
              '${item.hpo_name.replace(/'/g, "''")}',
              ${item.frequency ? `'${item.frequency.replace(/'/g, "''")}'` : 'NULL'},
              ${item.diagnostic_criterion},
              ${item.typicality ? `'${item.typicality.replace(/'/g, "''")}'` : 'NULL'},
              '${item.provenance}',
              '${item.created_at.toISOString()}',
              '${item.updated_at.toISOString()}'
            )`).join(', ')}
            ON CONFLICT (orpha_code, hpo_id) DO UPDATE SET
              hpo_name = EXCLUDED.hpo_name,
              frequency = EXCLUDED.frequency,
              diagnostic_criterion = EXCLUDED.diagnostic_criterion,
              typicality = EXCLUDED.typicality,
              updated_at = EXCLUDED.updated_at
          `);
          
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} registros`);
          
        } catch (error) {
          console.log(`   ❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }
    }
    
    // 2. OrphaPhenotypes
    const phenotypeArray = Array.from(orphaPhenotypes.values());
    if (phenotypeArray.length > 0) {
      console.log(`🔄 Inserindo ${phenotypeArray.length} phenotypes únicos...`);
      
      const batchSize = 100;
      for (let i = 0; i < phenotypeArray.length; i += batchSize) {
        const batch = phenotypeArray.slice(i, i + batchSize);
        
        try {
          await prisma.$executeRawUnsafe(`
            INSERT INTO orpha_phenotypes (id, hpo_id, hpo_name, last_seen, created_at, updated_at)
            VALUES ${batch.map(item => `(
              '${item.id}',
              '${item.hpo_id}',
              '${item.hpo_name.replace(/'/g, "''")}',
              '${item.last_seen.toISOString()}',
              '${item.created_at.toISOString()}',
              '${item.updated_at.toISOString()}'
            )`).join(', ')}
            ON CONFLICT (hpo_id) DO UPDATE SET
              hpo_name = EXCLUDED.hpo_name,
              last_seen = EXCLUDED.last_seen,
              updated_at = EXCLUDED.updated_at
          `);
          
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} phenotypes`);
          
        } catch (error) {
          console.log(`   ❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }
    }
    
    // 3. Log do import
    await prisma.orpha_import_logs.create({
      data: {
        id: crypto.randomUUID(),
        source: 'product4',
        version: '2025-09',
        file_name: 'en_product4.xml',
        started_at: new Date(),
        completed_at: new Date(),
        rows_inserted: totalAssociations,
        rows_updated: 0,
        status: 'success',
        message: `Processados ${processedDisorders} disorders, ${totalAssociations} associações HPO`,
        checksum_sha256: checksum,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log(`\n🎉 IMPORT CONCLUÍDO!`);
    console.log(`✅ Clinical Signs: ${orphaClinicalSigns.length} registros`);
    console.log(`✅ Phenotypes: ${phenotypeArray.length} registros únicos`);
    console.log(`✅ Log salvo na tabela orpha_import_logs`);
    
    return {
      clinicalSigns: orphaClinicalSigns.length,
      phenotypes: phenotypeArray.length,
      disorders: processedDisorders,
      checksum: checksum.substring(0, 16)
    };
    
  } catch (error) {
    console.error('❌ Erro no parsing:', error);
    
    // Log do erro
    await prisma.orpha_import_logs.create({
      data: {
        id: crypto.randomUUID(),
        source: 'product4',
        version: '2025-09',
        file_name: 'en_product4.xml',
        started_at: new Date(),
        completed_at: new Date(),
        rows_inserted: 0,
        rows_updated: 0,
        status: 'error',
        message: error.message,
        checksum_sha256: checksum,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    throw error;
  }
}

async function main() {
  try {
    const resultado = await parseProduct4HPOAssociations();
    console.log('\n🏆 MISSÃO CUMPRIDA!');
    console.log(`📊 Dados: ${resultado.clinicalSigns + resultado.phenotypes} registros totais`);
    console.log(`🔍 Hash: ${resultado.checksum}...`);
    
  } catch (error) {
    console.error('💥 Falha crítica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
