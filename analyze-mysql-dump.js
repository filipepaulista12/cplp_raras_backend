/**
 * Configuração do Sistema DUAL DATABASE
 * MySQL (Principal) + SQLite (Espelho)
 */

const fs = require('fs');
const path = require('path');

function analyzeMySQLDump() {
  console.log('🔍 ANALISANDO DUMP MYSQL...');
  console.log('=' .repeat(50));
  
  const dumpPath = path.join(__dirname, 'schemas', 'Dump20250903.sql');
  
  if (!fs.existsSync(dumpPath)) {
    console.log('❌ Arquivo de dump não encontrado:', dumpPath);
    return;
  }
  
  const dumpContent = fs.readFileSync(dumpPath, 'utf8');
  
  // Extrair tabelas do dump
  const tableMatches = dumpContent.match(/LOCK TABLES `([^`]+)`/g);
  const tables = tableMatches ? tableMatches.map(match => {
    return match.replace('LOCK TABLES `', '').replace('`', '');
  }) : [];
  
  console.log(`📊 TABELAS ENCONTRADAS NO DUMP: ${tables.length}`);
  
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ✅ ${table}`);
  });
  
  // Extrair algumas amostras de dados
  console.log('\n🔍 AMOSTRAS DE DADOS:');
  
  // Países CPLP
  const cplpMatch = dumpContent.match(/INSERT INTO `cplp_countries` VALUES (.+);/);
  if (cplpMatch) {
    console.log('\n📍 PAÍSES CPLP:');
    // Extrair alguns países
    const countries = cplpMatch[1].match(/\(([^)]+)\)/g);
    if (countries) {
      countries.slice(0, 3).forEach((country, index) => {
        const values = country.replace('(', '').replace(')', '').split(',');
        const code = values[1] ? values[1].replace(/'/g, '') : 'N/A';
        const name = values[2] ? values[2].replace(/'/g, '') : 'N/A';
        console.log(`   ${index + 1}. ${code}: ${name}`);
      });
    }
  }
  
  // Drug interactions
  const drugsMatch = dumpContent.match(/INSERT INTO `drug_interactions` VALUES/);
  if (drugsMatch) {
    console.log('\n💊 TEM DADOS DE: drug_interactions');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Análise concluída!');
  
  return {
    tables,
    hasData: tables.length > 0
  };
}

analyzeMySQLDump();
