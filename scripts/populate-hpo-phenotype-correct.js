const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const readline = require('readline');

const prisma = new PrismaClient();

async function populateHPOPhenotypeAssociation() {
  console.log('🚀 POPULANDO hpo_phenotype_associations');
  console.log('📁 Arquivo: database/hpo-official/phenotype.hpoa\n');
  
  const filePath = 'database/hpo-official/phenotype.hpoa';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo phenotype.hpoa não encontrado!');
    return;
  }
  
  const currentCount = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM hpo_phenotype_associations
  `;
  console.log(`📊 Registros atuais: ${Number(currentCount[0].count)}`);
  
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
          databaseId,     // DatabaseID (ex: OMIM:123456)
          diseaseName,    // DiseaseName
          qualifier,      // Qualifier
          hpoId,          // HPO_ID (ex: HP:0000001)
          reference,      // Reference
          evidence,       // Evidence
          onset,          // Onset
          frequency,      // Frequency
          sex,            // Sex
          modifier,       // Modifier
          aspect,         // Aspect
          biocuration     // Biocuration
        ] = columns;
        
        if (databaseId && diseaseName && hpoId) {
          batch.push({
            id: `${databaseId.trim()}_${hpoId.trim()}_${Date.now()}_${Math.random()}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            orphaDiseaseId: databaseId.trim(),
            hpoTermId: hpoId.trim(),
            frequency: frequency?.trim() || '',
            qualifier: qualifier?.trim() || '',
            evidence: evidence?.trim() || '',
            reference: reference?.trim() || '',
            frequencyTerm: frequency?.trim() || '',
            onsetTerm: onset?.trim() || '',
            clinicalModifiers: modifier?.trim() || ''
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
  
  for (const item of batch) {
    try {
      await prisma.$executeRaw`
        INSERT OR IGNORE INTO hpo_phenotype_associations (
          id,
          orphaDiseaseId,
          hpoTermId,
          frequency,
          qualifier,
          evidence,
          reference,
          frequencyTerm,
          onsetTerm,
          clinicalModifiers,
          createdAt,
          updatedAt
        ) VALUES (
          ${item.id},
          ${item.orphaDiseaseId},
          ${item.hpoTermId},
          ${item.frequency},
          ${item.qualifier},
          ${item.evidence},
          ${item.reference},
          ${item.frequencyTerm},
          ${item.onsetTerm},
          ${item.clinicalModifiers},
          datetime('now'),
          datetime('now')
        )
      `;
      insertedCount++;
    } catch (error) {
      // Silenciar erros de duplicata
      if (!error.message.includes('UNIQUE constraint failed')) {
        console.log(`⚠️  Erro item: ${error.message}`);
      }
    }
  }
  
  return insertedCount;
}

async function main() {
  try {
    await populateHPOPhenotypeAssociation();
    
    // Verificar resultado final
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM hpo_phenotype_associations
    `;
    
    console.log(`\n🎉 RESULTADO FINAL: ${Number(finalCount[0].count).toLocaleString()} registros na tabela`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
