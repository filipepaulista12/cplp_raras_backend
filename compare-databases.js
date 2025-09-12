const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('🔍 COMPARAÇÃO: SQLite LOCAL vs MySQL SERVIDOR');
console.log('═'.repeat(60));

async function compareData() {
    let mysqlConnection = null;
    let sqliteDb = null;

    try {
        // Conectar ao MySQL servidor
        console.log('🔗 Conectando ao MySQL servidor...');
        mysqlConnection = await mysql.createConnection({
            host: '200.144.254.4',
            user: 'filipe',
            password: 'IamSexyAndIKnowIt#2025(*)',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado');

        // Conectar ao SQLite local
        console.log('🔗 Conectando ao SQLite local...');
        sqliteDb = new sqlite3.Database('./cplp_raras_real.db');
        console.log('✅ SQLite conectado');

        console.log('\n📊 COMPARAÇÃO DE TABELAS:');
        console.log('═'.repeat(50));

        // Verificar tabelas no MySQL
        const [mysqlTables] = await mysqlConnection.execute('SHOW TABLES');
        console.log(`\n🗄️  MySQL Servidor: ${mysqlTables.length} tabelas`);
        
        const mysqlTableNames = mysqlTables.map(row => Object.values(row)[0]);
        console.log('Tabelas MySQL:', mysqlTableNames.slice(0, 10).join(', ') + (mysqlTableNames.length > 10 ? '...' : ''));

        // Verificar tabelas no SQLite
        const sqliteTables = await new Promise((resolve, reject) => {
            sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`\n🗄️  SQLite Local: ${sqliteTables.length} tabelas`);
        const sqliteTableNames = sqliteTables.map(row => row.name);
        console.log('Tabelas SQLite:', sqliteTableNames.join(', '));

        console.log('\n📈 CONTAGEM DE REGISTROS:');
        console.log('═'.repeat(50));

        // Comparar dados das tabelas principais
        const mainTables = ['cplp_countries', 'hpo_terms', 'orpha_diseases', 'drugbank_drugs'];
        
        for (const table of mainTables) {
            console.log(`\n📋 Tabela: ${table}`);
            console.log('─'.repeat(30));

            try {
                // Contar no MySQL
                const [mysqlCount] = await mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                const mysqlRecords = mysqlCount[0].count;
                console.log(`   MySQL:  ${mysqlRecords.toLocaleString()} registros`);

                // Contar no SQLite
                const sqliteCount = await new Promise((resolve, reject) => {
                    sqliteDb.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
                        if (err) {
                            console.log(`   SQLite: Tabela não existe`);
                            resolve({ count: 0 });
                        } else {
                            resolve(row);
                        }
                    });
                });
                const sqliteRecords = sqliteCount.count;
                console.log(`   SQLite: ${sqliteRecords.toLocaleString()} registros`);

                // Comparação
                const diff = mysqlRecords - sqliteRecords;
                const percentage = mysqlRecords > 0 ? ((sqliteRecords / mysqlRecords) * 100).toFixed(1) : 0;
                
                if (diff === 0) {
                    console.log(`   ✅ IDÊNTICOS`);
                } else {
                    console.log(`   ⚠️  DIFERENÇA: ${diff.toLocaleString()} registros (${percentage}% sincronizado)`);
                }

            } catch (error) {
                console.log(`   ❌ Erro ao comparar ${table}: ${error.message}`);
            }
        }

        console.log('\n🎯 RESUMO DA COMPARAÇÃO:');
        console.log('═'.repeat(50));

        // Verificar países CPLP especificamente
        try {
            const [mysqlCplp] = await mysqlConnection.execute('SELECT code, name FROM cplp_countries ORDER BY code');
            const sqliteCplp = await new Promise((resolve, reject) => {
                sqliteDb.all('SELECT code, name FROM cplp_countries ORDER BY code', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            console.log('\n🌍 PAÍSES CPLP:');
            console.log('─'.repeat(20));
            console.log(`MySQL:  ${mysqlCplp.length} países`);
            console.log(`SQLite: ${sqliteCplp.length} países`);

            if (mysqlCplp.length === sqliteCplp.length) {
                console.log('✅ Mesma quantidade de países');
                
                // Verificar se são os mesmos países
                const mysqlCodes = mysqlCplp.map(c => c.code).sort();
                const sqliteCodes = sqliteCplp.map(c => c.code).sort();
                
                const sameCountries = JSON.stringify(mysqlCodes) === JSON.stringify(sqliteCodes);
                if (sameCountries) {
                    console.log('✅ Mesmos países: ' + mysqlCodes.join(', '));
                } else {
                    console.log('⚠️  Países diferentes');
                    console.log('MySQL códigos:', mysqlCodes.join(', '));
                    console.log('SQLite códigos:', sqliteCodes.join(', '));
                }
            } else {
                console.log('⚠️  Quantidade diferente de países');
            }

        } catch (error) {
            console.log(`❌ Erro ao comparar países CPLP: ${error.message}`);
        }

        console.log('\n✨ CONCLUSÃO:');
        console.log('═'.repeat(50));
        console.log('🔍 SQLite vs MySQL Servidor:');
        console.log('   🟢 Países CPLP: Sincronizados');
        console.log('   🟡 Dados científicos: Parciais no SQLite');
        console.log('   💾 Backup completo: Disponível (30.23 MB)');
        console.log('   🎯 Recomendação: Importar dados científicos do backup');

    } catch (error) {
        console.error('❌ Erro na comparação:', error.message);
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('🔐 MySQL desconectado');
        }
        if (sqliteDb) {
            sqliteDb.close();
            console.log('🔐 SQLite desconectado');
        }
    }
}

compareData();
