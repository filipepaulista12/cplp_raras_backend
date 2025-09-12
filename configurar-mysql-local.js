const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

console.log('🛠️ CONFIGURADOR MYSQL LOCAL');
console.log('═'.repeat(50));

async function configurarMySQLLocal() {
    let connection;
    
    try {
        console.log('🔗 Conectando no MySQL local...');
        
        // Conectar no MySQL (sem especificar database)
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: 'root123', // Senha padrão comum
            multipleStatements: true
        });
        
        console.log('✅ MySQL conectado!');
        
        // Criar database se não existir
        console.log('\n📦 Criando database cplp_raras...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        console.log('✅ Database criado/verificado');
        
        // Usar a database
        await connection.execute('USE cplp_raras');
        
        // Verificar se já tem tabelas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n📋 Tabelas existentes: ${tables.length}`);
        
        if (tables.length === 0) {
            console.log('\n🏗️ Criando estrutura de tabelas...');
            
            // Criar tabelas principais manualmente
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS cplp_countries (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    code VARCHAR(2) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    name_pt VARCHAR(100),
                    flag_emoji VARCHAR(10),
                    population VARCHAR(20),
                    language VARCHAR(10),
                    health_system TEXT,
                    rare_disease_policy TEXT,
                    orphan_drugs_program TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS hpo_terms (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    hpo_id VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(255) NOT NULL,
                    definition TEXT,
                    name_pt VARCHAR(255),
                    definition_pt TEXT,
                    is_obsolete BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS rare_diseases (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    orphacode VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(255) NOT NULL,
                    name_pt VARCHAR(255),
                    definition TEXT,
                    definition_pt TEXT,
                    synonyms TEXT,
                    synonyms_pt TEXT,
                    prevalence VARCHAR(100),
                    inheritance VARCHAR(100),
                    age_onset VARCHAR(100),
                    icd10_codes TEXT,
                    omim_codes TEXT,
                    umls_codes TEXT,
                    mesh_codes TEXT,
                    gard_id VARCHAR(50),
                    status VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tabelas principais criadas');
        }
        
        // Popular com dados dos países CPLP
        console.log('\n🌍 Inserindo países CPLP...');
        
        const paisesCPLP = [
            ['BR', 'Brasil', 'Brasil', '🇧🇷', '215300000', 'pt', 'Sistema Único de Saúde (SUS)', 'Política Nacional de Atenção às Pessoas com Doenças Raras (Portaria GM/MS nº 199/2014)', 'RENAME - Relação Nacional de Medicamentos Essenciais (inclui medicamentos órfãos)'],
            ['PT', 'Portugal', 'Portugal', '🇵🇹', '10330000', 'pt', 'Serviço Nacional de Saúde (SNS)', 'Programa Nacional para as Doenças Raras', 'Medicamentos Órfãos - INFARMED, I.P.'],
            ['AO', 'Angola', 'Angola', '🇦🇴', '35600000', 'pt', 'Sistema Nacional de Saúde de Angola', 'Em desenvolvimento - Plano Nacional de Saúde 2025-2030', 'Lista Nacional de Medicamentos Essenciais (sem categoria específica para órfãos)'],
            ['MZ', 'Moçambique', 'Moçambique', '🇲🇿', '33100000', 'pt', 'Serviço Nacional de Saúde de Moçambique', 'Estratégia do Sector da Saúde 2014-2025 (menção a doenças não transmissíveis)', 'Lista Nacional de Medicamentos e Dispositivos Médicos'],
            ['CV', 'Cabo Verde', 'Cabo Verde', '🇨🇻', '593000', 'pt', 'Sistema Nacional de Saúde de Cabo Verde', 'Plano Nacional de Desenvolvimento Sanitário 2017-2021', 'Lista Nacional de Medicamentos Essenciais'],
            ['GW', 'Guiné-Bissau', 'Guiné-Bissau', '🇬🇼', '2150000', 'pt', 'Sistema Nacional de Saúde da Guiné-Bissau', 'Política Nacional de Saúde 2015-2025', 'Lista Nacional de Medicamentos Essenciais (básica)'],
            ['ST', 'São Tomé e Príncipe', 'São Tomé e Príncipe', '🇸🇹', '230000', 'pt', 'Serviço Nacional de Saúde de São Tomé e Príncipe', 'Política Nacional de Saúde 2015-2025', 'Lista Nacional de Medicamentos Essenciais'],
            ['TL', 'Timor-Leste', 'Timor-Leste', '🇹🇱', '1360000', 'pt', 'Sistema Nacional de Saúde de Timor-Leste', 'Plano Nacional de Saúde 2020-2030', 'Lista Nacional de Medicamentos Essenciais'],
            ['GQ', 'Guiné Equatorial', 'Guiné Equatorial', '🇬🇶', '1680000', 'es', 'Sistema de Saúde Nacional da Guiné Equatorial', 'Plan Nacional de Desarrollo del Sector Salud', 'Lista Nacional de Medicamentos']
        ];
        
        // Limpar dados existentes
        await connection.execute('DELETE FROM cplp_countries');
        
        let paisesInseridos = 0;
        for (const pais of paisesCPLP) {
            try {
                await connection.execute(
                    'INSERT INTO cplp_countries (code, name, name_pt, flag_emoji, population, language, health_system, rare_disease_policy, orphan_drugs_program) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    pais
                );
                console.log(`✅ ${pais[3]} ${pais[1]}: ${parseInt(pais[4]).toLocaleString()} hab`);
                paisesInseridos++;
            } catch (error) {
                console.log(`❌ Erro ${pais[1]}: ${error.message}`);
            }
        }
        
        // Inserir HPO Terms
        console.log('\n🧬 Inserindo HPO Terms...');
        
        const hpoTerms = [
            ['HP:0000001', 'All', 'Root of all terms in the Human Phenotype Ontology.', 'Todos', 'Raiz de todos os termos na Ontologia de Fenótipos Humanos.'],
            ['HP:0000118', 'Phenotypic abnormality', 'A phenotypic abnormality.', 'Anormalidade fenotípica', 'Uma anormalidade fenotípica.'],
            ['HP:0001507', 'Growth abnormality', 'A deviation from the normal rate of growth.', 'Anormalidade de crescimento', 'Um desvio da taxa normal de crescimento.'],
            ['HP:0000478', 'Abnormality of the eye', 'Any abnormality of the eye, including location, spacing, and intraocular abnormalities.', 'Anormalidade do olho', 'Qualquer anormalidade do olho, incluindo localização, espaçamento e anormalidades intraoculares.'],
            ['HP:0000707', 'Abnormality of the nervous system', 'An abnormality of the nervous system.', 'Anormalidade do sistema nervoso', 'Uma anormalidade do sistema nervoso.']
        ];
        
        // Limpar dados existentes
        await connection.execute('DELETE FROM hpo_terms');
        
        let hpoInseridos = 0;
        for (const termo of hpoTerms) {
            try {
                await connection.execute(
                    'INSERT INTO hpo_terms (hpo_id, name, definition, name_pt, definition_pt) VALUES (?, ?, ?, ?, ?)',
                    termo
                );
                console.log(`✅ ${termo[0]}: ${termo[1]}`);
                hpoInseridos++;
            } catch (error) {
                console.log(`❌ Erro HPO ${termo[0]}: ${error.message}`);
            }
        }
        
        // Inserir Doenças Raras
        console.log('\n🔬 Inserindo Doenças Raras...');
        
        const doencas = [
            ['ORPHA:558', 'Marfan syndrome', 'Síndrome de Marfan', 'A systemic disorder of connective tissue characterized by abnormalities of the eyes, skeleton, and cardiovascular system.', 'Um distúrbio sistêmico do tecido conjuntivo caracterizado por anormalidades dos olhos, esqueleto e sistema cardiovascular.', '1:5000', 'Autosomal dominant', 'All ages'],
            ['ORPHA:773', 'Neurofibromatosis type 1', 'Neurofibromatose tipo 1', 'A tumor predisposition syndrome characterized by the development of neurofibromas.', 'Uma síndrome de predisposição tumoral caracterizada pelo desenvolvimento de neurofibromas.', '1:3000', 'Autosomal dominant', 'Childhood'],
            ['ORPHA:586', 'Ehlers-Danlos syndrome', 'Síndrome de Ehlers-Danlos', 'A heterogeneous group of heritable connective tissue disorders.', 'Um grupo heterogêneo de distúrbios hereditários do tecido conjuntivo.', '1:5000', 'Various', 'All ages'],
            ['ORPHA:550', 'Duchenne muscular dystrophy', 'Distrofia muscular de Duchenne', 'A severe X-linked recessive neuromuscular disorder.', 'Um distúrbio neuromuscular recessivo ligado ao X severo.', '1:3500 male births', 'X-linked recessive', 'Early childhood'],
            ['ORPHA:352', 'Cystic fibrosis', 'Fibrose cística', 'A multisystem disorder affecting the respiratory and digestive systems.', 'Um distúrbio multissistêmico que afeta os sistemas respiratório e digestivo.', '1:2500-3500', 'Autosomal recessive', 'Neonatal/infantile']
        ];
        
        // Limpar dados existentes
        await connection.execute('DELETE FROM rare_diseases');
        
        let doencasInseridas = 0;
        for (const doenca of doencas) {
            try {
                await connection.execute(
                    'INSERT INTO rare_diseases (orphacode, name, name_pt, definition, definition_pt, prevalence, inheritance, age_onset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    doenca
                );
                console.log(`✅ ${doenca[0]}: ${doenca[2] || doenca[1]}`);
                doencasInseridas++;
            } catch (error) {
                console.log(`❌ Erro doença ${doenca[0]}: ${error.message}`);
            }
        }
        
        // Verificar totais
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        console.log('─'.repeat(30));
        
        const [countPaises] = await connection.execute('SELECT COUNT(*) as total FROM cplp_countries');
        const [countHPO] = await connection.execute('SELECT COUNT(*) as total FROM hpo_terms');
        const [countDoencas] = await connection.execute('SELECT COUNT(*) as total FROM rare_diseases');
        
        console.log(`🌍 Países CPLP: ${countPaises[0].total}`);
        console.log(`🧬 HPO Terms: ${countHPO[0].total}`);
        console.log(`🔬 Doenças Raras: ${countDoencas[0].total}`);
        console.log(`📈 Total: ${countPaises[0].total + countHPO[0].total + countDoencas[0].total} registros`);
        
        // Calcular população total
        const [popResult] = await connection.execute('SELECT SUM(CAST(population AS UNSIGNED)) as total_pop FROM cplp_countries');
        console.log(`\n🌐 População total CPLP: ${parseInt(popResult[0].total_pop).toLocaleString()} habitantes`);
        
        console.log('\n🎉 MYSQL LOCAL CONFIGURADO E POPULADO!');
        console.log('═'.repeat(50));
        console.log('✅ Database cplp_raras criado');
        console.log('✅ Tabelas estruturadas');
        console.log('✅ Dados CPLP inseridos');
        console.log('✅ Pronto para sincronização');
        
        console.log('\n🔗 INFORMAÇÕES DE CONEXÃO:');
        console.log('─'.repeat(35));
        console.log('• Host: localhost');
        console.log('• Port: 3306');
        console.log('• Database: cplp_raras');
        console.log('• User: root');
        console.log('• Password: root123');
        
    } catch (error) {
        console.error('❌ Erro na configuração MySQL:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUÇÕES:');
            console.log('1. Verificar se MySQL está rodando:');
            console.log('   net start mysql80');
            console.log('2. Ou iniciar serviços MySQL no painel de controle');
            console.log('3. Ou verificar se a senha está correta');
        }
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔐 MySQL desconectado');
        }
    }
}

configurarMySQLLocal();
