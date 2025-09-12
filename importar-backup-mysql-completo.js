const mysql = require('mysql2/promise');
const fs = require('fs').promises;

console.log('🚀 IMPORTAÇÃO COMPLETA DO BACKUP - MySQL Local');
console.log('═'.repeat(50));

async function importarBackupCompleto() {
    let connection;
    
    try {
        // Conectar ao MySQL
        console.log('🔌 Conectando ao MySQL local...');
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras',
            multipleStatements: true
        });
        
        console.log('✅ MySQL conectado');
        
        // Primeiro, criar as estruturas necessárias baseadas no schema
        console.log('🏗️ Criando estruturas de tabelas...');
        
        const createTableQueries = [
            `CREATE TABLE IF NOT EXISTS cplp_countries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(2) NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                name_pt VARCHAR(100) NOT NULL,
                flag_emoji VARCHAR(10),
                population VARCHAR(20),
                official_language VARCHAR(10),
                health_system TEXT,
                rare_disease_policy TEXT,
                orphan_drugs_program TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS hpo_terms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hpo_id VARCHAR(20) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                definition TEXT,
                category VARCHAR(100),
                synonyms JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS rare_diseases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                icd10_code VARCHAR(20),
                prevalence VARCHAR(100),
                inheritance_pattern VARCHAR(100),
                age_of_onset VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS drug_interactions (
                id VARCHAR(36) PRIMARY KEY,
                drug1_id VARCHAR(36),
                drug2_id VARCHAR(36),
                interaction_type VARCHAR(50),
                interaction_type_pt VARCHAR(50),
                severity VARCHAR(20),
                severity_pt VARCHAR(20),
                description_en TEXT,
                description_pt TEXT,
                mechanism TEXT,
                mechanism_pt TEXT,
                management_en TEXT,
                management_pt TEXT,
                monitoring TEXT,
                monitoring_pt TEXT,
                evidence_level VARCHAR(50),
                reference_en TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS drugbank_drugs (
                id VARCHAR(36) PRIMARY KEY,
                drugbank_id VARCHAR(20) UNIQUE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                type VARCHAR(100),
                groups JSON,
                indication TEXT,
                pharmacodynamics TEXT,
                mechanism TEXT,
                toxicity TEXT,
                metabolism TEXT,
                absorption TEXT,
                half_life VARCHAR(100),
                protein_binding VARCHAR(100),
                route_of_elimination TEXT,
                volume_of_distribution VARCHAR(100),
                clearance VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS hpo_disease_associations (
                id VARCHAR(36) PRIMARY KEY,
                hpo_term_id VARCHAR(36),
                disease_id VARCHAR(36),
                frequency VARCHAR(50),
                evidence VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS hpo_gene_associations (
                id VARCHAR(36) PRIMARY KEY,
                hpo_term_id VARCHAR(36),
                gene_symbol VARCHAR(20),
                gene_id VARCHAR(20),
                evidence VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS hpo_phenotype_associations (
                id VARCHAR(36) PRIMARY KEY,
                hpo_term_id VARCHAR(36),
                phenotype_id VARCHAR(36),
                frequency VARCHAR(50),
                evidence VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        ];
        
        // Criar tabelas
        for (const query of createTableQueries) {
            try {
                await connection.execute(query);
                console.log('✅ Tabela criada');
            } catch (error) {
                console.log(`⚠️ Tabela já existe ou erro: ${error.message.substring(0, 50)}`);
            }
        }
        
        // Ler o backup
        console.log('\n📂 Carregando backup do servidor...');
        const backupPath = 'database/Dump20250903.sql';
        
        try {
            const backupContent = await fs.readFile(backupPath, 'utf8');
            console.log(`✅ Backup carregado: ${(backupContent.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Extrair apenas os INSERTs válidos e executá-los em batches
            console.log('🔄 Processando INSERTs do backup...');
            
            const lines = backupContent.split('\n');
            let insertCount = 0;
            let successCount = 0;
            
            for (const line of lines) {
                const trimmedLine = line.trim();
                
                // Apenas processar linhas INSERT válidas
                if (trimmedLine.startsWith('INSERT INTO') && trimmedLine.endsWith(';')) {
                    insertCount++;
                    
                    try {
                        await connection.execute(trimmedLine);
                        successCount++;
                        
                        if (successCount % 1000 === 0) {
                            console.log(`⚡ Processados: ${successCount.toLocaleString()} INSERTs`);
                        }
                        
                    } catch (error) {
                        // Ignorar erros individuais para continuar importação
                        if (insertCount % 5000 === 0) {
                            console.log(`⚠️ Alguns INSERTs falharam (normal em migração)`);
                        }
                    }
                }
            }
            
            console.log(`✅ Importação concluída: ${successCount.toLocaleString()} de ${insertCount.toLocaleString()} INSERTs`);
            
        } catch (fileError) {
            console.error('❌ Erro ao ler backup:', fileError.message);
            return;
        }
        
        // Verificar resultado da importação
        console.log('\n📊 VERIFICANDO IMPORTAÇÃO:');
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 Tabelas criadas: ${tables.length}`);
        
        let totalRecords = 0;
        const importantTables = ['cplp_countries', 'hpo_terms', 'drug_interactions', 'drugbank_drugs'];
        
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            try {
                const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
                const records = count[0].total;
                totalRecords += records;
                
                if (importantTables.includes(tableName) || records > 100) {
                    console.log(`✅ ${tableName}: ${records.toLocaleString()} registros`);
                }
            } catch (error) {
                console.log(`⚠️ Erro ao contar ${tableName}`);
            }
        }
        
        console.log(`\n🎯 TOTAL MYSQL: ${totalRecords.toLocaleString()} registros`);
        
        // Avaliar sucesso da importação
        if (totalRecords > 100000) {
            console.log('\n🎉 ✅ IMPORTAÇÃO CIENTÍFICA COMPLETA!');
            console.log('📊 Dataset robusto importado com sucesso');
        } else if (totalRecords > 10000) {
            console.log('\n🎯 ✅ IMPORTAÇÃO PARCIAL SIGNIFICATIVA');
            console.log('📊 Grande volume de dados científicos importado');
        } else if (totalRecords > 1000) {
            console.log('\n⚠️ IMPORTAÇÃO BÁSICA');
            console.log('📊 Alguns dados importados');
        } else {
            console.log('\n❌ IMPORTAÇÃO LIMITADA');
            console.log('📊 Poucos dados importados - verificar backup');
        }
        
    } catch (error) {
        console.error('❌ Erro na importação:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão MySQL encerrada');
        }
    }
}

importarBackupCompleto();
