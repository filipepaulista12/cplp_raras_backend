-- SQL para popular MySQL com dados CPLP essenciais
USE cplp_raras;

-- Criar tabela países
DROP TABLE IF EXISTS cplp_countries;
CREATE TABLE cplp_countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(2),
    name VARCHAR(100),
    population VARCHAR(20),
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir países CPLP
INSERT INTO cplp_countries (code, name, population, language) VALUES
('BR', 'Brasil', '215300000', 'pt'),
('PT', 'Portugal', '10330000', 'pt'),
('AO', 'Angola', '35600000', 'pt'),
('MZ', 'Moçambique', '33100000', 'pt'),
('CV', 'Cabo Verde', '593000', 'pt'),
('GW', 'Guiné-Bissau', '2150000', 'pt'),
('ST', 'São Tomé e Príncipe', '230000', 'pt'),
('TL', 'Timor-Leste', '1360000', 'pt'),
('GQ', 'Guiné Equatorial', '1680000', 'es');

-- Criar tabela HPO
DROP TABLE IF EXISTS hpo_terms;
CREATE TABLE hpo_terms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hpo_id VARCHAR(20),
    name VARCHAR(255),
    name_pt VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir HPO terms
INSERT INTO hpo_terms (hpo_id, name, name_pt) VALUES
('HP:0000001', 'All', 'Todos'),
('HP:0000118', 'Phenotypic abnormality', 'Anormalidade fenotípica'),
('HP:0001507', 'Growth abnormality', 'Anormalidade de crescimento'),
('HP:0000478', 'Abnormality of the eye', 'Anormalidade do olho'),
('HP:0000707', 'Abnormality of the nervous system', 'Anormalidade do sistema nervoso'),
('HP:0001871', 'Abnormality of blood', 'Anormalidade do sangue'),
('HP:0000924', 'Abnormality of the skeletal system', 'Anormalidade do sistema esquelético'),
('HP:0000818', 'Abnormality of the endocrine system', 'Anormalidade do sistema endócrino'),
('HP:0002664', 'Neoplasm', 'Neoplasia'),
('HP:0000152', 'Abnormality of head or neck', 'Anormalidade da cabeça ou pescoço');

-- Criar tabela doenças raras
DROP TABLE IF EXISTS rare_diseases;
CREATE TABLE rare_diseases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    orphacode VARCHAR(20),
    name VARCHAR(255),
    name_pt VARCHAR(255),
    prevalence VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir doenças raras
INSERT INTO rare_diseases (orphacode, name, name_pt, prevalence) VALUES
('ORPHA:558', 'Marfan syndrome', 'Síndrome de Marfan', '1:5000'),
('ORPHA:773', 'Neurofibromatosis type 1', 'Neurofibromatose tipo 1', '1:3000'),
('ORPHA:586', 'Ehlers-Danlos syndrome', 'Síndrome de Ehlers-Danlos', '1:5000'),
('ORPHA:550', 'Duchenne muscular dystrophy', 'Distrofia muscular de Duchenne', '1:3500'),
('ORPHA:352', 'Cystic fibrosis', 'Fibrose cística', '1:2500-3500');

-- Verificar resultados
SELECT 'PAÍSES CPLP' as tabela, COUNT(*) as total FROM cplp_countries
UNION ALL
SELECT 'HPO TERMS' as tabela, COUNT(*) as total FROM hpo_terms  
UNION ALL
SELECT 'DOENÇAS RARAS' as tabela, COUNT(*) as total FROM rare_diseases;

-- População total CPLP
SELECT 'POPULAÇÃO TOTAL CPLP' as info, SUM(CAST(population AS UNSIGNED)) as habitantes FROM cplp_countries;
