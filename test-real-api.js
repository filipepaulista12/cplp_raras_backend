// Script CommonJS para testar API com dados reais
const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testEndpoints() {
  console.log('🔍 TESTANDO API COM DADOS REAIS');
  console.log('='.repeat(50));

  try {
    // 1. Health check
    console.log('\n1. 🏥 Status da API:');
    const health = await fetch(`${API_BASE}/health`);
    const healthText = await health.text();
    console.log(healthText);

    // 2. CPLP countries
    console.log('\n2. 🌍 Países CPLP:');
    const countries = await fetch(`${API_BASE}/api/cplp/countries`);
    const countriesData = await countries.json();
    console.log(`✅ Total países: ${countriesData.length}`);
    countriesData.slice(0, 2).forEach(country => {
      console.log(`   ${country.flag_emoji} ${country.name} (${country.code}) - Pop: ${country.population}`);
    });

    // 3. Orphanet diseases
    console.log('\n3. 🧬 Doenças Orphanet:');
    const diseases = await fetch(`${API_BASE}/api/orphanet`);
    const diseasesData = await diseases.json();
    console.log(`✅ Total doenças: ${diseasesData.length}`);
    diseasesData.slice(0, 2).forEach(disease => {
      console.log(`   ${disease.orphacode}: ${disease.name}`);
    });

    // 4. HPO terms
    console.log('\n4. 📋 Termos HPO:');
    const hpo = await fetch(`${API_BASE}/api/hpo`);
    const hpoData = await hpo.json();
    console.log(`✅ Total termos HPO: ${hpoData.length}`);
    hpoData.slice(0, 2).forEach(term => {
      console.log(`   ${term.hpo_id}: ${term.name}`);
    });

    // 5. DrugBank medications
    console.log('\n5. 💊 Medicamentos DrugBank:');
    const drugs = await fetch(`${API_BASE}/api/drugbank`);
    const drugsData = await drugs.json();
    console.log(`✅ Total medicamentos: ${drugsData.length}`);
    drugsData.slice(0, 2).forEach(drug => {
      console.log(`   ${drug.drugbank_id}: ${drug.name}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎉 API COM DADOS REAIS FUNCIONANDO!');
    console.log('📊 Swagger: http://localhost:3001/api');

  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEndpoints();
