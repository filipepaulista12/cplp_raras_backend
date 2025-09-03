const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const readline = require('readline');

const prisma = new PrismaClient();

async function populateHPOPhenotypeAssociation() {
  console.log('🚀 POPULANDO HPOPhenotypeAssociation');
  console.log('📁 Arquivo: database/hpo-official/phenotype.hpoa\n');
  
  const filePath = 'database/hpo-official/phenotype.hpoa';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo phenotype.hpoa não encontrado!');
    return;
  }
  
  // Verificar se a tabela existe
  try {
    const currentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM hpo_phenotype_associations
    `;
    console.log(`📊 Registros atuais: ${Number(currentCount[0].count)}`);
  } catch (error) {
    console.log('⚠️  Tabela hpo_phenotype_associations não encontrada no schema');
    return;
  }
  
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNumber = 0;
  let processedCount = 0;
  let insertedCount = 0;
  const batchSize = 1000;
  let batch = [];
  
  console.log('📖 Processando arquivo phenotype.hpoa...\n');
  
  for await (const line of rl) {
    lineNumber++;
    
    // Pular header e comentários
    if (line.startsWith('#') || lineNumber === 1) {
      continue;
    }
    
    try {
      const columns = line.split('\t');
      
      if (columns.length >= 4) {
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
        
        if (databaseId && diseaseName && hpoId) {
          batch.push({
            databaseId: databaseId.trim(),
            diseaseName: diseaseName.trim(),
            qualifier: qualifier?.trim() || '',
            hpoId: hpoId.trim(),
            reference: reference?.trim() || '',
            evidence: evidence?.trim() || '',
            onset: onset?.trim() || '',
            frequency: frequency?.trim() || '',
            sex: sex?.trim() || '',
            modifier: modifier?.trim() || '',
            aspect: aspect?.trim() || '',
            biocuration: biocuration?.trim() || ''
          });
          
          processedCount++;
        }
        
        if (batch.length >= batchSize) {
          const inserted = await processBatch(batch);
          insertedCount += inserted;
          batch = [];
          
          if (processedCount % 10000 === 0) {
            console.log(`📊 Processados: ${processedCount.toLocaleString()} | Inseridos: ${insertedCount.toLocaleString()}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`⚠️  Erro linha ${lineNumber}: ${error.message}`);
    }
  }
  
  // Último lote
  if (batch.length > 0) {
    const inserted = await processBatch(batch);
    insertedCount += inserted;
  }
  
  console.log(`\n✅ CONCLUÍDO!`);
  console.log(`📊 Processados: ${processedCount.toLocaleString()}`);
  console.log(`✅ Inseridos: ${insertedCount.toLocaleString()}`);
}

async function processBatch(batch) {
  let insertedCount = 0;
  
  try {
    for (const item of batch) {
      try {
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO hpo_phenotype_associations (
            database_id,
            disease_name,
            qualifier,
            hpo_id,
            reference,
            evidence,
            onset,
            frequency,
            sex,
            modifier,
            aspect,
            biocuration,
            created_at
          ) VALUES (
            ${item.databaseId},
            ${item.diseaseName},
            ${item.qualifier},
            ${item.hpoId},
            ${item.reference},
            ${item.evidence},
            ${item.onset},
            ${item.frequency},
            ${item.sex},
            ${item.modifier},
            ${item.aspect},
            ${item.biocuration},
            datetime('now')
          )
        `;
        insertedCount++;
      } catch (error) {
        // Silenciar erros de duplicata
      }
    }
  } catch (error) {
    console.log(`❌ Erro no lote: ${error.message}`);
  }
  
  return insertedCount;
}

async function main() {
  try {
    await populateHPOPhenotypeAssociation();
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
