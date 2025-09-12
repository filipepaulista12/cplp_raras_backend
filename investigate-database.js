/**
 * Verificação das tabelas reais do banco SQLite
 */

const Database = require('better-sqlite3');

try {
  console.log('🔍 INVESTIGANDO BANCO SQLite REAL');
  console.log('=' .repeat(50));
  
  const db = new Database('database/gard_dev.db', { readonly: true });
  
  // Listar todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log(`📊 ENCONTRADAS ${tables.length} TABELAS:`);
  console.log('');
  
  let totalRecords = 0;
  
  tables.forEach((table, index) => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM \`${table.name}\``).get();
      const records = count.count;
      totalRecords += records;
      
      console.log(`${index + 1}. ✅ ${table.name.padEnd(30)} ${records.toLocaleString().padStart(8)} registros`);
      
      // Mostrar algumas colunas para tabelas principais
      if (['orphanet_disorders', 'hpo_terms', 'disorder_phenotype', 'drugbank_drugs', 'cplp_countries'].includes(table.name)) {
        try {
          const columns = db.prepare(`PRAGMA table_info(\`${table.name}\`)`).all();
          const colNames = columns.slice(0, 5).map(col => col.name).join(', ');
          console.log(`   📋 Colunas: ${colNames}${columns.length > 5 ? '...' : ''}`);
        } catch (e) {
          // Ignorar erros de schema
        }
      }
    } catch (error) {
      console.log(`${index + 1}. ❌ ${table.name} - Erro: ${error.message}`);
    }
  });
  
  console.log('');
  console.log('=' .repeat(50));
  console.log(`📈 TOTAL: ${totalRecords.toLocaleString()} registros em ${tables.length} tabelas`);
  console.log('🗄️ Tamanho do arquivo:', Math.round(require('fs').statSync('database/gard_dev.db').size / 1024 / 1024 * 100) / 100 + ' MB');
  
  // Verificar tabelas principais esperadas
  console.log('');
  console.log('🎯 TABELAS PRINCIPAIS:');
  const mainTables = ['orphanet_disorders', 'hpo_terms', 'disorder_phenotype', 'drugbank_drugs', 'cplp_countries'];
  
  mainTables.forEach(tableName => {
    const exists = tables.some(t => t.name === tableName);
    if (exists) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM \`${tableName}\``).get();
      console.log(`✅ ${tableName}: ${count.count.toLocaleString()} registros`);
    } else {
      console.log(`❌ ${tableName}: NÃO ENCONTRADA`);
    }
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao acessar banco:', error.message);
}
