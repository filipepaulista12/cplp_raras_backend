-- clinvar_variants

CREATE TABLE clinvar_variants (
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
COMMENT='Variantes genéticas do ClinVar';

-- clinvar_submissions

CREATE TABLE clinvar_submissions (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE,
    INDEX idx_variant_id (variant_id),
    INDEX idx_submitter (submitter_name),
    INDEX idx_condition_id (condition_id)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Submissões e interpretações para variantes ClinVar';

-- clinvar_hpo_associations

CREATE TABLE clinvar_hpo_associations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    variant_id INT NOT NULL COMMENT 'FK para clinvar_variants',
    hpo_id VARCHAR(20) NOT NULL COMMENT 'FK para hpo_terms',
    evidence_code VARCHAR(10) COMMENT 'Código de evidência',
    source VARCHAR(100) COMMENT 'Fonte da associação',
    confidence_score DECIMAL(3,2) COMMENT 'Score de confiança (0.00-1.00)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (variant_id) REFERENCES clinvar_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (hpo_id) REFERENCES hpo_terms(hpo_id) ON DELETE CASCADE,
    UNIQUE KEY unique_variant_hpo (variant_id, hpo_id),
    INDEX idx_variant_id (variant_id),
    INDEX idx_hpo_id (hpo_id)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Associações entre variantes ClinVar e fenótipos HPO';

-- clinvar_genes

CREATE TABLE clinvar_genes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gene_id INT UNIQUE NOT NULL COMMENT 'NCBI Gene ID',
    symbol VARCHAR(50) NOT NULL COMMENT 'Símbolo oficial do gene',
    name VARCHAR(500) COMMENT 'Nome completo do gene',
    aliases TEXT COMMENT 'Nomes alternativos (JSON array)',
    chromosome VARCHAR(10) COMMENT 'Cromossomo',
    map_location VARCHAR(100) COMMENT 'Localização citogenética',
    gene_type VARCHAR(50) COMMENT 'Tipo do gene',
    description TEXT COMMENT 'Descrição do gene',
    summary TEXT COMMENT 'Resumo funcional',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_symbol (symbol),
    INDEX idx_gene_id (gene_id),
    INDEX idx_chromosome (chromosome)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Genes associados às variantes ClinVar';

-- omim_entries

CREATE TABLE omim_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    mim_number INT UNIQUE NOT NULL COMMENT 'Número OMIM',
    title VARCHAR(500) NOT NULL COMMENT 'Título da entrada',
    title_pt VARCHAR(500) COMMENT 'Título traduzido',
    entry_type ENUM('gene', 'phenotype', 'gene_phenotype', 'other') COMMENT 'Tipo de entrada',
    status ENUM('live', 'removed', 'moved') DEFAULT 'live' COMMENT 'Status da entrada',
    created_date DATE COMMENT 'Data de criação no OMIM',
    edited_date DATE COMMENT 'Data da última edição',
    gene_symbol VARCHAR(50) COMMENT 'Símbolo do gene (se aplicável)',
    gene_symbols_alt TEXT COMMENT 'Símbolos alternativos do gene',
    chromosome VARCHAR(10) COMMENT 'Cromossomo',
    description TEXT COMMENT 'Descrição/texto principal',
    description_pt TEXT COMMENT 'Descrição traduzida',
    clinical_synopsis JSON COMMENT 'Sinopse clínica estruturada',
    inheritance_pattern VARCHAR(100) COMMENT 'Padrão de herança',
    mapping_info VARCHAR(200) COMMENT 'Informações de mapeamento',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mim_number (mim_number),
    INDEX idx_gene_symbol (gene_symbol),
    INDEX idx_entry_type (entry_type),
    INDEX idx_chromosome (chromosome)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Entradas principais do OMIM';

-- omim_phenotypes

CREATE TABLE omim_phenotypes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
    phenotype_mim INT COMMENT 'Número MIM do fenótipo',
    phenotype_name VARCHAR(500) NOT NULL COMMENT 'Nome do fenótipo',
    phenotype_name_pt VARCHAR(500) COMMENT 'Nome traduzido',
    phenotype_mapping_key INT COMMENT 'Chave de mapeamento (1-4)',
    phenotype_description TEXT COMMENT 'Descrição do fenótipo',
    inheritance VARCHAR(100) COMMENT 'Padrão de herança específico',
    comments TEXT COMMENT 'Comentários adicionais',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
    INDEX idx_omim_entry_id (omim_entry_id),
    INDEX idx_phenotype_mim (phenotype_mim),
    INDEX idx_phenotype_name (phenotype_name)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Fenótipos associados às entradas OMIM';

-- omim_hpo_associations

CREATE TABLE omim_hpo_associations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
    hpo_id VARCHAR(20) NOT NULL COMMENT 'FK para hpo_terms',
    evidence_code VARCHAR(10) COMMENT 'Código de evidência',
    frequency VARCHAR(50) COMMENT 'Frequência do fenótipo',
    onset VARCHAR(50) COMMENT 'Idade de início',
    source VARCHAR(100) DEFAULT 'OMIM' COMMENT 'Fonte da associação',
    confidence_score DECIMAL(3,2) COMMENT 'Score de confiança',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (omim_entry_id) REFERENCES omim_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (hpo_id) REFERENCES hpo_terms(hpo_id) ON DELETE CASCADE,
    UNIQUE KEY unique_omim_hpo (omim_entry_id, hpo_id),
    INDEX idx_omim_entry_id (omim_entry_id),
    INDEX idx_hpo_id (hpo_id)
) ENGINE=InnoDB CHARACTER SET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
COMMENT='Associações entre entradas OMIM e fenótipos HPO';

-- omim_external_mappings

CREATE TABLE omim_external_mappings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    omim_entry_id INT NOT NULL COMMENT 'FK para omim_entries',
    external_db ENUM('Orphanet', 'ICD10', 'ICD11', 'SNOMED', 'HPO', 'UMLS', 'ClinVar') NOT NULL COMMENT 'Base externa',
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
COMMENT='Mapeamentos entre OMIM e bases externas';