/**
 * VERIFICAR RESTAURAÇÃO URGENTE - SEM RESET JAMAIS
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 VERIFICANDO RESTAURAÇÃO DOS DADOS...\n');
    
    const tables = [
      'orphaDisease', 'orphaClinicalSign', 'orphaPhenotype', 'orphaGeneAssociation',
      'hPOPhenotypeAssociation', 'orphaTextualInformation', 'drugDiseaseAssociation',
      'orphaEpidemiology', 'orphaNaturalHistory'
    ];
    
    let total = 0;
    let populated = 0;
    
    for (const model of tables) {
      try {
        const count = await prisma[model].count();
        total += count;
        if (count > 0) populated++;
        
        const emoji = count > 5000 ? '🔥' : count > 1000 ? '⭐' : count > 0 ? '✅' : '❌';
        console.log(`${emoji} ${model}: ${count.toLocaleString()} registros`);
      } catch (error) {
        console.log(`❌ ${model}: erro - ${error.message}`);
      }
    }
    
    console.log(`\n📊 RESULTADO DA RESTAURAÇÃO:`);
    console.log(`📈 Total: ${total.toLocaleString()} registros`);
    console.log(`📋 Tabelas: ${populated}/${tables.length} populadas`);
    console.log(`🎯 Status: ${total > 30000 ? 'DADOS RESTAURADOS! ✅' : 'AINDA PRECISAMOS RESTAURAR MAIS ⚠️'}`);
    
    if (total === 0) {
      console.log('\n💔 RESTAURAÇÃO FALHOU!');
      console.log('🚨 Vamos tentar outros backups...');
    } else if (total > 30000) {
      console.log('\n🎉 DADOS RESTAURADOS COM SUCESSO!');
      console.log('✅ Sistema operacional novamente!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
