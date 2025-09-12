const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Função para conectar e analisar uma base SQLite
async function analyzeSQLiteDatabase(dbPath, dbName) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔍 ANALISANDO BASE: ${dbName}`);
        console.log(`📁 Caminho: ${dbPath}`);
        
        if (!fs.existsSync(dbPath)) {
            console.log(`❌ Arquivo não encontrado: ${dbPath}`);
            resolve({ name: dbName, error: 'Arquivo não encontrado', tables: [] });
            return;
        }

        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log(`❌ Erro ao conectar: ${err.message}`);
                resolve({ name: dbName, error: err.message, tables: [] });
                return;
            }
            console.log(`✅ Conectado com sucesso!`);
        });

        // Primeiro, obter lista de todas as tabelas
        db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, tables) => {
            if (err) {
                console.log(`❌ Erro ao listar tabelas: ${err.message}`);
                db.close();
                resolve({ name: dbName, error: err.message, tables: [] });
                return;
            }

            console.log(`📊 Encontradas ${tables.length} tabelas`);

            if (tables.length === 0) {
                console.log(`⚠️  Nenhuma tabela encontrada`);
                db.close();
                resolve({ name: dbName, tables: [] });
                return;
            }

            // Para cada tabela, contar registros
            const tablePromises = tables.map(table => {
                return new Promise((resolveTable) => {
                    db.get(`SELECT COUNT(*) as count FROM "${table.name}"`, [], (err, row) => {
                        if (err) {
                            console.log(`❌ Erro ao contar ${table.name}: ${err.message}`);
                            resolveTable({ name: table.name, count: 'ERRO', error: err.message });
                        } else {
                            console.log(`📋 ${table.name}: ${row.count.toLocaleString()} registros`);
                            resolveTable({ name: table.name, count: row.count });
                        }
                    });
                });
            });

            Promise.all(tablePromises).then(tableResults => {
                db.close((err) => {
                    if (err) {
                        console.log(`⚠️  Erro ao fechar conexão: ${err.message}`);
                    }
                });
                
                resolve({ 
                    name: dbName, 
                    tables: tableResults,
                    totalTables: tableResults.length,
                    totalRecords: tableResults.reduce((sum, table) => 
                        typeof table.count === 'number' ? sum + table.count : sum, 0
                    )
                });
            });
        });
    });
}

// Função principal
async function analyzeAllDatabases() {
    console.log('🚀 INICIANDO ANÁLISE DE TODAS AS BASES DE DADOS');
    console.log('=' .repeat(60));

    const databases = [
        {
            name: 'GARD_DEV (Principal)',
            path: path.join(__dirname, 'database', 'gard_dev.db')
        },
        {
            name: 'CPLP_RARAS_REAL (Database)',
            path: path.join(__dirname, 'database', 'cplp_raras_real.db')
        },
        {
            name: 'CPLP_RARAS_LOCAL (Prisma)',
            path: path.join(__dirname, 'prisma', 'database', 'cplp_raras_local.db')
        },
        {
            name: 'CPLP_RARAS_REAL (Prisma)',
            path: path.join(__dirname, 'prisma', 'database', 'cplp_raras_real.db')
        }
    ];

    const results = [];
    
    for (const db of databases) {
        const result = await analyzeSQLiteDatabase(db.path, db.name);
        results.push(result);
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL - RESUMO DE TODAS AS BASES');
    console.log('=' .repeat(80));
    
    results.forEach(result => {
        console.log(`\n🗄️  BASE: ${result.name}`);
        if (result.error) {
            console.log(`   ❌ Status: ERRO - ${result.error}`);
        } else {
            console.log(`   ✅ Status: OK`);
            console.log(`   📊 Total de tabelas: ${result.totalTables || 0}`);
            console.log(`   📈 Total de registros: ${(result.totalRecords || 0).toLocaleString()}`);
            
            if (result.tables && result.tables.length > 0) {
                console.log(`   📋 Tabelas:`);
                result.tables
                    .sort((a, b) => (typeof b.count === 'number' ? b.count : 0) - (typeof a.count === 'number' ? a.count : 0))
                    .forEach(table => {
                        const count = typeof table.count === 'number' ? table.count.toLocaleString() : table.count;
                        console.log(`      • ${table.name}: ${count} registros`);
                    });
            }
        }
    });

    // Estatísticas gerais
    const validBases = results.filter(r => !r.error && r.tables);
    const totalBases = validBases.length;
    const totalTabelas = validBases.reduce((sum, r) => sum + (r.totalTables || 0), 0);
    const totalRegistros = validBases.reduce((sum, r) => sum + (r.totalRecords || 0), 0);

    console.log('\n🎯 ESTATÍSTICAS GERAIS');
    console.log('=' .repeat(40));
    console.log(`📦 Bases funcionais: ${totalBases}`);
    console.log(`📊 Total de tabelas: ${totalTabelas}`);
    console.log(`📈 Total de registros: ${totalRegistros.toLocaleString()}`);
    
    return results;
}

// Executar análise
analyzeAllDatabases()
    .then(results => {
        console.log('\n✅ Análise concluída com sucesso!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Erro durante análise:', error);
        process.exit(1);
    });
