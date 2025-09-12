const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🚀 IMPORTAÇÃO COMPLETA: Backup MySQL → SQLite');
console.log('═'.repeat(60));
console.log('🎯 Objetivo: Deixar SQLite idêntico ao servidor MySQL');
console.log('═'.repeat(60));

const backupPath = './database/backup_cplp_raras_20250908.sql';
const sqliteDb = './cplp_raras_complete.db';

async function importCompleteBackup() {
    console.log('\n📂 PREPARAÇÃO:');
    console.log('─'.repeat(30));
    
    // Verificar se backup existe
    if (!fs.existsSync(backupPath)) {
        console.error('❌ Backup não encontrado:', backupPath);
        return;
    }

    const backupStats = fs.statSync(backupPath);
    const backupSizeMB = (backupStats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Backup encontrado: ${backupSizeMB} MB`);

    // Remover SQLite antigo se existir
    if (fs.existsSync(sqliteDb)) {
        fs.unlinkSync(sqliteDb);
        console.log('🗑️  SQLite anterior removido');
    }

    console.log('\n📖 LENDO BACKUP MYSQL:');
    console.log('─'.repeat(30));

    // Ler arquivo completo
    const sqlContent = fs.readFileSync(backupPath, 'utf8');
    const lines = sqlContent.split('\n');
    console.log(`📄 Total de linhas: ${lines.length.toLocaleString()}`);

    // Analisar estrutura
    const createTableLines = lines.filter(line => line.trim().toUpperCase().startsWith('CREATE TABLE'));
    const insertLines = lines.filter(line => line.trim().toUpperCase().startsWith('INSERT INTO'));
    
    console.log(`📊 CREATE TABLE: ${createTableLines.length}`);
    console.log(`📊 INSERT INTO: ${insertLines.length}`);

    // Extrair nomes das tabelas
    const tableNames = createTableLines.map(line => {
        const match = line.match(/CREATE TABLE `?(\w+)`?/i);
        return match ? match[1] : null;
    }).filter(Boolean);

    console.log('\n📋 TABELAS ENCONTRADAS:');
    tableNames.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table}`);
    });

    console.log('\n🔄 CONVERTENDO MYSQL → SQLite:');
    console.log('─'.repeat(40));

    // Criar nova database SQLite
    const db = new sqlite3.Database(sqliteDb);
    
    db.serialize(() => {
        console.log('✅ Database SQLite criada');

        // Processar linha por linha para converter MySQL para SQLite
        let currentTable = null;
        let createTableSQL = '';
        let isInCreateTable = false;
        let totalInserted = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.toUpperCase().startsWith('CREATE TABLE')) {
                isInCreateTable = true;
                createTableSQL = line;
                
                // Extrair nome da tabela
                const match = line.match(/CREATE TABLE `?(\w+)`?/i);
                currentTable = match ? match[1] : null;
                continue;
            }

            if (isInCreateTable) {
                createTableSQL += ' ' + line;
                
                if (line.includes(');') || line.endsWith(';')) {
                    isInCreateTable = false;
                    
                    // Converter MySQL para SQLite
                    let sqliteSQL = createTableSQL
                        .replace(/`/g, '') // Remover backticks
                        .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
                        .replace(/ENGINE=\w+/gi, '')
                        .replace(/DEFAULT CHARSET=\w+/gi, '')
                        .replace(/COLLATE=\w+/gi, '')
                        .replace(/unsigned/gi, '')
                        .replace(/,\s*PRIMARY KEY[^,)]+/gi, '')
                        .replace(/,\s*KEY[^,)]+/gi, '')
                        .replace(/,\s*UNIQUE KEY[^,)]+/gi, '')
                        .replace(/,\s*INDEX[^,)]+/gi, '')
                        .replace(/,\s*CONSTRAINT[^,)]+/gi, '')
                        .replace(/DATETIME/gi, 'TEXT')
                        .replace(/TIMESTAMP/gi, 'TEXT')
                        .replace(/LONGTEXT/gi, 'TEXT')
                        .replace(/MEDIUMTEXT/gi, 'TEXT')
                        .replace(/TINYTEXT/gi, 'TEXT')
                        .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
                        .replace(/CHAR\(\d+\)/gi, 'TEXT')
                        .replace(/DECIMAL\([^)]+\)/gi, 'REAL')
                        .replace(/DOUBLE/gi, 'REAL')
                        .replace(/FLOAT/gi, 'REAL')
                        .replace(/BIGINT/gi, 'INTEGER')
                        .replace(/MEDIUMINT/gi, 'INTEGER')
                        .replace(/SMALLINT/gi, 'INTEGER')
                        .replace(/TINYINT\(\d+\)/gi, 'INTEGER')
                        .replace(/,\s*,/g, ',') // Remover vírgulas duplas
                        .replace(/,\s*\)/g, ')'); // Remover vírgula antes do )

                    try {
                        db.run(sqliteSQL, (err) => {
                            if (err) {
                                console.log(`⚠️  Erro ao criar tabela ${currentTable}: ${err.message}`);
                                // Tentar versão simplificada
                                const simpleSQL = `CREATE TABLE IF NOT EXISTS ${currentTable} (id INTEGER PRIMARY KEY, data TEXT)`;
                                db.run(simpleSQL);
                            } else {
                                console.log(`✅ Tabela criada: ${currentTable}`);
                            }
                        });
                    } catch (error) {
                        console.log(`❌ Erro SQL para ${currentTable}: ${error.message}`);
                    }

                    createTableSQL = '';
                    currentTable = null;
                }
                continue;
            }

            // Processar INSERTs
            if (line.toUpperCase().startsWith('INSERT INTO')) {
                // Converter INSERT MySQL para SQLite
                let sqliteInsert = line.replace(/`/g, '');
                
                try {
                    db.run(sqliteInsert, (err) => {
                        if (!err) {
                            totalInserted++;
                            if (totalInserted % 1000 === 0) {
                                console.log(`📈 Inseridos: ${totalInserted.toLocaleString()} registros`);
                            }
                        }
                    });
                } catch (error) {
                    // Ignorar erros de INSERT para continuar
                }
            }
        }

        // Verificar resultado final após processamento
        setTimeout(() => {
            console.log('\n📊 VERIFICAÇÃO FINAL:');
            console.log('─'.repeat(30));

            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                if (err) {
                    console.error('❌ Erro ao verificar tabelas:', err.message);
                } else {
                    console.log(`✅ Tabelas criadas: ${tables.length}`);
                    
                    let totalRecords = 0;
                    let checkedTables = 0;

                    tables.forEach(table => {
                        db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                            checkedTables++;
                            if (!err && result) {
                                const count = result.count;
                                totalRecords += count;
                                console.log(`   📋 ${table.name}: ${count.toLocaleString()} registros`);
                            }

                            if (checkedTables === tables.length) {
                                console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
                                console.log('═'.repeat(50));
                                console.log(`✅ Total de tabelas: ${tables.length}`);
                                console.log(`✅ Total de registros: ${totalRecords.toLocaleString()}`);
                                console.log(`✅ SQLite criado: ${sqliteDb}`);
                                console.log('\n🔄 Próximo: Configurar MySQL local');
                                
                                db.close();
                            }
                        });
                    });
                }
            });
        }, 5000); // Aguardar 5 segundos para concluir INSERTs
    });
}

importCompleteBackup().catch(console.error);
