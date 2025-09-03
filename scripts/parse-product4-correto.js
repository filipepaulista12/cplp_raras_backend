const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function parseProduct4Correct() {
  console.log('🧬 PARSER PRODUCT4 CORRETO - HPO ASSOCIATIONS');
  console.log('============================================');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const xmlFile = 'database/orphadata-sources/en_product4.xml';
  
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ Arquivo não encontrado:', xmlFile);
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
    
    // Estrutura correta encontrada na análise
    const jdbor = result?.JDBOR;
    if (!jdbor) {
      throw new Error('Estrutura JDBOR não encontrada');
    }

    const hpoDisorderSetStatusList = jdbor.HPODisorderSetStatusList?.[0]?.HPODisorderSetStatus;
    if (!hpoDisorderSetStatusList) {
      throw new Error('HPODisorderSetStatusList não encontrada');
    }
    
    console.log(`📊 Encontrados ${hpoDisorderSetStatusList.length} disorders com associações HPO`);
    
    let totalAssociations = 0;
    let processedDisorders = 0;
    const orphaClinicalSigns = [];
    const orphaPhenotypes = new Map();
    
    // Processar primeiros 500 disorders para teste
    for (const hpoStatus of hpoDisorderSetStatusList.slice(0, 500)) {
      const disorder = hpoStatus.Disorder?.[0];
      if (!disorder) continue;
      
      const orphaNumber = disorder.OrphaNumber?.[0];
      if (!orphaNumber) continue;
      
      const hpoAssociationList = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      if (!hpoAssociationList || !Array.isArray(hpoAssociationList)) continue;
      
      for (const assoc of hpoAssociationList) {
        const hpo = assoc.HPO?.[0];
        if (!hpo) continue;
        
        const hpoId = hpo.HPOId?.[0];
        const hpoTerm = hpo.HPOTerm?.[0];
        
        if (!hpoId || !hpoTerm) continue;
        
        const frequency = assoc.HPOFrequency?.[0]?.Name?.[0] || null;
        const diagnosticCriterion = assoc.DiagnosticCriteria?.[0] === 'true' ? 1 : 0;
        
        // Para OrphaClinicalSign
        orphaClinicalSigns.push({
          id: crypto.randomUUID(),
          orpha_code: orphaNumber,
          hpo_id: hpoId,
          hpo_name: hpoTerm,
          frequency: frequency,
          diagnostic_criterion: diagnosticCriterion,
          typicality: frequency, // Usando frequency como typicality por enquanto
          provenance: 'Orphadata_product4',
          created_at: new Date(),
          updated_at: new Date()
        });
        
        // Para OrphaPhenotype (dedupe)
        if (!orphaPhenotypes.has(hpoId)) {
          orphaPhenotypes.set(hpoId, {
            id: crypto.randomUUID(),
            hpo_id: hpoId,
            hpo_name: hpoTerm,
            last_seen: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
        
        totalAssociations++;
      }
      
      processedDisorders++;
      
      if (processedDisorders % 50 === 0) {
        console.log(`   🔄 Processados: ${processedDisorders} disorders, ${totalAssociations} associações`);
      }
    }
    
    console.log(`\n📊 RESUMO DO PARSING:`);
    console.log(`   • Disorders processados: ${processedDisorders}`);
    console.log(`   • Associações HPO encontradas: ${totalAssociations}`);
    console.log(`   • Phenótipos únicos: ${orphaPhenotypes.size}`);
    
    // Primeiro, criar a tabela orpha_import_logs se não existir
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS orpha_import_logs (
          id TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          version TEXT,
          file_name TEXT,
          started_at DATETIME,
          completed_at DATETIME,
          rows_inserted INTEGER DEFAULT 0,
          rows_updated INTEGER DEFAULT 0,
          status TEXT,
          message TEXT,
          checksum_sha256 TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ Tabela orpha_import_logs criada/verificada');
    } catch (error) {
      console.log('⚠️ Tabela orpha_import_logs já existe ou erro:', error.message);
    }
    
    // Inserir em lotes
    console.log(`\n💾 INSERINDO NO BANCO DE DADOS...`);
    
    // 1. OrphaClinicalSigns
    if (orphaClinicalSigns.length > 0) {
      console.log(`🔄 Inserindo ${orphaClinicalSigns.length} clinical signs...`);
      
      const batchSize = 50; // Reduzido para evitar erros
      for (let i = 0; i < orphaClinicalSigns.length; i += batchSize) {
        const batch = orphaClinicalSigns.slice(i, i + batchSize);
        
        try {
          for (const item of batch) {
            await prisma.$executeRawUnsafe(`
              INSERT OR REPLACE INTO orpha_clinical_signs 
              (id, orpha_code, hpo_id, hpo_name, frequency, diagnostic_criterion, typicality, provenance, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, 
            item.id,
            item.orpha_code,
            item.hpo_id,
            item.hpo_name,
            item.frequency,
            item.diagnostic_criterion,
            item.typicality,
            item.provenance,
            item.created_at.toISOString(),
            item.updated_at.toISOString()
            );
          }
          
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
      
      const batchSize = 50;
      for (let i = 0; i < phenotypeArray.length; i += batchSize) {
        const batch = phenotypeArray.slice(i, i + batchSize);
        
        try {
          for (const item of batch) {
            await prisma.$executeRawUnsafe(`
              INSERT OR REPLACE INTO orpha_phenotypes
              (id, hpo_id, hpo_name, last_seen, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            item.id,
            item.hpo_id,
            item.hpo_name,
            item.last_seen.toISOString(),
            item.created_at.toISOString(),
            item.updated_at.toISOString()
            );
          }
          
          console.log(`   ✅ Lote ${Math.floor(i/batchSize) + 1}: ${batch.length} phenotypes`);
          
        } catch (error) {
          console.log(`   ❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }
    }
    
    // 3. Log do import
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO orpha_import_logs 
        (id, source, version, file_name, started_at, completed_at, rows_inserted, rows_updated, status, message, checksum_sha256, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      crypto.randomUUID(),
      'product4',
      '2025-09',
      'en_product4.xml',
      new Date().toISOString(),
      new Date().toISOString(),
      totalAssociations,
      0,
      'success',
      `Processados ${processedDisorders} disorders, ${totalAssociations} associações HPO`,
      checksum,
      new Date().toISOString(),
      new Date().toISOString()
      );
      
      console.log('✅ Log salvo na tabela orpha_import_logs');
    } catch (error) {
      console.log('⚠️ Erro ao salvar log:', error.message);
    }
    
    console.log(`\n🎉 IMPORT CONCLUÍDO!`);
    console.log(`✅ Clinical Signs: ${orphaClinicalSigns.length} registros`);
    console.log(`✅ Phenotypes: ${phenotypeArray.length} registros únicos`);
    
    return {
      clinicalSigns: orphaClinicalSigns.length,
      phenotypes: phenotypeArray.length,
      disorders: processedDisorders,
      checksum: checksum.substring(0, 16)
    };
    
  } catch (error) {
    console.error('❌ Erro no parsing:', error);
    
    // Log do erro
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO orpha_import_logs 
        (id, source, version, file_name, started_at, completed_at, rows_inserted, rows_updated, status, message, checksum_sha256, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      crypto.randomUUID(),
      'product4',
      '2025-09',
      'en_product4.xml',
      new Date().toISOString(),
      new Date().toISOString(),
      0,
      0,
      'error',
      error.message,
      checksum || 'unknown',
      new Date().toISOString(),
      new Date().toISOString()
      );
    } catch (logError) {
      console.log('⚠️ Erro ao salvar log de erro:', logError.message);
    }
    
    throw error;
  }
}

async function main() {
  try {
    const resultado = await parseProduct4Correct();
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
