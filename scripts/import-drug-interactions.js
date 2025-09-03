const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importDrugInteractions() {
  console.log('🚀 IMPORTANDO INTERAÇÕES MEDICAMENTOSAS DO DRUGBANK');
  console.log('📁 Arquivo: database/drugbank-real/drug_interactions_comprehensive.json');
  
  const filePath = 'database/drugbank-real/drug_interactions_comprehensive.json';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo de interações não encontrado!');
    return;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const interactionsData = JSON.parse(fileContent);
  
  console.log(`📊 Dados carregados: ${Object.keys(interactionsData).length} medicamentos com interações`);
  
  let processedCount = 0;
  let batchCount = 0;
  const batchSize = 100;
  let batch = [];
  
  console.log('🔄 Processando interações...\n');
  
  for (const [drugId, drugData] of Object.entries(interactionsData)) {
    if (drugData.interactions && Array.isArray(drugData.interactions)) {
      for (const interaction of drugData.interactions) {
        try {
          batch.push({
            drugId: drugId,
            drugName: drugData.name || '',
            interactingDrugId: interaction.drugbank_id || '',
            interactingDrugName: interaction.name || '',
            description: interaction.description || '',
            severity: interaction.severity || '',
            mechanism: interaction.mechanism || '',
            management: interaction.management || '',
            evidence: interaction.evidence_level || ''
          });
          
          processedCount++;
          
          if (batch.length >= batchSize) {
            await processBatch(batch, ++batchCount);
            batch = [];
          }
          
          if (processedCount % 1000 === 0) {
            console.log(`📊 Processadas: ${processedCount.toLocaleString()} interações`);
          }
          
        } catch (error) {
          console.log(`⚠️  Erro ao processar interação: ${error.message}`);
        }
      }
    }
  }
  
  // Processar último lote
  if (batch.length > 0) {
    await processBatch(batch, ++batchCount);
  }
  
  console.log(`\n✅ PROCESSAMENTO CONCLUÍDO!`);
  console.log(`📊 Total processado: ${processedCount.toLocaleString()} interações`);
  console.log(`📦 Lotes processados: ${batchCount}`);
}

async function processBatch(batch, batchNumber) {
  try {
    const insertPromises = batch.map(async (interaction) => {
      try {
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO drug_interactions (
            drug_id,
            drug_name,
            interacting_drug_id,
            interacting_drug_name,
            description,
            severity,
            mechanism,
            management,
            evidence_level,
            created_at
          ) VALUES (
            ${interaction.drugId},
            ${interaction.drugName},
            ${interaction.interactingDrugId},
            ${interaction.interactingDrugName},
            ${interaction.description},
            ${interaction.severity},
            ${interaction.mechanism},
            ${interaction.management},
            ${interaction.evidence},
            datetime('now')
          )
        `;
      } catch (error) {
        // Silenciar erros de duplicata
      }
    });
    
    await Promise.all(insertPromises);
    console.log(`✅ Lote ${batchNumber}: ${batch.length} interações processadas`);
    
  } catch (error) {
    console.log(`❌ Erro no lote ${batchNumber}: ${error.message}`);
  }
}

async function main() {
  try {
    console.log('🔄 Verificando estado atual da tabela...');
    
    const currentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drug_interactions
    `;
    
    console.log(`📊 Interações atuais: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log('');
    
    await importDrugInteractions();
    
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drug_interactions
    `;
    
    const newRecords = Number(finalCount[0].count) - Number(currentCount[0].count);
    
    console.log(`\n🎉 RESULTADO FINAL:`);
    console.log(`📈 Interações antes: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log(`📊 Interações depois: ${Number(finalCount[0].count).toLocaleString()}`);
    console.log(`✨ Novas interações: ${newRecords.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
