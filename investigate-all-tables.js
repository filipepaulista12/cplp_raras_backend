/**
 * Investigação completa de TODAS as tabelas do banco
 */

const Database = require('better-sqlite3');
const path = require('path');

function investigateAllTables() {
  const dbPath = path.join(__dirname, 'database', 'gard_dev.db');
  const db = new Database(dbPath, { readonly: true });
  
  console.log('🔍 INVESTIGAÇÃO COMPLETA DO BANCO SQLite');
  console.log('=' .repeat(60));
  
  // Obter todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  const allTableStructures = {};
  
  tables.forEach((table, index) => {
    const tableName = table.name;
    
    try {
      // Contar registros
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
      const recordCount = countResult.count;
      
      // Obter estrutura da tabela
      const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
      
      console.log(`\n${index + 1}. ✅ ${tableName.padEnd(35)} ${recordCount.toLocaleString().padStart(8)} registros`);
      
      // Mostrar colunas
      const columnInfo = columns.map(col => {
        return `${col.name}:${col.type}${col.notnull ? '!' : ''}${col.pk ? '*' : ''}`;
      }).join(', ');
      
      console.log(`   📋 Colunas: ${columnInfo}`);
      
      // Guardar estrutura para gerar schema
      allTableStructures[tableName] = {
        recordCount,
        columns: columns.map(col => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull,
          primaryKey: col.pk,
          defaultValue: col.dflt_value
        }))
      };
      
      // Se tem registros, mostrar exemplo
      if (recordCount > 0) {
        try {
          const sample = db.prepare(`SELECT * FROM "${tableName}" LIMIT 1`).get();
          const sampleKeys = Object.keys(sample).slice(0, 3);
          const samplePreview = sampleKeys.map(key => `${key}=${sample[key]}`).join(', ');
          console.log(`   📝 Exemplo: ${samplePreview}...`);
        } catch (sampleError) {
          console.log(`   📝 Exemplo: (erro ao acessar)`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 TOTAL: ${tables.length} tabelas encontradas`);
  
  db.close();
  
  // Salvar estruturas para usar na geração do schema
  require('fs').writeFileSync(
    'database-structure-complete.json', 
    JSON.stringify(allTableStructures, null, 2)
  );
  
  console.log('💾 Estrutura salva em: database-structure-complete.json');
  
  return allTableStructures;
}

investigateAllTables();
