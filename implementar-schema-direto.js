/**
 * IMPLEMENTAÇÃO DIRETA DO SCHEMA - COMANDOS INDIVIDUAIS
 */

const fs = require('fs');
const mysql = require('mysql2/promise');

async function implementSchema() {
    let connection = null;
    
    try {
        console.log('🚀 IMPLEMENTAÇÃO DIRETA DO SCHEMA EXPANDIDO');
        console.log('='.repeat(60));

        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado');

        // Comandos SQL diretos
        const sqlCommands = [
            // 1. Tabela clinvar_variants
            `CREATE TABLE IF NOT EXISTS clinvar_variants (
                id INT PRIMARY KEY AUTO_INCREMENT,
                clinvar_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'ClinVar Variation ID',
                name VARCHAR(500) COMMENT 'Nome da variante',
                type ENUM('single nucleotide variant', 'deletion', 'insertion', 'duplication', 'inversion', 'copy number gain', 'copy number loss', 'other') COMMENT 'Tipo de variante',
                chromosome VARCHAR(10) COMMENT 'Cromossomo',
                start_position BIGINT COMMENT 'Posição inicial',
                end_position BIGINT COMMENT 'Posição final',
                reference_allele TEXT COMMENT 'Alelo de referência',
                alternate_allele TEXT COMMENT 'Alelo alternativo',
                gene_symbol VARCHAR(50) COMMENT 'Símbolo do gene',
                gene_id INT COMMENT 'Gene ID (NCBI)',
                hgvs_c VARCHAR(500) COMMENT 'HGVS nomenclatura (coding)',
                hgvs_p VARCHAR(500) COMMENT 'HGVS nomenclatura (protein)',
                hgvs_g VARCHAR(500) COMMENT 'HGVS nomenclatura (genomic)',
                assembly VARCHAR(20) DEFAULT 'GRCh38' COMMENT 'Assembly genômico',
                clinical_significance ENUM('pathogenic', 'likely pathogenic', 'uncertain significance', 'likely benign', 'benign', 'other') COMMENT 'Significância clínica',
                review_status VARCHAR(100) COMMENT 'Status de revisão',
                last_evaluated DATE COMMENT 'Data da última avaliação',
                submission_count INT DEFAULT 0 COMMENT 'Número de submissões',
                origin VARCHAR(100) COMMENT 'Origem da variante',
                affected_status VARCHAR(100) COMMENT 'Status de afetação',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_clinvar_id (clinvar_id),
                INDEX idx_gene_symbol (gene_symbol),
                INDEX idx_chromosome (chromosome),
                INDEX idx_clinical_significance (clinical_significance),
                INDEX idx_gene_id (gene_id)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Variantes genéticas do ClinVar'`,

            // 2. Tabela clinvar_submissions
            `CREATE TABLE IF NOT EXISTS clinvar_submissions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                variant_id INT NOT NULL COMMENT 'FK para clinvar_variants',
                submitter_name VARCHAR(200) COMMENT 'Nome do submissor',
                submission_date DATE COMMENT 'Data da submissão',
                clinical_significance ENUM('pathogenic', 'likely pathogenic', 'uncertain significance', 'likely benign', 'benign', 'other') COMMENT 'Significância clínica desta submissão',
                condition_name VARCHAR(500) COMMENT 'Nome da condição',
                condition_id VARCHAR(100) COMMENT 'ID da condição (OMIM, Orphanet, etc)',
                method_type VARCHAR(100) COMMENT 'Tipo de método de análise',
                description TEXT COMMENT 'Descrição da submissão',
                citation_source VARCHAR(200) COMMENT 'Fonte da citação',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE,
                INDEX idx_variant_id (variant_id),
                INDEX idx_submitter (submitter_name),
                INDEX idx_submission_date (submission_date),
                INDEX idx_condition_id (condition_id)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Submissões das variantes ClinVar'`,

            // 3. Tabela clinvar_hpo_associations
            `CREATE TABLE IF NOT EXISTS clinvar_hpo_associations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                variant_id INT NOT NULL COMMENT 'FK para clinvar_variants',
                hpo_term_id INT NOT NULL COMMENT 'FK para hpo_terms existente',
                association_type ENUM('associated', 'causative', 'protective', 'other') DEFAULT 'associated' COMMENT 'Tipo de associação',
                evidence_level ENUM('strong', 'moderate', 'weak', 'conflicting') COMMENT 'Nível de evidência',
                source VARCHAR(100) COMMENT 'Fonte da associação',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE,
                UNIQUE KEY unique_variant_hpo (variant_id, hpo_term_id),
                INDEX idx_variant_id (variant_id),
                INDEX idx_hpo_term_id (hpo_term_id)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Associações entre variantes ClinVar e termos HPO'`,

            // 4. Tabela clinvar_genes
            `CREATE TABLE IF NOT EXISTS clinvar_genes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                gene_symbol VARCHAR(50) UNIQUE NOT NULL COMMENT 'Símbolo oficial do gene',
                gene_id INT UNIQUE COMMENT 'NCBI Gene ID',
                entrez_id INT COMMENT 'Entrez Gene ID',
                ensembl_id VARCHAR(50) COMMENT 'Ensembl Gene ID',
                hgnc_id VARCHAR(20) COMMENT 'HGNC ID',
                gene_name VARCHAR(500) COMMENT 'Nome completo do gene',
                chromosome VARCHAR(10) COMMENT 'Cromossomo',
                map_location VARCHAR(100) COMMENT 'Localização cromossômica',
                description TEXT COMMENT 'Descrição da função do gene',
                gene_type VARCHAR(100) COMMENT 'Tipo do gene',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_gene_symbol (gene_symbol),
                INDEX idx_gene_id (gene_id),
                INDEX idx_chromosome (chromosome)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Informações de genes do ClinVar'`,

            // 5. Tabela omim_entries
            `CREATE TABLE IF NOT EXISTS omim_entries (
                id INT PRIMARY KEY AUTO_INCREMENT,
                omim_id VARCHAR(20) UNIQUE NOT NULL COMMENT 'OMIM MIM Number',
                entry_type ENUM('gene', 'phenotype', 'gene_phenotype', 'other') COMMENT 'Tipo de entrada OMIM',
                title VARCHAR(500) NOT NULL COMMENT 'Título da entrada',
                alternative_titles TEXT COMMENT 'Títulos alternativos',
                included_titles TEXT COMMENT 'Títulos incluídos',
                description TEXT COMMENT 'Descrição da entrada',
                inheritance_pattern VARCHAR(200) COMMENT 'Padrão de herança',
                gene_symbol VARCHAR(50) COMMENT 'Símbolo do gene',
                chromosome_location VARCHAR(50) COMMENT 'Localização cromossômica',
                created_date DATE COMMENT 'Data de criação na OMIM',
                edited_date DATE COMMENT 'Data da última edição',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_omim_id (omim_id),
                INDEX idx_entry_type (entry_type),
                INDEX idx_gene_symbol (gene_symbol),
                INDEX idx_title (title(100))
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Entradas principais do OMIM'`,

            // 6. Tabela omim_phenotypes
            `CREATE TABLE IF NOT EXISTS omim_phenotypes (
                id INT PRIMARY KEY AUTO_INCREMENT,
                omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
                phenotype_name VARCHAR(500) NOT NULL COMMENT 'Nome do fenótipo',
                inheritance_pattern VARCHAR(200) COMMENT 'Padrão de herança específico',
                mapping_method VARCHAR(100) COMMENT 'Método de mapeamento',
                gene_symbol VARCHAR(50) COMMENT 'Gene associado',
                chromosome_location VARCHAR(50) COMMENT 'Localização cromossômica',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
                INDEX idx_omim_entry_id (omim_entry_id),
                INDEX idx_phenotype_name (phenotype_name(100)),
                INDEX idx_gene_symbol (gene_symbol)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Fenótipos descritos no OMIM'`,

            // 7. Tabela omim_hpo_associations
            `CREATE TABLE IF NOT EXISTS omim_hpo_associations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
                hpo_term_id INT NOT NULL COMMENT 'FK para hpo_terms existente',
                association_type ENUM('associated', 'causative', 'characteristic', 'occasional', 'excluded') DEFAULT 'associated' COMMENT 'Tipo de associação',
                frequency VARCHAR(50) COMMENT 'Frequência do fenótipo',
                evidence VARCHAR(100) COMMENT 'Evidência da associação',
                source VARCHAR(100) COMMENT 'Fonte da associação',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
                UNIQUE KEY unique_omim_hpo (omim_entry_id, hpo_term_id),
                INDEX idx_omim_entry_id (omim_entry_id),
                INDEX idx_hpo_term_id (hpo_term_id)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Associações entre entradas OMIM e termos HPO'`,

            // 8. Tabela omim_external_mappings
            `CREATE TABLE IF NOT EXISTS omim_external_mappings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
                external_db VARCHAR(50) NOT NULL COMMENT 'Base de dados externa',
                external_id VARCHAR(100) NOT NULL COMMENT 'ID na base externa',
                mapping_type ENUM('exact', 'related', 'broader', 'narrower', 'similar') DEFAULT 'exact' COMMENT 'Tipo de mapeamento',
                confidence_score DECIMAL(3,2) COMMENT 'Confiança do mapeamento',
                source VARCHAR(100) COMMENT 'Fonte do mapeamento',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
                UNIQUE KEY unique_omim_external (omim_entry_id, external_db, external_id),
                INDEX idx_omim_entry_id (omim_entry_id),
                INDEX idx_external_db (external_db),
                INDEX idx_external_id (external_id)
            ) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
            COMMENT='Mapeamentos entre OMIM e bases externas'`
        ];

        console.log(`🔧 Executando ${sqlCommands.length} comandos SQL...`);

        let success = 0;
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

        for (let i = 0; i < sqlCommands.length; i++) {
            const sql = sqlCommands[i];
            const tableName = tableNames[i];
            
            console.log(`\n[${i + 1}/${sqlCommands.length}] Criando tabela: ${tableName}`);
            
            try {
                await connection.execute(sql);
                success++;
                console.log(`✅ Tabela ${tableName} criada com sucesso`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️ Tabela ${tableName} já existe (OK)`);
                    success++;
                } else {
                    console.log(`❌ Erro criando ${tableName}: ${error.message}`);
                }
            }
        }

        // Verificar resultado
        console.log('\n🔍 Verificando tabelas criadas...');
        const [tables] = await connection.execute('SHOW TABLES');
        const allTableNames = tables.map(row => Object.values(row)[0]);
        
        const genomicTablesCreated = tableNames.filter(table => 
            allTableNames.includes(table)
        );

        console.log(`📊 Tabelas genômicas criadas: ${genomicTablesCreated.length}/${tableNames.length}`);
        genomicTablesCreated.forEach(table => {
            console.log(`   ✅ ${table}`);
        });

        // Testar estruturas
        console.log('\n🧪 Testando estruturas...');
        for (const table of genomicTablesCreated) {
            try {
                const [columns] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`   📊 ${table}: ${columns.length} colunas`);
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📋 RELATÓRIO FINAL');
        console.log('='.repeat(60));
        console.log(`✅ Tabelas criadas: ${genomicTablesCreated.length}/8`);
        console.log(`🎯 Status: ${genomicTablesCreated.length >= 6 ? 'SUCESSO' : 'PARCIAL'}`);

        if (genomicTablesCreated.length >= 6) {
            console.log('\n🎉 SCHEMA EXPANDIDO IMPLEMENTADO COM SUCESSO!');
            console.log('🔄 Sistema pronto para ETL de dados genômicos');
        }

        return {
            sucesso: genomicTablesCreated.length >= 6,
            tabelas_criadas: genomicTablesCreated.length
        };

    } catch (error) {
        console.error('\n💥 ERRO FATAL:', error.message);
        return { sucesso: false, erro: error.message };
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão MySQL fechada');
        }
    }
}

// Executar
implementSchema()
    .then(result => {
        if (result.sucesso) {
            console.log('\n✅ IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('📊 Próximo: Atualizar schema Prisma');
        } else {
            console.log('\n❌ IMPLEMENTAÇÃO FALHOU!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
