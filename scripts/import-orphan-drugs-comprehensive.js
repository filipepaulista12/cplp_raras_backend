const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importOrphanDrugs() {
  console.log('🚀 IMPORTANDO MEDICAMENTOS ÓRFÃOS ABRANGENTES');
  console.log('📁 Arquivo: database/drugbank-real/comprehensive_orphan_drugs.json');
  
  const filePath = 'database/drugbank-real/comprehensive_orphan_drugs.json';
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ Arquivo de medicamentos órfãos não encontrado!');
    return;
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const orphanDrugs = JSON.parse(fileContent);
  
  console.log(`📊 Medicamentos órfãos carregados: ${orphanDrugs.length}`);
  
  let processedCount = 0;
  let updatedCount = 0;
  let newCount = 0;
  const batchSize = 50;
  
  console.log('🔄 Processando medicamentos órfãos...\n');
  
  for (let i = 0; i < orphanDrugs.length; i += batchSize) {
    const batch = orphanDrugs.slice(i, i + batchSize);
    await processBatch(batch, Math.floor(i / batchSize) + 1);
    
    for (const drug of batch) {
      processedCount++;
      
      if (processedCount % 50 === 0) {
        console.log(`📊 Processados: ${processedCount}/${orphanDrugs.length} medicamentos`);
      }
    }
  }
  
  console.log(`\n✅ PROCESSAMENTO CONCLUÍDO!`);
  console.log(`📊 Total processado: ${processedCount} medicamentos órfãos`);
}

async function processBatch(batch, batchNumber) {
  const promises = batch.map(async (drug) => {
    try {
      // Verificar se o medicamento já existe
      const existing = await prisma.$queryRaw`
        SELECT id FROM drugbank_drugs WHERE drugbank_id = ${drug.drugbank_id}
      `;
      
      if (existing.length > 0) {
        // Atualizar com dados órfãos
        await prisma.$executeRaw`
          UPDATE drugbank_drugs SET
            indication = ${drug.indication || ''},
            orphan_status = ${drug.orphan_status || false},
            fda_approval_date = ${drug.fda_approval || ''},
            ema_approval_date = ${drug.ema_approval || ''},
            route_of_administration = ${drug.route_of_administration || ''},
            atc_code = ${drug.atc_code || ''},
            mechanism_of_action = ${drug.mechanism || ''},
            manufacturer = ${drug.manufacturer || ''},
            orphanet_disorders = ${JSON.stringify(drug.orphanet_disorders || [])},
            annual_cost_usd = ${drug.annual_cost || null},
            patients_treated_annually = ${drug.patients_treated || null},
            updated_at = datetime('now')
          WHERE drugbank_id = ${drug.drugbank_id}
        `;
        return 'updated';
      } else {
        // Inserir novo medicamento órfão
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO drugbank_drugs (
            drugbank_id,
            name,
            generic_name,
            description,
            indication,
            orphan_status,
            fda_approval_date,
            ema_approval_date,
            route_of_administration,
            atc_code,
            mechanism_of_action,
            manufacturer,
            orphanet_disorders,
            annual_cost_usd,
            patients_treated_annually,
            created_at
          ) VALUES (
            ${drug.drugbank_id},
            ${drug.name || ''},
            ${drug.generic_name || ''},
            ${drug.description || ''},
            ${drug.indication || ''},
            ${drug.orphan_status || false},
            ${drug.fda_approval || ''},
            ${drug.ema_approval || ''},
            ${drug.route_of_administration || ''},
            ${drug.atc_code || ''},
            ${drug.mechanism || ''},
            ${drug.manufacturer || ''},
            ${JSON.stringify(drug.orphanet_disorders || [])},
            ${drug.annual_cost || null},
            ${drug.patients_treated || null},
            datetime('now')
          )
        `;
        return 'new';
      }
    } catch (error) {
      console.log(`⚠️  Erro ao processar ${drug.drugbank_id}: ${error.message}`);
      return 'error';
    }
  });
  
  const results = await Promise.all(promises);
  const updated = results.filter(r => r === 'updated').length;
  const newRecords = results.filter(r => r === 'new').length;
  const errors = results.filter(r => r === 'error').length;
  
  console.log(`✅ Lote ${batchNumber}: ${updated} atualizados, ${newRecords} novos, ${errors} erros`);
}

async function main() {
  try {
    console.log('🔄 Verificando estado atual da tabela...');
    
    const currentCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drugbank_drugs
    `;
    
    const orphanCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drugbank_drugs WHERE orphan_status = true
    `;
    
    console.log(`📊 Medicamentos atuais: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log(`🧬 Medicamentos órfãos atuais: ${Number(orphanCount[0].count).toLocaleString()}`);
    console.log('');
    
    await importOrphanDrugs();
    
    const finalCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drugbank_drugs
    `;
    
    const finalOrphanCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM drugbank_drugs WHERE orphan_status = true
    `;
    
    const newRecords = Number(finalCount[0].count) - Number(currentCount[0].count);
    const newOrphans = Number(finalOrphanCount[0].count) - Number(orphanCount[0].count);
    
    console.log(`\n🎉 RESULTADO FINAL:`);
    console.log(`📈 Medicamentos antes: ${Number(currentCount[0].count).toLocaleString()}`);
    console.log(`📊 Medicamentos depois: ${Number(finalCount[0].count).toLocaleString()}`);
    console.log(`✨ Novos medicamentos: ${newRecords.toLocaleString()}`);
    console.log(`🧬 Medicamentos órfãos antes: ${Number(orphanCount[0].count).toLocaleString()}`);
    console.log(`🧬 Medicamentos órfãos depois: ${Number(finalOrphanCount[0].count).toLocaleString()}`);
    console.log(`✨ Novos órfãos: ${newOrphans.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
