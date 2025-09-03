/**
 * VERIFICAR STATUS APÓS RESET E REPOVOAR SE NECESSÁRIO
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 VERIFICANDO STATUS APÓS RESET...\n');
    
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
        
        const status = count > 0 ? '✅' : '❌';
        console.log(`${status} ${model}: ${count} registros`);
      } catch (error) {
        console.log(`❌ ${model}: erro - ${error.message}`);
      }
    }
    
    console.log(`\n📊 RESULTADO:`);
    console.log(`📈 Total de registros: ${total}`);
    console.log(`📋 Tabelas com dados: ${populated}/${tables.length}`);
    
    if (total === 0) {
      console.log('💔 BANCO FOI LIMPO PELO RESET!');
      console.log('🔄 Precisamos repovoar tudo novamente...');
      console.log('\n🚨 DADOS PERDIDOS - MAS AS TABELAS FORAM CRIADAS CORRETAMENTE!');
      console.log('✅ Agora podemos popular as 4 tabelas que estavam faltando!');
    } else {
      console.log('✅ Alguns dados foram preservados!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
