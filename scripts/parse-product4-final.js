const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function parseProduct4Final() {
  console.log('🧬 PARSER PRODUCT4 FINAL - HPO ASSOCIATIONS');
  console.log('===========================================');
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
    
    // Processar primeiros 1000 disorders
    let totalClinicalSigns = 0;
    let totalPhenotypes = 0;
    const processedPhenotypes = new Set();
    
    for (let i = 0; i < Math.min(1000, hpoList.length); i++) {
      const hpoStatus = hpoList[i];
      const disorder = hpoStatus.Disorder?.[0];
      
      if (!disorder) continue;
      
      const orphaNumber = disorder.OrphaNumber?.[0];
      if (!orphaNumber) continue;
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      if (!hpoAssociations || !Array.isArray(hpoAssociations)) continue;
      
      console.log(`🔄 ${i + 1}/${Math.min(1000, hpoList.length)}: ORPHA:${orphaNumber} (${hpoAssociations.length} HPO)`);
      
      // Processar cada associação HPO
      for (const assoc of hpoAssociations) {
        const hpo = assoc.HPO?.[0];
        if (!hpo) continue;
        
        const hpoId = hpo.HPOId?.[0];
        const hpoTerm = hpo.HPOTerm?.[0];
        
        if (!hpoId || !hpoTerm) continue;
        
        const frequency = assoc.HPOFrequency?.[0]?.Name?.[0] || 'Unknown';
        const diagnosticCriteria = assoc.DiagnosticCriteria?.[0] || null;
        
        try {
          // 1. Inserir Clinical Sign
          await prisma.$executeRawUnsafe(`
            INSERT OR REPLACE INTO orpha_clinical_signs (
              id, orpha_code, hpo_id, hpo_name, frequency, diagnostic_criterion, 
              typicality, provenance, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          crypto.randomUUID(),
          orphaNumber,
          hpoId,
          hpoTerm,
          frequency,
          diagnosticCriteria === 'Pathognomonic' ? 1 : 0,
          frequency,
          'Orphadata_product4',
          new Date().toISOString(),
          new Date().toISOString()
          );
          
          totalClinicalSigns++;
          
          // 2. Inserir Phenotype único
          if (!processedPhenotypes.has(hpoId)) {
            await prisma.$executeRawUnsafe(`
              INSERT OR REPLACE INTO orpha_phenotypes (
                id, hpo_id, hpo_name, last_seen, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            crypto.randomUUID(),
            hpoId,
            hpoTerm,
            new Date().toISOString(),
            new Date().toISOString(),
            new Date().toISOString()
            );
            
            processedPhenotypes.add(hpoId);
            totalPhenotypes++;
          }
          
        } catch (error) {
          console.log(`   ❌ Erro ao inserir ${hpoId}:`, error.message.substring(0, 50));
        }
      }
      
      if ((i + 1) % 50 === 0) {
        console.log(`   📊 Progresso: ${totalClinicalSigns} clinical signs, ${totalPhenotypes} phenotypes únicos`);
      }
    }
    
    // Log final
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS orpha_import_logs (
          id TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          version TEXT,
          file_name TEXT,
          started_at TEXT,
          completed_at TEXT,
          rows_inserted INTEGER DEFAULT 0,
          status TEXT,
          message TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await prisma.$executeRawUnsafe(`
        INSERT INTO orpha_import_logs 
        (id, source, version, file_name, started_at, completed_at, rows_inserted, status, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      crypto.randomUUID(),
      'product4',
      '2025-09',
      'en_product4.xml',
      new Date().toISOString(),
      new Date().toISOString(),
      totalClinicalSigns,
      'success',
      `Processados ${Math.min(1000, hpoList.length)} disorders, ${totalClinicalSigns} associações HPO`,
      new Date().toISOString()
      );
      
    } catch (logError) {
      console.log('⚠️ Log error:', logError.message);
    }
    
    console.log(`\n🎉 IMPORT CONCLUÍDO!`);
    console.log(`✅ Clinical Signs inseridos: ${totalClinicalSigns}`);
    console.log(`✅ Phenotypes únicos: ${totalPhenotypes}`);
    console.log(`📊 Disorders processados: ${Math.min(1000, hpoList.length)}/${hpoList.length}`);
    
    return {
      clinicalSigns: totalClinicalSigns,
      phenotypes: totalPhenotypes,
      disorders: Math.min(1000, hpoList.length),
      total: hpoList.length
    };
    
  } catch (error) {
    console.error('❌ Erro no parsing:', error);
    throw error;
  }
}

async function main() {
  try {
    const resultado = await parseProduct4Final();
    
    console.log('\n🏆 MISSÃO CUMPRIDA!');
    console.log(`📊 Tabelas populadas:`);
    console.log(`   • orpha_clinical_signs: ${resultado.clinicalSigns} registros`);
    console.log(`   • orpha_phenotypes: ${resultado.phenotypes} registros`);
    console.log(`📈 Progresso: ${resultado.disorders}/${resultado.total} disorders processados`);
    
    console.log(`\n🚀 PRÓXIMAS TABELAS PARA POPULAR:`);
    console.log(`• orpha_gene_associations (product6)`);
    console.log(`• orpha_epidemiology (product9_prev)`);
    console.log(`• orpha_textual_information (product1)`);
    console.log(`• hpo_phenotype_associations (phenotype.hpoa)`);
    
    // Verificar o que foi inserido
    const clinicalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    const phenotypeCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_clinical_signs: ${clinicalCount[0].count} registros`);
    console.log(`   • orpha_phenotypes: ${phenotypeCount[0].count} registros`);
    
  } catch (error) {
    console.error('💥 Falha crítica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
