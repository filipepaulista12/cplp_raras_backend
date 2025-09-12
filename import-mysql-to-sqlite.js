const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuração das bases SQLite locais
const SQLITE_DATABASES = {
    main: path.join(__dirname, 'prisma', 'database', 'cplp_raras_real.db'),
    backup: path.join(__dirname, 'database', 'cplp_raras_sqlite_backup.db')
};

const MYSQL_BACKUP = path.join(__dirname, 'database', 'backup_cplp_raras_20250908.sql');

// Mapeamento de tipos MySQL para SQLite
const TYPE_MAPPING = {
    'int': 'INTEGER',
    'varchar(255)': 'TEXT',
    'text': 'TEXT',
    'datetime': 'DATETIME',
    'json': 'TEXT',
    'bigint': 'INTEGER'
};

function convertMySQLTypeToSQLite(mysqlType) {
    // Limpar o tipo MySQL
    const cleanType = mysqlType.toLowerCase().replace(/\s+/g, ' ');
    
    if (cleanType.includes('int')) return 'INTEGER';
    if (cleanType.includes('varchar') || cleanType.includes('text')) return 'TEXT';
    if (cleanType.includes('datetime') || cleanType.includes('timestamp')) return 'DATETIME';
    if (cleanType.includes('json')) return 'TEXT';
    if (cleanType.includes('decimal') || cleanType.includes('float')) return 'REAL';
    
    return 'TEXT'; // fallback
}

