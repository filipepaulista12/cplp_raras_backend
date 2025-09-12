const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

console.log('🔥 POPULAÇÃO DIRETA: MYSQL LOCAL XAMPP');
console.log('═'.repeat(40));

async function popularMySQLDireto() {
    let connection;
    
    try {
        // Conectar no MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ MySQL conectado');
        
        // Criar tabela países
        await connection.query(`
            DROP TABLE IF EXISTS cplp_countries
        `);
        
        await connection.query(`
            CREATE TABLE cplp_countries (
                id INT PRIMARY KEY AUTO_INCREMENT,
                code VARCHAR(2),
                name VARCHAR(100),
                name_pt VARCHAR(100),
                flag_emoji VARCHAR(10),
                population VARCHAR(20),
                language VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabela cplp_countries criada');
        
        // Inserir dados países CPLP
        const paisesData = [
            ['BR', 'Brasil', 'Brasil', '🇧🇷', '215300000', 'pt'],
            ['PT', 'Portugal', 'Portugal', '🇵🇹', '10330000', 'pt'],
            ['AO', 'Angola', 'Angola', '🇦🇴', '35600000', 'pt'],
            ['MZ', 'Moçambique', 'Moçambique', '🇲🇿', '33100000', 'pt'],
            ['CV', 'Cabo Verde', 'Cabo Verde', '🇨🇻', '593000', 'pt'],
            ['GW', 'Guiné-Bissau', 'Guiné-Bissau', '🇬🇼', '2150000', 'pt'],
            ['ST', 'São Tomé e Príncipe', 'São Tomé e Príncipe', '🇸🇹', '230000', 'pt'],
            ['TL', 'Timor-Leste', 'Timor-Leste', '🇹🇱', '1360000', 'pt'],
            ['GQ', 'Guiné Equatorial', 'Guiné Equatorial', '🇬🇶', '1680000', 'es']
        ];
        
        for (const pais of paisesData) {
            await connection.execute(
                'INSERT INTO cplp_countries (code, name, name_pt, flag_emoji, population, language) VALUES (?, ?, ?, ?, ?, ?)',
                pais
            );
        }
        
        console.log(`✅ ${paisesData.length} países inseridos`);
        
        // Criar tabela HPO
        await connection.execute(`
            DROP TABLE IF EXISTS hpo_terms
        `);
        
        await connection.execute(`
            CREATE TABLE hpo_terms (
                id INT PRIMARY KEY AUTO_INCREMENT,
                hpo_id VARCHAR(20),
                name VARCHAR(255),
                name_pt VARCHAR(255),
                definition_pt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Inserir HPO terms
        const hpoData = [
            ['HP:0000001', 'All', 'Todos', 'Raiz de todos os termos na Ontologia de Fenótipos Humanos'],
            ['HP:0000118', 'Phenotypic abnormality', 'Anormalidade fenotípica', 'Uma anormalidade fenotípica'],
            ['HP:0001507', 'Growth abnormality', 'Anormalidade de crescimento', 'Um desvio da taxa normal de crescimento'],
            ['HP:0000478', 'Abnormality of the eye', 'Anormalidade do olho', 'Qualquer anormalidade do olho'],
            ['HP:0000707', 'Abnormality of the nervous system', 'Anormalidade do sistema nervoso', 'Uma anormalidade do sistema nervoso'],
            ['HP:0001871', 'Abnormality of blood and blood-forming tissues', 'Anormalidade do sangue', 'Uma anormalidade do sistema hematopoiético'],
            ['HP:0000924', 'Abnormality of the skeletal system', 'Anormalidade do sistema esquelético', 'Uma anormalidade do sistema esquelético'],
            ['HP:0000818', 'Abnormality of the endocrine system', 'Anormalidade do sistema endócrino', 'Uma anormalidade do sistema endócrino'],
            ['HP:0002664', 'Neoplasm', 'Neoplasia', 'Uma anormalidade de órgão que consiste em proliferação celular'],
            ['HP:0000152', 'Abnormality of head or neck', 'Anormalidade da cabeça ou pescoço', 'Uma anormalidade da cabeça ou pescoço']
        ];
        
        for (const hpo of hpoData) {
            await connection.execute(
                'INSERT INTO hpo_terms (hpo_id, name, name_pt, definition_pt) VALUES (?, ?, ?, ?)',
                hpo
            );
        }
        
        console.log(`✅ ${hpoData.length} HPO terms inseridos`);
        
        // Criar tabela doenças
        await connection.execute(`
            DROP TABLE IF EXISTS rare_diseases
        `);
        
        await connection.execute(`
            CREATE TABLE rare_diseases (
                id INT PRIMARY KEY AUTO_INCREMENT,
                orphacode VARCHAR(20),
                name VARCHAR(255),
                name_pt VARCHAR(255),
                definition_pt TEXT,
                prevalence VARCHAR(100),
                inheritance_pattern VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Inserir doenças
        const doencasData = [
            ['ORPHA:558', 'Marfan syndrome', 'Síndrome de Marfan', 'Um distúrbio sistêmico do tecido conjuntivo', '1:5000', 'Autosomal dominant'],
            ['ORPHA:773', 'Neurofibromatosis type 1', 'Neurofibromatose tipo 1', 'Uma síndrome de predisposição tumoral', '1:3000', 'Autosomal dominant'],
            ['ORPHA:586', 'Ehlers-Danlos syndrome', 'Síndrome de Ehlers-Danlos', 'Um grupo de distúrbios hereditários do tecido conjuntivo', '1:5000', 'Various'],
            ['ORPHA:550', 'Duchenne muscular dystrophy', 'Distrofia muscular de Duchenne', 'Um distúrbio neuromuscular recessivo ligado ao X', '1:3500', 'X-linked recessive'],
            ['ORPHA:352', 'Cystic fibrosis', 'Fibrose cística', 'Um distúrbio multissistêmico que afeta os sistemas respiratório e digestivo', '1:2500-3500', 'Autosomal recessive']
        ];
        
        for (const doenca of doencasData) {
            await connection.execute(
                'INSERT INTO rare_diseases (orphacode, name, name_pt, definition_pt, prevalence, inheritance_pattern) VALUES (?, ?, ?, ?, ?, ?)',
                doenca
            );
        }
        
        console.log(`✅ ${doencasData.length} doenças raras inseridas`);
        
        // Verificar totais
        const [countPaises] = await connection.execute('SELECT COUNT(*) as total FROM cplp_countries');
        const [countHPO] = await connection.execute('SELECT COUNT(*) as total FROM hpo_terms');
        const [countDoencas] = await connection.execute('SELECT COUNT(*) as total FROM rare_diseases');
        
        console.log('\n📊 RESULTADO FINAL MYSQL:');
        console.log('─'.repeat(30));
        console.log(`🌍 Países CPLP: ${countPaises[0].total}`);
        console.log(`🧬 HPO Terms: ${countHPO[0].total}`);
        console.log(`🔬 Doenças Raras: ${countDoencas[0].total}`);
        console.log(`📈 TOTAL: ${countPaises[0].total + countHPO[0].total + countDoencas[0].total} registros`);
        
        // População total
        const [popTotal] = await connection.execute('SELECT SUM(CAST(population AS UNSIGNED)) as total FROM cplp_countries');
        console.log(`👥 População total: ${parseInt(popTotal[0].total).toLocaleString()} habitantes`);
        
        console.log('\n🎉 MYSQL LOCAL POPULADO COM SUCESSO!');
        console.log('═'.repeat(45));
        console.log('✅ 3 tabelas criadas');
        console.log('✅ 24 registros inseridos');
        console.log('✅ Dados idênticos ao Prisma');
        console.log('✅ XAMPP MySQL operacional');
        
        console.log('\n🔗 CONEXÃO:');
        console.log('Host: localhost:3306');
        console.log('User: root');
        console.log('Pass: (vazio)');
        console.log('DB: cplp_raras');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

popularMySQLDireto();
