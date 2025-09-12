const mysql = require('mysql2/promise');

console.log('🏗️ CRIANDO TODAS AS TABELAS NECESSÁRIAS');
console.log('═'.repeat(50));

async function criarTabelasCompletas() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ MySQL conectado');
        
        // Todas as tabelas que existem no backup
        const createQueries = [
            // Tabelas Orphanet
            `CREATE TABLE IF NOT EXISTS orpha_diseases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_number VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(500) NOT NULL,
                definition TEXT,
                classification VARCHAR(200),
                prevalence VARCHAR(100),
                inheritance VARCHAR(100),
                onset_age VARCHAR(100),
                disease_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_clinical_signs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                hpo_id VARCHAR(20),
                frequency VARCHAR(50),
                diagnostic_criteria VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_cplp_epidemiology (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                country_code VARCHAR(2),
                prevalence_value DECIMAL(15,10),
                prevalence_type VARCHAR(50),
                population_covered BIGINT,
                data_source VARCHAR(200),
                confidence_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_epidemiology (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                prevalence_class VARCHAR(100),
                prevalence_value VARCHAR(100),
                population VARCHAR(100),
                geographic_area VARCHAR(200),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_external_mappings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                external_source VARCHAR(100),
                external_id VARCHAR(100),
                mapping_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_gene_associations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                gene_symbol VARCHAR(50),
                gene_id VARCHAR(50),
                association_type VARCHAR(100),
                evidence_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_import_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source_file VARCHAR(255),
                records_processed INT,
                records_successful INT,
                status VARCHAR(50),
                notes TEXT
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_linearisations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                linearisation_name VARCHAR(100),
                code VARCHAR(50),
                level INT,
                parent_code VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_medical_classifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                classification_type VARCHAR(100),
                classification_value VARCHAR(200),
                level INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_natural_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                age_of_onset VARCHAR(100),
                age_of_death VARCHAR(100),
                type_of_inheritance VARCHAR(100),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_phenotypes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                hpo_id VARCHAR(20),
                frequency VARCHAR(50),
                diagnostic_criteria VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS orpha_textual_information (
                id INT AUTO_INCREMENT PRIMARY KEY,
                orpha_disease_id INT,
                info_type VARCHAR(100),
                title VARCHAR(500),
                content TEXT,
                language VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (orpha_disease_id) REFERENCES orpha_diseases(id)
            )`,
            
            // Outras tabelas que podem estar no backup
            `CREATE TABLE IF NOT EXISTS drug_disease_associations (
                id VARCHAR(36) PRIMARY KEY,
                drug_id VARCHAR(36),
                disease_id VARCHAR(36),
                association_type VARCHAR(100),
                evidence_level VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS gard_diseases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                gard_id VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(500) NOT NULL,
                synonyms JSON,
                definition TEXT,
                categories JSON,
                inheritance VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        ];
        
        console.log('🏗️ Criando tabelas Orphanet e outras...');
        
        for (let i = 0; i < createQueries.length; i++) {
            try {
                await connection.execute(createQueries[i]);
                console.log(`✅ Tabela ${i + 1}/${createQueries.length} criada`);
            } catch (error) {
                console.log(`⚠️ Tabela ${i + 1} já existe ou erro: ${error.message.substring(0, 50)}`);
            }
        }
        
        // Verificar tabelas criadas
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`\n📋 Total de tabelas: ${tables.length}`);
        
        tables.forEach(tableRow => {
            const tableName = Object.values(tableRow)[0];
            console.log(`   📋 ${tableName}`);
        });
        
        console.log('\n✅ Estrutura completa criada! Pronto para importação.');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

criarTabelasCompletas();
