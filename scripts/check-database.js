// Script para verificar tabelas no banco SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/gard_dev.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Verificando tabelas no banco SQLite...\n');

// Listar todas as tabelas
db.all(`
  SELECT name, type, sql 
  FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`, (err, tables) => {
  if (err) {
    console.error('❌ Erro ao consultar tabelas:', err);
    return;
  }
  
  console.log(`📊 Total de tabelas encontradas: ${tables.length}\n`);
  
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
  });
  
  console.log('\n🔍 Tabelas relacionadas a doenças raras:');
  const rareTables = tables.filter(table => 
    table.name.toLowerCase().includes('orpha') ||
    table.name.toLowerCase().includes('disease') ||
    table.name.toLowerCase().includes('rare') ||
    table.name.toLowerCase().includes('hpo') ||
    table.name.toLowerCase().includes('drug') ||
    table.name.toLowerCase().includes('gene')
  );
  
  rareTables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table.name}`);
  });
  
  // Verificar algumas tabelas chave
  if (rareTables.length > 0) {
    console.log('\n📋 Contagem de registros em tabelas principais:');
    checkTableCounts(rareTables.slice(0, 5)); // Primeiras 5 tabelas
  }
  
  db.close();
});

function checkTableCounts(tables) {
  let completed = 0;
  tables.forEach((table, index) => {
    db.get(`SELECT COUNT(*) as count FROM "${table.name}"`, (err, result) => {
      if (err) {
        console.log(`  ❌ ${table.name}: erro ao contar`);
      } else {
        console.log(`  📊 ${table.name}: ${result.count} registros`);
      }
      
      completed++;
      if (completed === tables.length) {
        console.log('\n✅ Verificação concluída!');
      }
    });
  });
}
