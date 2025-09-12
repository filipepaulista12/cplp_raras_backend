const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function analyzeSQLDump() {
    console.log('🔍 ANALISANDO DUMP SQL: Dump20250903.sql');
    console.log('=' .repeat(60));
    
    const dumpPath = path.join(__dirname, 'database', 'Dump20250903.sql');
    
    if (!fs.existsSync(dumpPath)) {
        console.log('❌ Arquivo de dump não encontrado');
        return;
    }
    
    const stats = fs.statSync(dumpPath);
    console.log(`📁 Tamanho do arquivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    const fileStream = fs.createReadStream(dumpPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const tables = new Map();
    let currentTable = null;
    let lineCount = 0;
    let insertCount = 0;
    
    console.log('\n📋 Analisando estrutura...\n');
    
    for await (const line of rl) {
        lineCount++;
        
        // Detectar criação de tabelas
        if (line.startsWith('CREATE TABLE')) {
            const tableMatch = line.match(/CREATE TABLE [`]?(\w+)[`]?\s/);
            if (tableMatch) {
                currentTable = tableMatch[1];
                tables.set(currentTable, { inserts: 0, lastInsert: null });
                console.log(`📊 Tabela encontrada: ${currentTable}`);
            }
        }
        
        // Contar INSERTs
        else if (line.startsWith('INSERT INTO')) {
            insertCount++;
            const insertMatch = line.match(/INSERT INTO [`]?(\w+)[`]?\s/);
            if (insertMatch) {
                const tableName = insertMatch[1];
                if (tables.has(tableName)) {
                    tables.get(tableName).inserts++;
                    tables.get(tableName).lastInsert = line.substring(0, 100) + '...';
                }
            }
        }
        
        // Mostrar progresso a cada 10000 linhas
        if (lineCount % 10000 === 0) {
            console.log(`   📈 Processadas ${lineCount.toLocaleString()} linhas...`);
        }
    }
    
    console.log(`\n✅ Análise concluída!`);
    console.log(`📊 Total de linhas processadas: ${lineCount.toLocaleString()}`);
    console.log(`📊 Total de comandos INSERT: ${insertCount.toLocaleString()}`);
    
    // Relatório das tabelas
    console.log('\n📋 TABELAS ENCONTRADAS NO DUMP SQL:');
    console.log('=' .repeat(80));
    
    const sortedTables = Array.from(tables.entries())
        .sort((a, b) => b[1].inserts - a[1].inserts);
    
    let totalInserts = 0;
    
    sortedTables.forEach(([tableName, data]) => {
        totalInserts += data.inserts;
        console.log(`\n🗄️  TABELA: ${tableName}`);
        console.log(`   📊 Comandos INSERT: ${data.inserts.toLocaleString()}`);
        if (data.lastInsert) {
            console.log(`   💾 Último INSERT: ${data.lastInsert}`);
        }
        if (data.inserts === 0) {
            console.log(`   ⚠️  Tabela vazia (sem dados)`);
        }
    });
    
    console.log('\n🎯 ESTATÍSTICAS FINAIS DO DUMP:');
    console.log('=' .repeat(50));
    console.log(`📦 Total de tabelas: ${tables.size}`);
    console.log(`📊 Total de INSERTs: ${totalInserts.toLocaleString()}`);
    console.log(`📁 Tamanho do arquivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Identificar as maiores tabelas
    console.log('\n🏆 TOP 5 TABELAS COM MAIS DADOS:');
    console.log('-' .repeat(40));
    sortedTables.slice(0, 5).forEach(([tableName, data], index) => {
        console.log(`${index + 1}. ${tableName}: ${data.inserts.toLocaleString()} registros`);
    });
    
    return {
        totalTables: tables.size,
        totalInserts: totalInserts,
        fileSize: stats.size,
        tables: sortedTables
    };
}

analyzeSQLDump()
    .then(result => {
        console.log('\n✅ Análise do dump SQL concluída!');
    })
    .catch(error => {
        console.error('❌ Erro durante análise:', error);
    });
