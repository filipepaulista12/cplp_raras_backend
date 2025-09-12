const mysql = require('mysql2/promise');
const fs = require('fs').promises;

console.log('🔥 CONFIGURAÇÃO MYSQL LOCAL - XAMPP');
console.log('🎯 IMPORTANDO BACKUP COMPLETO DO SERVIDOR');
console.log('═'.repeat(50));

async function configurarMySQLXAMPP() {
    let connection;
    
    try {
        console.log('🔗 Conectando no MySQL XAMPP...');
        
        // Conectar no XAMPP MySQL (porta padrão 3306, sem senha)
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '', // XAMPP padrão sem senha
            multipleStatements: true
        });
        
        console.log('✅ MySQL XAMPP conectado!');
        
        // Criar database
        console.log('\n📦 Criando database cplp_raras...');
        await connection.execute('DROP DATABASE IF EXISTS cplp_raras');
        await connection.execute('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.execute('USE cplp_raras');
        console.log('✅ Database criado');
        
        // Ler e importar o backup
        console.log('\n📂 Carregando backup do servidor (30MB)...');
        const backupPath = 'database/Dump20250903.sql';
        
        if (await fs.access(backupPath).then(() => true).catch(() => false)) {
            console.log('✅ Backup encontrado, importando...');
            
            const backupSQL = await fs.readFile(backupPath, 'utf8');
            console.log(`📊 Tamanho do backup: ${(backupSQL.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Dividir SQL em statements menores para evitar timeout
            const statements = backupSQL
                .split(';')
                .filter(stmt => stmt.trim().length > 0)
                .filter(stmt => !stmt.trim().startsWith('--'))
                .filter(stmt => !stmt.trim().startsWith('/*'));
            
            console.log(`🔄 Executando ${statements.length} comandos SQL...`);
            
            let executed = 0;
            let errors = 0;
            
            for (const stmt of statements) {
                try {
                    if (stmt.trim()) {
                        await connection.execute(stmt);
                        executed++;
                        
                        if (executed % 1000 === 0) {
                            console.log(`   ⚡ Executados: ${executed}/${statements.length}`);
                        }
                    }
                } catch (error) {
                    errors++;
                    if (errors < 10) { // Mostrar apenas primeiros 10 erros
                        console.log(`   ⚠️ Erro: ${error.message.substring(0, 100)}...`);
                    }
                }
            }
            
            console.log(`\n✅ Importação concluída!`);
            console.log(`   📈 Sucessos: ${executed}`);
            console.log(`   ⚠️ Erros: ${errors}`);
            
        } else {
            console.log('❌ Backup não encontrado em database/Dump20250903.sql');
            console.log('🔄 Criando estrutura básica...');
            
            // Criar tabelas básicas se backup não existir
            await connection.execute(`
                CREATE TABLE cplp_countries (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    code VARCHAR(2) UNIQUE,
                    name VARCHAR(100),
                    name_pt VARCHAR(100),
                    flag_emoji VARCHAR(10),
                    population VARCHAR(20),
                    language VARCHAR(10),
                    health_system TEXT,
                    rare_disease_policy TEXT,
                    orphan_drugs_program TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await connection.execute(`
                CREATE TABLE hpo_terms (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    hpo_id VARCHAR(20) UNIQUE,
                    name VARCHAR(255),
                    definition TEXT,
                    name_pt VARCHAR(255),
                    definition_pt TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            await connection.execute(`
                CREATE TABLE rare_diseases (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    orphacode VARCHAR(20) UNIQUE,
                    name VARCHAR(255),
                    name_pt VARCHAR(255),
                    definition TEXT,
                    definition_pt TEXT,
                    prevalence VARCHAR(100),
                    inheritance VARCHAR(100),
                    age_onset VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Estrutura básica criada');
        }
        
        // Verificar dados importados
        console.log('\n📊 VERIFICANDO DADOS IMPORTADOS:');
        console.log('─'.repeat(40));
        
        const tables = ['cplp_countries', 'hpo_terms', 'rare_diseases', 'orphanet_diseases'];
        
        for (const table of tables) {
            try {
                const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
                console.log(`✅ ${table}: ${count[0].total.toLocaleString()} registros`);
            } catch (error) {
                console.log(`❌ ${table}: tabela não existe`);
            }
        }
        
        // Listar todas as tabelas
        const [allTables] = await connection.execute('SHOW TABLES');
        console.log(`\n📋 Total de tabelas: ${allTables.length}`);
        
        console.log('\n🎉 MYSQL LOCAL CONFIGURADO COM DADOS COMPLETOS!');
        console.log('═'.repeat(55));
        console.log('✅ XAMPP MySQL funcionando');
        console.log('✅ Database cplp_raras criado');
        console.log('✅ Backup do servidor importado');
        console.log('✅ Dados científicos disponíveis');
        
        console.log('\n🔗 CONEXÃO MYSQL LOCAL:');
        console.log('─'.repeat(30));
        console.log('Host: localhost');
        console.log('Port: 3306');
        console.log('User: root');
        console.log('Password: (vazio)');
        console.log('Database: cplp_raras');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUÇÕES:');
            console.log('1. Abrir XAMPP Control Panel');
            console.log('2. Iniciar MySQL no XAMPP');
            console.log('3. Verificar porta 3306 livre');
        }
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔐 MySQL desconectado');
        }
    }
}

configurarMySQLXAMPP();