function convertMySQLCreateToSQLite(createStatement) {
    // Converter CREATE TABLE do MySQL para SQLite
    let sqliteCreate = createStatement;
    
    // Remover ENGINE, CHARSET, etc.
    sqliteCreate = sqliteCreate.replace(/\s*ENGINE=\w+.*$/gmi, '');
    sqliteCreate = sqliteCreate.replace(/\s*DEFAULT CHARSET=.*$/gmi, '');
    sqliteCreate = sqliteCreate.replace(/\s*COLLATE=.*$/gmi, '');
    
    // Converter AUTO_INCREMENT para AUTOINCREMENT
    sqliteCreate = sqliteCreate.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');
    
    // Remover KEY definições complexas
    sqliteCreate = sqliteCreate.replace(/,\s*KEY.*$/gmi, '');
    
    // Converter tipos específicos
    sqliteCreate = sqliteCreate.replace(/varchar\(\d+\)/gi, 'TEXT');
    sqliteCreate = sqliteCreate.replace(/text\s+COLLATE\s+[\w_]+/gi, 'TEXT');
    sqliteCreate = sqliteCreate.replace(/datetime\s+DEFAULT\s+CURRENT_TIMESTAMP(\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP)?/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP');
    
    return sqliteCreate;
}

async function parseBackupFile() {
    console.log('📖 PARSEANDO BACKUP MySQL PARA DADOS SQLite');
    console.log('═'.repeat(60));
    
    if (!fs.existsSync(MYSQL_BACKUP)) {
        throw new Error(`Backup não encontrado: ${MYSQL_BACKUP}`);
    }
    
    const stats = fs.statSync(MYSQL_BACKUP);
    console.log(`📁 Arquivo: ${path.basename(MYSQL_BACKUP)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    const fileStream = fs.createReadStream(MYSQL_BACKUP);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const tables = new Map();
    let currentTable = null;
    let createBuffer = '';
    let inCreateTable = false;
    let insertBuffer = '';
    let lineCount = 0;
    
    console.log('\n📋 Extraindo estruturas e dados...\n');
    
    for await (const line of rl) {
        lineCount++;
        
        if (lineCount % 10000 === 0) {
            console.log(`   📈 Processadas ${lineCount.toLocaleString()} linhas...`);
        }
        
        // Detectar início de CREATE TABLE
        if (line.startsWith('CREATE TABLE')) {
            inCreateTable = true;
            createBuffer = line;
            const tableMatch = line.match(/CREATE TABLE [`]?(\w+)[`]?\s/);
            if (tableMatch) {
                currentTable = tableMatch[1];
                tables.set(currentTable, { 
                    createStatement: '', 
                    inserts: [],
                    recordCount: 0 
                });
                console.log(`📊 Tabela encontrada: ${currentTable}`);
            }
        }
        // Continuar capturando CREATE TABLE
        else if (inCreateTable) {
            createBuffer += '\n' + line;
            if (line.includes(';')) {
                inCreateTable = false;
                if (currentTable && tables.has(currentTable)) {
                    tables.get(currentTable).createStatement = convertMySQLCreateToSQLite(createBuffer);
                }
                createBuffer = '';
            }
        }
        // Capturar INSERTs
        else if (line.startsWith('INSERT INTO')) {
            const insertMatch = line.match(/INSERT INTO [`]?(\w+)[`]?\s/);
            if (insertMatch) {
                const tableName = insertMatch[1];
                if (tables.has(tableName)) {
                    // Converter INSERT do MySQL para SQLite
                    let sqliteInsert = line.replace(/INSERT INTO [`]?(\w+)[`]?/, 'INSERT INTO $1');
                    tables.get(tableName).inserts.push(sqliteInsert);
                    tables.get(tableName).recordCount++;
                }
            }
        }
    }
    
    console.log(`\n✅ Parse concluído!`);
    console.log(`📊 Total de linhas: ${lineCount.toLocaleString()}`);
    console.log(`📦 Tabelas encontradas: ${tables.size}`);
    
    return tables;
}

async function createSQLiteDatabase(dbPath, tables) {
    console.log(`\n🗄️  CRIANDO BASE SQLite: ${path.basename(dbPath)}`);
    console.log('─'.repeat(60));
    
    // Criar diretório se não existir
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Remover base existente
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('🗑️  Base anterior removida');
    }
    
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                reject(err);
                return;
            }
            console.log('✅ Base SQLite criada com sucesso');
            resolve(db);
        });
    });
}

async function importDataToSQLite(db, tables) {
    console.log('\n📥 IMPORTANDO DADOS PARA SQLite');
    console.log('═'.repeat(60));
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Desabilitar foreign keys temporariamente
            db.run('PRAGMA foreign_keys = OFF');
            
            let totalProcessed = 0;
            let totalRecords = 0;
            
            const tableNames = Array.from(tables.keys());
            
            function processNextTable(index) {
                if (index >= tableNames.length) {
                    db.run('PRAGMA foreign_keys = ON');
                    console.log(`\n✅ Importação concluída!`);
                    console.log(`📦 Tabelas processadas: ${totalProcessed}`);
                    console.log(`📈 Total de registros: ${totalRecords.toLocaleString()}`);
                    resolve({ tables: totalProcessed, records: totalRecords });
                    return;
                }
                
                const tableName = tableNames[index];
                const tableData = tables.get(tableName);
                
                console.log(`\n📊 Processando: ${tableName}`);
                
                // Criar tabela
                db.run(tableData.createStatement, (err) => {
                    if (err) {
                        console.log(`   ❌ Erro ao criar tabela: ${err.message}`);
                        processNextTable(index + 1);
                        return;
                    }
                    
                    console.log(`   ✅ Tabela criada`);
                    
                    if (tableData.inserts.length === 0) {
                        console.log(`   ⚪ Sem dados para importar`);
                        totalProcessed++;
                        processNextTable(index + 1);
                        return;
                    }
                    
                    // Inserir dados em lotes
                    const batchSize = 100;
                    let insertIndex = 0;
                    
                    function insertBatch() {
                        if (insertIndex >= tableData.inserts.length) {
                            console.log(`   ✅ ${tableData.recordCount.toLocaleString()} registros importados`);
                            totalProcessed++;
                            totalRecords += tableData.recordCount;
                            processNextTable(index + 1);
                            return;
                        }
                        
                        const batch = tableData.inserts.slice(insertIndex, insertIndex + batchSize);
                        insertIndex += batchSize;
                        
                        db.run('BEGIN TRANSACTION');
                        
                        let batchCompleted = 0;
                        batch.forEach((insertStatement, i) => {
                            db.run(insertStatement, (err) => {
                                if (err) {
                                    console.log(`   ⚠️  Erro no registro ${insertIndex - batchSize + i}: ${err.message.substring(0, 100)}`);
                                }
                                batchCompleted++;
                                if (batchCompleted === batch.length) {
                                    db.run('COMMIT');
                                    process.nextTick(insertBatch);
                                }
                            });
                        });
                    }
                    
                    insertBatch();
                });
            }
            
            processNextTable(0);
        });
    });
}

async function main() {
    console.log('🚀 IMPORTAÇÃO BACKUP MySQL → SQLite LOCAL');
    console.log('═'.repeat(80));
    console.log('🔒 MANTENDO BACKUP MYSQL SEGURO - APENAS LEITURA');
    console.log('═'.repeat(80));
    
    try {
        // 1. Parse do backup MySQL
        const tables = await parseBackupFile();
        
        // 2. Criar base SQLite principal
        const mainDb = await createSQLiteDatabase(SQLITE_DATABASES.main, tables);
        
        // 3. Importar dados
        const mainResult = await importDataToSQLite(mainDb, tables);
        
        // 4. Fechar conexão
        mainDb.close();
        
        // 5. Criar backup SQLite adicional
        console.log('\n💾 CRIANDO BACKUP ADICIONAL SQLite');
        console.log('─'.repeat(40));
        
        if (fs.existsSync(SQLITE_DATABASES.main)) {
            fs.copyFileSync(SQLITE_DATABASES.main, SQLITE_DATABASES.backup);
            console.log('✅ Backup SQLite criado');
        }
        
        // 6. Verificar resultado
        const mainStats = fs.statSync(SQLITE_DATABASES.main);
        
        console.log('\n🎯 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('═'.repeat(80));
        console.log(`✅ Base principal: ${path.basename(SQLITE_DATABASES.main)}`);
        console.log(`📊 Tamanho: ${(mainStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📦 Tabelas: ${mainResult.tables}`);
        console.log(`📈 Registros: ${mainResult.records.toLocaleString()}`);
        console.log(`💾 Backup MySQL preservado: ${path.basename(MYSQL_BACKUP)}`);
        console.log(`💾 Backup SQLite: ${path.basename(SQLITE_DATABASES.backup)}`);
        
        console.log('\n🔗 PRÓXIMOS PASSOS:');
        console.log('• Configurar APIs para usar nova base SQLite');
        console.log('• Testar endpoints com dados reais');
        console.log('• Verificar integridade dos dados importados');
        
    } catch (error) {
        console.error('\n❌ Erro durante importação:', error.message);
        process.exit(1);
    }
}

// Executar
main();
