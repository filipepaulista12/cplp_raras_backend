// =====================================================================================
// POPULAR BANCO MySQL COM DUMPS - CPLP-RARAS
// =====================================================================================
// Popula MySQL local com os dados dos dumps sem zerar tabelas
// =====================================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração MySQL
const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'cplp_raras',
  multipleStatements: true
};

console.log('🔄 POPULANDO MYSQL COM DUMPS');
console.log('='.repeat(50));

async function populateFromDumps() {
  let connection;
  
  try {
    // 1. Conectar ao MySQL
    console.log('🔌 Conectando ao MySQL...');
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ Conectado ao MySQL');

    // 2. Listar arquivos de dump
    const dumpsDir = path.join(__dirname, '..', 'database', 'data20250903');
    const dumpFiles = fs.readdirSync(dumpsDir).filter(file => file.endsWith('.sql'));
    
    console.log(`📁 Encontrados ${dumpFiles.length} arquivos de dump:`);
    dumpFiles.forEach(file => console.log(`   • ${file}`));

    // 3. Processar cada arquivo de dump
    let totalInserted = 0;
    
    for (const dumpFile of dumpFiles) {
      const filePath = path.join(dumpsDir, dumpFile);
      const tableName = dumpFile.replace('cplp_raras_', '').replace('.sql', '');
      
      console.log(`\n📊 Processando: ${tableName}`);
      
      try {
        // Ler conteúdo do arquivo
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Contar quantos INSERTs temos
        const insertMatches = sqlContent.match(/INSERT INTO/gi);
        const insertCount = insertMatches ? insertMatches.length : 0;
        
        console.log(`   📝 Encontrados ${insertCount} comandos INSERT`);
        
        if (insertCount === 0) {
          console.log(`   ⚠️ Nenhum INSERT encontrado em ${dumpFile}`);
          continue;
        }

        // Modificar INSERTs para IGNORE (não zerar dados existentes)
        const sqlSafe = sqlContent
          .replace(/INSERT INTO/gi, 'INSERT IGNORE INTO')
          .replace(/DROP TABLE IF EXISTS/gi, '-- DROP TABLE IF EXISTS (REMOVIDO)')
          .replace(/TRUNCATE TABLE/gi, '-- TRUNCATE TABLE (REMOVIDO)');
        
        // Executar SQL
        console.log(`   🔄 Executando ${insertCount} INSERTs...`);
        await connection.execute(sqlSafe);
        
        // Contar registros inseridos
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const currentCount = rows[0].count;
        
        console.log(`   ✅ Tabela ${tableName}: ${currentCount} registros totais`);
        totalInserted += insertCount;
        
      } catch (error) {
        console.error(`   ❌ Erro em ${tableName}: ${error.message}`);
        // Continuar com próximo arquivo
      }
    }

    // 4. Verificar resultado final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(50));

    const tables = [
      'cplp_countries',
      'orpha_diseases', 
      'orpha_epidemiology',
      'hpo_terms',
      'drugbank_drugs',
      'drug_interactions'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`📋 ${table}: ${count} registros`);
      } catch (error) {
        console.log(`📋 ${table}: Tabela não encontrada`);
      }
    }

    console.log('\n🎉 POPULACAO CONCLUIDA!');
    console.log(`📊 Total de INSERTs processados: ${totalInserted}`);
    console.log('');
    console.log('🔄 PRÓXIMOS PASSOS:');
    console.log('   1. npm run dev  # Iniciar API');
    console.log('   2. Testar endpoints com dados reais');
    console.log('   3. npx prisma studio  # Ver dados');

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 SOLUÇÕES:');
      console.log('   1. Verificar se MySQL está rodando');
      console.log('   2. Executar: PowerShell scripts/setup-mysql-simple.ps1');
      console.log('   3. Instalar MySQL se necessário');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão MySQL fechada');
    }
  }
}

// Executar
populateFromDumps();
