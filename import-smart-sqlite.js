const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

console.log('🔄 IMPORTAÇÃO INTELIGENTE: MySQL → SQLite');
console.log('═'.repeat(50));

const backupPath = './database/backup_cplp_raras_20250908.sql';
const sqliteDb = './cplp_raras_complete.db';

async function importBackupSmart() {
    console.log('\n📂 VERIFICAÇÃO INICIAL:');
    console.log('─'.repeat(30));

    if (!fs.existsSync(backupPath)) {
        console.error('❌ Backup não encontrado:', backupPath);
        return;
    }

    const backupStats = fs.statSync(backupPath);
    console.log(`✅ Backup: ${(backupStats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Remover SQLite anterior
    if (fs.existsSync(sqliteDb)) {
        fs.unlinkSync(sqliteDb);
        console.log('🗑️  Database anterior removida');
    }

    console.log('\n🔧 CRIANDO ESTRUTURA SIMPLIFICADA:');
    console.log('─'.repeat(40));

    const db = new sqlite3.Database(sqliteDb);

    return new Promise((resolve) => {
        db.serialize(() => {
            // Criar tabelas manualmente com estrutura simples
            const tables = {
                cplp_countries: `
                    CREATE TABLE cplp_countries (
                        id INTEGER PRIMARY KEY,
                        code TEXT,
                        name TEXT,
                        name_pt TEXT,
                        flag_emoji TEXT,
                        population INTEGER,
                        language TEXT,
                        healthcare_system TEXT,
                        rare_disease_policy TEXT,
                        orphan_drug_policy TEXT,
                        created_at TEXT
                    )`,
                
                hpo_terms: `
                    CREATE TABLE hpo_terms (
                        id INTEGER PRIMARY KEY,
                        hpo_id TEXT,
                        name TEXT,
                        definition TEXT,
                        synonyms TEXT,
                        is_obsolete INTEGER DEFAULT 0,
                        created_at TEXT
                    )`,
                
                orpha_diseases: `
                    CREATE TABLE orpha_diseases (
                        id INTEGER PRIMARY KEY,
                        orpha_code TEXT,
                        name TEXT,
                        definition TEXT,
                        epidemiology TEXT,
                        clinical_description TEXT,
                        etiology TEXT,
                        diagnostic_methods TEXT,
                        differential_diagnosis TEXT,
                        antenatal_diagnosis TEXT,
                        molecular_genetics TEXT,
                        management_treatment TEXT,
                        prognosis TEXT,
                        created_at TEXT
                    )`,
                
                drugbank_drugs: `
                    CREATE TABLE drugbank_drugs (
                        id INTEGER PRIMARY KEY,
                        drugbank_id TEXT,
                        name TEXT,
                        description TEXT,
                        cas_number TEXT,
                        unii TEXT,
                        average_mass REAL,
                        molecular_formula TEXT,
                        structure TEXT,
                        indication TEXT,
                        pharmacodynamics TEXT,
                        mechanism_of_action TEXT,
                        toxicity TEXT,
                        metabolism TEXT,
                        absorption TEXT,
                        half_life TEXT,
                        protein_binding TEXT,
                        route_of_elimination TEXT,
                        volume_of_distribution TEXT,
                        clearance TEXT,
                        created_at TEXT
                    )`,
                
                hpo_disease_associations: `
                    CREATE TABLE hpo_disease_associations (
                        id INTEGER PRIMARY KEY,
                        hpo_id TEXT,
                        disease_id TEXT,
                        disease_name TEXT,
                        database_name TEXT,
                        frequency TEXT,
                        created_at TEXT
                    )`,
                
                hpo_gene_associations: `
                    CREATE TABLE hpo_gene_associations (
                        id INTEGER PRIMARY KEY,
                        hpo_id TEXT,
                        gene_symbol TEXT,
                        gene_id TEXT,
                        created_at TEXT
                    )`,
                
                orpha_external_mappings: `
                    CREATE TABLE orpha_external_mappings (
                        id INTEGER PRIMARY KEY,
                        orpha_code TEXT,
                        external_reference TEXT,
                        source TEXT,
                        mapping_type TEXT,
                        created_at TEXT
                    )`
            };

            console.log('📋 Criando tabelas:');
            let createdTables = 0;
            const totalTables = Object.keys(tables).length;

            Object.keys(tables).forEach(tableName => {
                db.run(tables[tableName], (err) => {
                    createdTables++;
                    if (err) {
                        console.log(`❌ ${tableName}: ${err.message}`);
                    } else {
                        console.log(`✅ ${tableName}: Criada`);
                    }

                    if (createdTables === totalTables) {
                        console.log('\n📊 PROCESSANDO DADOS DO BACKUP:');
                        console.log('─'.repeat(40));
                        
                        // Processar arquivo linha por linha
                        const readline = require('readline');
                        const fileStream = fs.createReadStream(backupPath);
                        const rl = readline.createInterface({
                            input: fileStream,
                            crlfDelay: Infinity
                        });

                        let insertCount = 0;
                        let errorCount = 0;

                        rl.on('line', (line) => {
                            const trimmedLine = line.trim();
                            
                            if (trimmedLine.toUpperCase().startsWith('INSERT INTO')) {
                                // Limpar e converter INSERT
                                let cleanInsert = trimmedLine
                                    .replace(/`/g, '')
                                    .replace(/\\\'/g, "''")
                                    .replace(/\\"/g, '""');

                                // Verificar se é uma tabela que criamos
                                const tableMatch = cleanInsert.match(/INSERT INTO (\w+)/i);
                                if (tableMatch) {
                                    const tableName = tableMatch[1];
                                    if (tables[tableName]) {
                                        db.run(cleanInsert, (err) => {
                                            if (err) {
                                                errorCount++;
                                                if (errorCount <= 5) {
                                                    console.log(`⚠️  Erro INSERT ${tableName}: ${err.message.substring(0, 50)}...`);
                                                }
                                            } else {
                                                insertCount++;
                                                if (insertCount % 1000 === 0) {
                                                    console.log(`📈 Inseridos: ${insertCount.toLocaleString()}`);
                                                }
                                            }
                                        });
                                    }
                                }
                            }
                        });

                        rl.on('close', () => {
                            console.log('\n⏳ Finalizando inserções...');
                            
                            setTimeout(() => {
                                console.log('\n📊 VERIFICAÇÃO FINAL:');
                                console.log('─'.repeat(30));

                                const tablesToCheck = Object.keys(tables);
                                let checkedTables = 0;
                                let totalRecords = 0;

                                tablesToCheck.forEach(tableName => {
                                    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
                                        checkedTables++;
                                        if (!err && result) {
                                            const count = result.count;
                                            totalRecords += count;
                                            console.log(`   📋 ${tableName}: ${count.toLocaleString()} registros`);
                                        } else {
                                            console.log(`   ❌ ${tableName}: Erro ao contar`);
                                        }

                                        if (checkedTables === tablesToCheck.length) {
                                            console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
                                            console.log('═'.repeat(50));
                                            console.log(`✅ Tabelas: ${tablesToCheck.length}`);
                                            console.log(`✅ Registros totais: ${totalRecords.toLocaleString()}`);
                                            console.log(`✅ Inserções bem-sucedidas: ${insertCount.toLocaleString()}`);
                                            console.log(`⚠️  Erros: ${errorCount.toLocaleString()}`);
                                            console.log(`📁 Database criada: ${sqliteDb}`);
                                            
                                            if (totalRecords > 0) {
                                                console.log('\n🎯 SQLite agora tem dados do servidor!');
                                                console.log('🔄 Próximo: Configurar MySQL local');
                                            }

                                            db.close((err) => {
                                                if (err) {
                                                    console.error('❌ Erro ao fechar DB:', err.message);
                                                } else {
                                                    console.log('🔐 Database fechada');
                                                }
                                                resolve();
                                            });
                                        }
                                    });
                                });
                            }, 3000);
                        });
                    }
                });
            });
        });
    });
}

importBackupSmart().catch(console.error);
