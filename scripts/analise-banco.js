/**
 * Script direto para visualizar dados SQLite
 */
const Database = require('better-sqlite3');
const path = require('path');

function analisarBanco() {
  console.log('🔍 ANÁLISE DIRETA DO BANCO SQLITE');
  console.log('=' .repeat(50));

  const dbPath = path.join(__dirname, '../database/gard_dev.db');
  console.log(`📂 Caminho do banco: ${dbPath}`);

  try {
    const db = Database(dbPath, { readonly: true });
    console.log('✅ Banco aberto com sucesso!');

    // 1. Listar todas as tabelas
    console.log('\n📊 TABELAS NO BANCO:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    console.log(`📋 Total: ${tables.length} tabelas`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });

    // 2. Contar registros em cada tabela
    console.log('\n🔢 REGISTROS POR TABELA:');
    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as total FROM "${table.name}"`).get();
        console.log(`   📁 ${table.name}: ${count.total} registros`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: Erro - ${error.message}`);
      }
    }

    // 3. Mostrar estrutura das principais tabelas
    const importantes = [
      'diseases', 'orphanet_disorders', 'hpo_terms', 'drugbank_drug', 
      'cplp_data', 'orph_disorder', 'hpo_term', 'drugs'
    ];

    console.log('\n🏗️ ESTRUTURA DAS TABELAS (se existirem):');
    for (const tabela of importantes) {
      try {
        const existe = tables.find(t => t.name.toLowerCase().includes(tabela.toLowerCase()));
        if (existe) {
          console.log(`\n📋 Estrutura da tabela: ${existe.name}`);
          const estrutura = db.prepare(`PRAGMA table_info("${existe.name}")`).all();
          estrutura.forEach(col => {
            console.log(`   - ${col.name} (${col.type}) ${col.pk ? '[PK]' : ''}`);
          });
        }
      } catch (error) {
        // Ignora erros silenciosamente
      }
    }

    // 4. Mostrar amostras das tabelas principais
    console.log('\n📄 AMOSTRAS DE DADOS:');
    const tabelasComDados = tables.filter(t => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as total FROM "${t.name}"`).get();
        return count.total > 0;
      } catch {
        return false;
      }
    }).slice(0, 5); // Top 5 tabelas com dados

    for (const tabela of tabelasComDados) {
      try {
        console.log(`\n🔍 Amostra de ${tabela.name}:`);
        const amostra = db.prepare(`SELECT * FROM "${tabela.name}" LIMIT 2`).all();
        amostra.forEach((registro, index) => {
          console.log(`   ${index + 1}. ${JSON.stringify(registro, null, 2).substring(0, 200)}...`);
        });
      } catch (error) {
        console.log(`   ❌ Erro ao buscar dados: ${error.message}`);
      }
    }

    // 5. Informações do arquivo
    const stats = require('fs').statSync(dbPath);
    console.log('\n📈 INFORMAÇÕES DO ARQUIVO:');
    console.log(`   📏 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📅 Modificado: ${stats.mtime}`);
    console.log(`   🔢 Total de tabelas: ${tables.length}`);

    db.close();
    console.log('\n🎉 ANÁLISE CONCLUÍDA COM SUCESSO!');

  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
}

analisarBanco();
