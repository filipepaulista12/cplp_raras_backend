const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações
const BACKUP_FILE = path.join(__dirname, 'database', 'backup_cplp_raras_20250908.sql');
const SQLITE_MAIN = path.join(__dirname, 'prisma', 'database', 'cplp_raras_real.db');
const SQLITE_FULL = path.join(__dirname, 'database', 'cplp_raras_full.db');

async function parseCompleteBackup() {
    console.log('📖 PARSEANDO BACKUP COMPLETO PARA SQLite');
    console.log('═'.repeat(60));
    
    if (!fs.existsSync(BACKUP_FILE)) {
        throw new Error(`Backup não encontrado: ${BACKUP_FILE}`);
    }
    
    const stats = fs.statSync(BACKUP_FILE);
    console.log(`📁 Backup: ${path.basename(BACKUP_FILE)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    const fileStream = fs.createReadStream(BACKUP_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const tables = new Map();
    let currentTable = null;
    let lineCount = 0;
    let inInsert = false;
    let insertBuffer = '';
    
    console.log('\n📋 Processando arquivo SQL...\n');
    
    for await (const line of rl) {
        lineCount++;
        
        if (lineCount % 5000 === 0) {
            console.log(`   📈 ${lineCount.toLocaleString()} linhas processadas...`);
        }
        
        // Detectar CREATE TABLE
        if (line.startsWith('CREATE TABLE')) {
            const tableMatch = line.match(/CREATE TABLE [`]?(\w+)[`]?\s/);
            if (tableMatch) {
                currentTable = tableMatch[1];
                tables.set(currentTable, {
                    name: currentTable,
                    createStatement: convertMySQLToSQLite(line),
                    records: []
                });
                console.log(`📊 Tabela: ${currentTable}`);
            }
        }
        
        // Detectar início de INSERT
        else if (line.startsWith('INSERT INTO')) {
            inInsert = true;
            insertBuffer = line;
            
            const insertMatch = line.match(/INSERT INTO [`]?(\w+)[`]?\s/);
            if (insertMatch) {
                currentTable = insertMatch[1];
            }
        }
        
        // Continuar INSERT multi-linha
        else if (inInsert && !line.endsWith(';')) {
            insertBuffer += '\n' + line;
        }
        
        // Finalizar INSERT
        else if (inInsert && line.endsWith(';')) {
            insertBuffer += '\n' + line;
            inInsert = false;
            
            if (currentTable && tables.has(currentTable)) {
                // Extrair dados do INSERT
                const records = parseInsertStatement(insertBuffer);
                tables.get(currentTable).records.push(...records);
            }
            
            insertBuffer = '';
        }
    }
    
    console.log(`\n✅ Parse concluído!`);
    console.log(`📊 ${lineCount.toLocaleString()} linhas processadas`);
    console.log(`📦 ${tables.size} tabelas encontradas`);
    
    // Mostrar estatísticas
    let totalRecords = 0;
    console.log('\n📊 ESTATÍSTICAS POR TABELA:');
    console.log('─'.repeat(50));
    
    Array.from(tables.values())
        .sort((a, b) => b.records.length - a.records.length)
        .forEach(table => {
            totalRecords += table.records.length;
            const status = table.records.length > 0 ? '✅' : '⚪';
            console.log(`   ${status} ${table.name}: ${table.records.length.toLocaleString()} registros`);
        });
    
    console.log(`\n📈 Total: ${totalRecords.toLocaleString()} registros extraídos`);
    
    return tables;
}

function convertMySQLToSQLite(createStatement) {
    let sqliteStatement = createStatement;
    
    // Conversões básicas MySQL -> SQLite
    sqliteStatement = sqliteStatement.replace(/varchar\(\d+\)/gi, 'TEXT');
    sqliteStatement = sqliteStatement.replace(/text\s+COLLATE\s+[\w_]+/gi, 'TEXT');
    sqliteStatement = sqliteStatement.replace(/int\s+DEFAULT\s+NULL/gi, 'INTEGER');
    sqliteStatement = sqliteStatement.replace(/datetime\s+DEFAULT\s+CURRENT_TIMESTAMP.*$/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    sqliteStatement = sqliteStatement.replace(/json\s+DEFAULT\s+NULL.*$/gi, 'TEXT');
    sqliteStatement = sqliteStatement.replace(/\s+COMMENT\s+'[^']*'/gi, '');
    sqliteStatement = sqliteStatement.replace(/,\s*PRIMARY KEY.*$/gi, '');
    sqliteStatement = sqliteStatement.replace(/\s*ENGINE=.*$/gi, '');
    
    return sqliteStatement;
}

function parseInsertStatement(insertStatement) {
    const records = [];
    
    try {
        // Extrair a parte VALUES
        const valuesMatch = insertStatement.match(/VALUES\s+(.*);/s);
        if (!valuesMatch) return records;
        
        const valuesStr = valuesMatch[1];
        
        // Dividir em registros individuais
        const valueGroups = [];
        let currentGroup = '';
        let parenthesesCount = 0;
        let inString = false;
        let stringChar = '';
        
        for (let i = 0; i < valuesStr.length; i++) {
            const char = valuesStr[i];
            const prevChar = valuesStr[i - 1];
            
            if ((char === "'" || char === '"') && prevChar !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            if (!inString) {
                if (char === '(') {
                    parenthesesCount++;
                } else if (char === ')') {
                    parenthesesCount--;
                }
            }
            
            currentGroup += char;
            
            if (!inString && parenthesesCount === 0 && char === ')') {
                valueGroups.push(currentGroup.trim());
                currentGroup = '';
                // Pular vírgula e espaços
                while (i + 1 < valuesStr.length && (valuesStr[i + 1] === ',' || valuesStr[i + 1] === ' ' || valuesStr[i + 1] === '\n')) {
                    i++;
                }
            }
        }
        
        // Processar cada grupo de valores
        valueGroups.forEach(group => {
            if (group.startsWith('(') && group.endsWith(')')) {
                const values = group.slice(1, -1); // Remover parênteses
                records.push(values);
            }
        });
        
    } catch (error) {
        console.log(`⚠️  Erro ao parsear INSERT: ${error.message}`);
    }
    
    return records;
}

async function createFullSQLiteDatabase(tables) {
    console.log('\n🗄️  CRIANDO SQLite COMPLETO');
    console.log('═'.repeat(60));
    
    // Remover base existente
    if (fs.existsSync(SQLITE_FULL)) {
        fs.unlinkSync(SQLITE_FULL);
        console.log('🗑️  Base anterior removida');
    }
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(SQLITE_FULL, (err) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('✅ Base SQLite criada');
            
            db.serialize(() => {
                db.run('PRAGMA foreign_keys = OFF');
                db.run('PRAGMA synchronous = OFF');
                db.run('PRAGMA journal_mode = WAL');
                
                const tableNames = Array.from(tables.keys());
                let processedTables = 0;
                
                function processNextTable(index) {
                    if (index >= tableNames.length) {
                        db.run('PRAGMA foreign_keys = ON');
                        
                        const stats = fs.statSync(SQLITE_FULL);
                        console.log(`\n✅ Base SQLite completa criada!`);
                        console.log(`📁 Arquivo: ${path.basename(SQLITE_FULL)}`);
                        console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                        console.log(`📦 Tabelas: ${processedTables}`);
                        
                        resolve(db);
                        return;
                    }
                    
                    const tableName = tableNames[index];
                    const tableData = tables.get(tableName);
                    
                    console.log(`\n📊 Criando: ${tableName}`);
                    
                    // Criar tabela
                    db.run(tableData.createStatement, (err) => {
                        if (err) {
                            console.log(`   ❌ Erro ao criar: ${err.message}`);
                            processNextTable(index + 1);
                            return;
                        }
                        
                        console.log(`   ✅ Estrutura criada`);
                        
                        if (tableData.records.length === 0) {
                            console.log(`   ⚪ Sem dados para inserir`);
                            processedTables++;
                            processNextTable(index + 1);
                            return;
                        }
                        
                        console.log(`   📥 Inserindo ${tableData.records.length.toLocaleString()} registros...`);
                        
                        // Inserir dados em lotes
                        db.run('BEGIN TRANSACTION');
                        
                        let inserted = 0;
                        let errors = 0;
                        
                        tableData.records.forEach((record, recordIndex) => {
                            const placeholders = record.split(',').map(() => '?').join(',');
                            const insertSQL = `INSERT INTO ${tableName} VALUES (${placeholders})`;
                            
                            // Parse valores
                            const values = parseValues(record);
                            
                            db.run(insertSQL, values, (err) => {
                                if (err) {
                                    errors++;
                                    if (errors <= 5) { // Mostrar apenas os primeiros 5 erros
                                        console.log(`      ⚠️  Erro no registro ${recordIndex}: ${err.message.substring(0, 80)}`);
                                    }
                                } else {
                                    inserted++;
                                }
                                
                                if (inserted + errors === tableData.records.length) {
                                    db.run('COMMIT');
                                    console.log(`   ✅ ${inserted.toLocaleString()} registros inseridos`);
                                    if (errors > 0) {
                                        console.log(`   ⚠️  ${errors} erros ignorados`);
                                    }
                                    processedTables++;
                                    processNextTable(index + 1);
                                }
                            });
                        });
                    });
                }
                
                processNextTable(0);
            });
        });
    });
}

function parseValues(valueString) {
    const values = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let parenthesesCount = 0;
    
    for (let i = 0; i < valueString.length; i++) {
        const char = valueString[i];
        const prevChar = valueString[i - 1];
        
        if ((char === "'" || char === '"') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
                current += char;
            } else if (char === stringChar) {
                inString = false;
                current += char;
            } else {
                current += char;
            }
        } else if (char === ',' && !inString && parenthesesCount === 0) {
            values.push(processValue(current.trim()));
            current = '';
        } else {
            if (char === '(') parenthesesCount++;
            if (char === ')') parenthesesCount--;
            current += char;
        }
    }
    
    if (current.trim()) {
        values.push(processValue(current.trim()));
    }
    
    return values;
}

function processValue(value) {
    if (value === 'NULL') {
        return null;
    }
    
    if (value.startsWith("'") && value.endsWith("'")) {
        return value.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
    }
    
    if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
    }
    
    // Tentar converter para número
    if (/^\d+$/.test(value)) {
        return parseInt(value);
    }
    
    if (/^\d+\.\d+$/.test(value)) {
        return parseFloat(value);
    }
    
    return value;
}

async function main() {
    console.log('🚀 IMPORTAÇÃO COMPLETA BACKUP → SQLite');
    console.log('═'.repeat(80));
    console.log('🎯 CRIANDO BASE SQLite COM TODOS OS DADOS');
    console.log('═'.repeat(80));
    
    try {
        // 1. Parse completo do backup
        const tables = await parseCompleteBackup();
        
        // 2. Criar base SQLite completa
        const db = await createFullSQLiteDatabase(tables);
        
        // 3. Fechar conexão
        db.close();
        
        console.log('\n🎉 SINCRONIZAÇÃO COMPLETA!');
        console.log('═'.repeat(50));
        console.log('✅ SQLite Simples: Dados CPLP (40 KB)');
        console.log('✅ SQLite Completo: Todos os dados (MB)');
        console.log('🔒 MySQL Servidor: APENAS CONSULTA');
        console.log('💾 Backup MySQL: Preservado (30.23 MB)');
        
        console.log('\n🎯 BASES DISPONÍVEIS:');
        console.log(`📁 ${path.basename(SQLITE_MAIN)} - Base principal`);
        console.log(`📁 ${path.basename(SQLITE_FULL)} - Base completa`);
        console.log(`📁 ${path.basename(BACKUP_FILE)} - Backup MySQL`);
        
    } catch (error) {
        console.error('\n❌ Erro durante importação:', error.message);
    }
}

main();
