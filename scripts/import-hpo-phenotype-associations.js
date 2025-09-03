const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const readline = require('readline');

const prisma = new PrismaClient();

async function importHPOPhenotypeAssociations() {
  console.log('🚀 INICIANDO IMPORTAÇÃO HPO PHENOTYPE ASSOCIATIONS');
  console.log('📁 Arquivo: database/hpo-official/phenotype.hpoa');
  console.log('⏱️  Estimativa: ~100.000 registros\n');
  
  const filePath = 'database/hpo-official/phenotype.hpoa';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo phenotype.hpoa não encontrado!');
    return;
  }
  
  // Verificar se a tabela existe no schema
  try {
    const tableExists = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='hpo_phenotype_associations'
    `;
    
    if (tableExists.length === 0) {
      console.log('⚠️  Tabela hpo_phenotype_associations não existe no schema.');
      console.log('📝 Verificando tabelas HPO disponíveis...\n');
      
      const hpoTables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE '%hpo%'
      `;
      
      console.log('Tabelas HPO encontradas:');
      hpoTables.forEach(table => console.log(`   - ${table.name}`));
      
      console.log('\n💡 Vamos usar a tabela hpo_disease_associations em vez de hpo_phenotype_associations');
      console.log('🔄 Continuando com importação...\n');
    }
  } catch (error) {
    console.log('⚠️  Erro ao verificar schema, continuando...');
  }
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let processedCount = 0;
  let batchCount = 0;
  const batchSize = 1000;
  let batch = [];
  
  console.log('📖 Lendo arquivo...');
  
  for await (const line of rl) {
    lineNumber++;
    
    // Pular linhas de comentário e header
    if (line.startsWith('#') || lineNumber === 1) {
      continue;
    }
    
    try {
      // Formato do arquivo phenotype.hpoa:
      // DatabaseID    DiseaseName    Qualifier    HPO_ID    Reference    Evidence    Onset    Frequency    Sex    Modifier    Aspect    Biocuration
      const columns = line.split('\t');
      
      if (columns.length < 4) {
        continue; // Pular linhas malformadas
      }
      
      const [
        databaseId,
        diseaseName,
        qualifier,
        hpoId,
        reference,
        evidence,
        onset,
        frequency,
        sex,
        modifier,
        aspect,
        biocuration
      ] = columns;
      
      // Extrair o ID HPO (formato HP:0000001)
      const hpoCode = hpoId ? hpoId.replace('HP:', '') : null;
      
      if (databaseId && diseaseName && hpoId && hpoCode) {
        batch.push({
          databaseId: databaseId.trim(),
          diseaseName: diseaseName.trim(),
          qualifier: qualifier ? qualifier.trim() : null,
          hpoId: hpoId.trim(),
          hpoCode: hpoCode.trim(),
          reference: reference ? reference.trim() : null,
          evidence: evidence ? evidence.trim() : null,
          onset: onset ? onset.trim() : null,
          frequency: frequency ? frequency.trim() : null,
          sex: sex ? sex.trim() : null,
          modifier: modifier ? modifier.trim() : null,
          aspect: aspect ? aspect.trim() : null,
          biocuration: biocuration ? biocuration.trim() : null
        });
        
        processedCount++;
      }
      
      // Processar em lotes
      if (batch.length >= batchSize) {
        await processBatch(batch, ++batchCount);
        batch = [];
      }
      
      // Log de progresso
      if (processedCount % 10000 === 0) {
        console.log(`📊 Processados: ${processedCount.toLocaleString()} registros`);
      }
      
    } catch (error) {
      console.log(`⚠️  Erro na linha ${lineNumber}: ${error.message}`);
    }
  }
  
  // Processar último lote
  if (batch.length > 0) {
    await processBatch(batch, ++batchCount);
  }
  
  console.log(`\n✅ IMPORTAÇÃO CONCLUÍDA!`);
  console.log(`📊 Total processado: ${processedCount.toLocaleString()} associações`);
  console.log(`📦 Lotes processados: ${batchCount}`);
}

async function processBatch(batch, batchNumber) {
  try {
    // Como a tabela hpo_phenotype_associations pode não existir,
    // vamos tentar inserir na hpo_disease_associations como fallback
    
    const insertPromises = batch.map(async (item) => {
      try {
        // Tentar inserir na tabela de disease associations
        // Adaptando os campos para o schema existente
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO hpo_disease_associations (
            disease_id,
            disease_name,
            hpo_id,
            hpo_term,
            frequency,
            evidence,
            onset,
            reference,
            qualifier,
            aspect,
            sex,
            modifier,
            biocuration,
            created_at
          ) VALUES (
            ${item.databaseId},
            ${item.diseaseName},
            ${item.hpoId},
            '',
            ${item.frequency || ''},
            ${item.evidence || ''},
            ${item.onset || ''},
            ${item.reference || ''},
            ${item.qualifier || ''},
            ${item.aspect || ''},
            ${item.sex || ''},
            ${item.modifier || ''},
            ${item.biocuration || ''},
            datetime('now')
          )
        `;
      } catch (error) {
        // Silenciar erros individuais para não parar o processo
        // console.log(`Erro item: ${error.message}`);
      }
    });
    
    await Promise.all(insertPromises);
    console.log(`✅ Lote ${batchNumber}: ${batch.length} registros processados`);
    
  } catch (error) {
    console.log(`❌ Erro no lote ${batchNumber}: ${error.message}`);
  }
}

async function main() {
  try {
    console.log('🔄 Verificando estado atual da tabela...');
    
    const currentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM hpo_disease_associations
    `;
    
    console.log(`📊 Registros atuais na tabela: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log('');
    
    await importHPOPhenotypeAssociations();
    
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM hpo_disease_associations
    `;
    
    const newRecords = Number(finalCount[0].count) - Number(currentCount[0].count);
    
    console.log(`\n🎉 RESULTADO FINAL:`);
    console.log(`📈 Registros antes: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log(`📊 Registros depois: ${Number(finalCount[0].count).toLocaleString()}`);
    console.log(`✨ Novos registros: ${newRecords.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
