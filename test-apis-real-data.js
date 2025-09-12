/**
 * Teste rápido das APIs vs Banco Real
 */

const fetch = require('node-fetch');

async function testAPIsWithRealData() {
  console.log('🧪 TESTANDO APIs COM DADOS REAIS');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'Orphanet Stats',
      url: 'http://localhost:3001/api/orphanet/stats',
      expected: 'deve ter dados de orpha_diseases'
    },
    {
      name: 'HPO Stats', 
      url: 'http://localhost:3001/api/hpo/stats',
      expected: 'deve ter dados de hpo_terms'
    },
    {
      name: 'Orphanet Lista',
      url: 'http://localhost:3001/api/orphanet?limit=5',
      expected: 'deve listar algumas doenças'
    },
    {
      name: 'HPO Lista',
      url: 'http://localhost:3001/api/hpo?limit=5', 
      expected: 'deve listar alguns termos HPO'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n🔍 ${test.name}:`);
      const response = await fetch(test.url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Dados:`, typeof data === 'object' ? JSON.stringify(data, null, 2).substring(0, 200) + '...' : data);
      } else {
        console.log(`❌ Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Teste concluído!');
}

// Aguardar um pouco para servidor estar pronto
setTimeout(() => {
  testAPIsWithRealData().catch(console.error);
}, 2000);
