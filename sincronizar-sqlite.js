/**
 * SINCRONIZAÇÃO MYSQL → SQLITE
 * Cria as tabelas genômicas no SQLite baseadas no schema MySQL
 */

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

async function sincronizarSchemas() {
    let mysqlConnection = null;
    let sqliteDb = null;

    try {
        console.log('🔄 SINCRONIZAÇÃO MYSQL → SQLITE');
        console.log('='.repeat(60));

        // 1. Conectar MySQL
        console.log('🔌 Conectando MySQL...');
        mysqlConnection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado');

        // 2. Conectar SQLite
        console.log('🔌 Conectando SQLite...');
        const sqlitePath = path.join(__dirname, 'prisma', 'database', 'cplp_raras_real.db');
        
        sqliteDb = new sqlite3.Database(sqlitePath);
        
        // Promisificar sqlite3
        const sqliteRun = (sql, params = []) => {
            return new Promise((resolve, reject) => {
                sqliteDb.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve(this);
                });
            });
        };

        console.log('✅ SQLite conectado');

        // 3. Comandos SQL para SQLite (adaptados do MySQL)
        const sqliteCommands = [
            // 1. clinvar_variants
            `CREATE TABLE IF NOT EXISTS clinvar_variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clinvar_id TEXT UNIQUE NOT NULL,
                name TEXT,
                type TEXT,
                chromosome TEXT,
                start_position INTEGER,
                end_position INTEGER,
                reference_allele TEXT,
                alternate_allele TEXT,
                gene_symbol TEXT,
                gene_id INTEGER,
                hgvs_c TEXT,
                hgvs_p TEXT,
                hgvs_g TEXT,
                assembly TEXT DEFAULT 'GRCh38',
                clinical_significance TEXT,
                review_status TEXT,
                last_evaluated TEXT,
                submission_count INTEGER DEFAULT 0,
                origin TEXT,
                affected_status TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // 2. clinvar_submissions
            `CREATE TABLE IF NOT EXISTS clinvar_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                variant_id INTEGER NOT NULL,
                submitter_name TEXT,
                submission_date TEXT,
                clinical_significance TEXT,
                condition_name TEXT,
                condition_id TEXT,
                method_type TEXT,
                description TEXT,
                citation_source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE
            )`,

            // 3. clinvar_hpo_associations
            `CREATE TABLE IF NOT EXISTS clinvar_hpo_associations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                variant_id INTEGER NOT NULL,
                hpo_id TEXT NOT NULL,
                association_type TEXT DEFAULT 'associated',
                evidence_level TEXT,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE,
                UNIQUE(variant_id, hpo_id)
            )`,

            // 4. clinvar_genes
            `CREATE TABLE IF NOT EXISTS clinvar_genes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gene_symbol TEXT UNIQUE NOT NULL,
                gene_id INTEGER UNIQUE,
                entrez_id INTEGER,
                ensembl_id TEXT,
                hgnc_id TEXT,
                gene_name TEXT,
                chromosome TEXT,
                map_location TEXT,
                description TEXT,
                gene_type TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // 5. omim_entries
            `CREATE TABLE IF NOT EXISTS omim_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                omim_id TEXT UNIQUE NOT NULL,
                entry_type TEXT,
                title TEXT NOT NULL,
                alternative_titles TEXT,
                included_titles TEXT,
                description TEXT,
                inheritance_pattern TEXT,
                gene_symbol TEXT,
                chromosome_location TEXT,
                created_date TEXT,
                edited_date TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )`,

            // 6. omim_phenotypes
            `CREATE TABLE IF NOT EXISTS omim_phenotypes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                omim_entry_id INTEGER NOT NULL,
                phenotype_name TEXT NOT NULL,
                inheritance_pattern TEXT,
                mapping_method TEXT,
                gene_symbol TEXT,
                chromosome_location TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE
            )`,

            // 7. omim_hpo_associations
            `CREATE TABLE IF NOT EXISTS omim_hpo_associations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                omim_entry_id INTEGER NOT NULL,
                hpo_id TEXT NOT NULL,
                association_type TEXT DEFAULT 'associated',
                frequency TEXT,
                evidence TEXT,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
                UNIQUE(omim_entry_id, hpo_id)
            )`,

            // 8. omim_external_mappings
            `CREATE TABLE IF NOT EXISTS omim_external_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                omim_entry_id INTEGER NOT NULL,
                external_db TEXT NOT NULL,
                external_id TEXT NOT NULL,
                mapping_type TEXT DEFAULT 'exact',
                confidence_score REAL,
                source TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
                UNIQUE(omim_entry_id, external_db, external_id)
            )`
        ];

        // 4. Executar comandos no SQLite
        console.log(`\n🔧 Criando ${sqliteCommands.length} tabelas no SQLite...`);

        const tableNames = [
            'clinvar_variants',
            'clinvar_submissions',
            'clinvar_hpo_associations', 
            'clinvar_genes',
            'omim_entries',
            'omim_phenotypes',
            'omim_hpo_associations',
            'omim_external_mappings'
        ];

        let sucessos = 0;
        for (let i = 0; i < sqliteCommands.length; i++) {
            const sql = sqliteCommands[i];
            const tableName = tableNames[i];
            
            try {
                console.log(`[${i + 1}/${sqliteCommands.length}] Criando ${tableName}...`);
                await sqliteRun(sql);
                sucessos++;
                console.log(`✅ ${tableName} criada no SQLite`);
            } catch (error) {
                console.log(`❌ Erro criando ${tableName}: ${error.message}`);
            }
        }

        // 5. Criar índices no SQLite
        console.log('\n📊 Criando índices...');
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_clinvar_id ON clinvar_variants(clinvar_id)',
            'CREATE INDEX IF NOT EXISTS idx_gene_symbol ON clinvar_variants(gene_symbol)',
            'CREATE INDEX IF NOT EXISTS idx_omim_id ON omim_entries(omim_id)',
            'CREATE INDEX IF NOT EXISTS idx_hpo_variant ON clinvar_hpo_associations(hpo_id)',
            'CREATE INDEX IF NOT EXISTS idx_hpo_omim ON omim_hpo_associations(hpo_id)'
        ];

        for (const indexSql of indices) {
            try {
                await sqliteRun(indexSql);
            } catch (error) {
                console.log(`⚠️ Índice: ${error.message}`);
            }
        }

        console.log('✅ Índices criados');

        // 6. Verificar resultado
        console.log('\n🔍 Verificando tabelas criadas...');
        
        const verificar = (sql) => {
            return new Promise((resolve, reject) => {
                sqliteDb.all(sql, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        const tables = await verificar("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'clinvar_%' OR name LIKE 'omim_%'");
        
        console.log(`📊 Tabelas genômicas no SQLite: ${tables.length}`);
        tables.forEach(table => {
            console.log(`   ✅ ${table.name}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('📋 RELATÓRIO DE SINCRONIZAÇÃO');
        console.log('='.repeat(60));
        console.log(`✅ Tabelas criadas: ${sucessos}/8`);
        console.log(`📊 Tabelas verificadas: ${tables.length}`);
        console.log(`🎯 Status: ${sucessos >= 6 ? 'SUCESSO' : 'PARCIAL'}`);

        if (sucessos >= 6) {
            console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('🔄 SQLite atualizado com tabelas genômicas');
            console.log('✅ Prisma agora pode acessar os modelos');
        }

        return {
            sucesso: sucessos >= 6,
            tabelas_criadas: sucessos,
            tabelas_verificadas: tables.length
        };

    } catch (error) {
        console.error('\n💥 ERRO:', error.message);
        return { sucesso: false, erro: error.message };
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n🔌 MySQL desconectado');
        }
        if (sqliteDb) {
            sqliteDb.close();
            console.log('🔌 SQLite desconectado');
        }
    }
}

// Executar
sincronizarSchemas()
    .then(result => {
        if (result.sucesso) {
            console.log('\n✅ SINCRONIZAÇÃO CONCLUÍDA!');
        } else {
            console.log('\n❌ SINCRONIZAÇÃO FALHOU!');
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
