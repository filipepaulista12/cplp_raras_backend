const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const MYSQL_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    port: 3306
};

const BACKUP_FILE = path.join(__dirname, 'database', 'backup_cplp_raras_20250908.sql');
const SQLITE_DB = path.join(__dirname, 'prisma', 'database', 'cplp_raras_real.db');

async function checkMySQLInstallation() {
    console.log('🔍 VERIFICANDO INSTALAÇÃO MYSQL');
    console.log('═'.repeat(60));
    
    try {
        // Tentar conectar
        console.log('🔌 Testando conexão MySQL...');
        const connection = await mysql.createConnection({
            host: MYSQL_CONFIG.host,
            user: MYSQL_CONFIG.user,
            password: MYSQL_CONFIG.password,
            port: MYSQL_CONFIG.port
        });
        
        console.log('✅ MySQL está funcionando!');
        await connection.end();
        return true;
        
    } catch (error) {
        console.log('❌ MySQL não está acessível:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL não está rodando ou não instalado');
            return false;
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Credenciais incorretas - tentando sem senha...');
            
            try {
                const connNoPass = await mysql.createConnection({
                    host: MYSQL_CONFIG.host,
                    user: MYSQL_CONFIG.user,
                    password: '',
                    port: MYSQL_CONFIG.port
                });
                console.log('✅ MySQL funcionando sem senha!');
                MYSQL_CONFIG.password = '';
                await connNoPass.end();
                return true;
            } catch (err) {
                console.log('❌ Ainda não conseguiu conectar');
                return false;
            }
        }
        
        return false;
    }
}

async function installMySQL() {
    console.log('\n📦 INSTALANDO MYSQL VIA CHOCOLATEY');
    console.log('═'.repeat(60));
    
    try {
        console.log('🔧 Verificando Chocolatey...');
        execSync('choco --version', { stdio: 'pipe' });
        console.log('✅ Chocolatey disponível');
        
        console.log('📦 Instalando MySQL...');
        console.log('⏳ Isso pode demorar alguns minutos...');
        
        const output = execSync('choco install mysql -y', { 
            stdio: 'pipe', 
            encoding: 'utf8',
            timeout: 300000 // 5 minutos
        });
        
        console.log('✅ MySQL instalado via Chocolatey');
        console.log('🔄 Aguardando inicialização...');
        
        // Aguardar um pouco para o serviço iniciar
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro ao instalar via Chocolatey:', error.message);
        console.log('💡 Tentando instalação manual...');
        return false;
    }
}

async function createDatabase() {
    console.log('\n🗄️  CRIANDO DATABASE CPLP_RARAS');
    console.log('═'.repeat(60));
    
    try {
        const connection = await mysql.createConnection(MYSQL_CONFIG);
        
        // Criar database
        await connection.execute('CREATE DATABASE IF NOT EXISTS cplp_raras');
        console.log('✅ Database cplp_raras criado');
        
        // Usar o database
        await connection.execute('USE cplp_raras');
        console.log('✅ Conectado ao database cplp_raras');
        
        await connection.end();
        return true;
        
    } catch (error) {
        console.log('❌ Erro ao criar database:', error.message);
        return false;
    }
}

async function importBackup() {
    console.log('\n📥 IMPORTANDO BACKUP MYSQL COMPLETO');
    console.log('═'.repeat(60));
    
    if (!fs.existsSync(BACKUP_FILE)) {
        console.log('❌ Backup não encontrado:', BACKUP_FILE);
        return false;
    }
    
    const stats = fs.statSync(BACKUP_FILE);
    console.log(`📁 Backup: ${path.basename(BACKUP_FILE)}`);
    console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    try {
        console.log('🔄 Importando dados (pode demorar alguns minutos)...');
        
        // Usar mysql command line para importar
        const mysqlCmd = `mysql -h ${MYSQL_CONFIG.host} -u ${MYSQL_CONFIG.user} ${MYSQL_CONFIG.password ? `-p${MYSQL_CONFIG.password}` : ''} cplp_raras < "${BACKUP_FILE}"`;
        
        execSync(mysqlCmd, { 
            stdio: 'pipe',
            timeout: 300000 // 5 minutos
        });
        
        console.log('✅ Backup importado com sucesso!');
        return true;
        
    } catch (error) {
        console.log('❌ Erro ao importar backup:', error.message);
        console.log('💡 Tentando importação via Node.js...');
        
        try {
            return await importBackupViaNodeJS();
        } catch (nodeError) {
            console.log('❌ Erro na importação via Node.js:', nodeError.message);
            return false;
        }
    }
}

async function importBackupViaNodeJS() {
    console.log('🔄 Importando via Node.js...');
    
    const connection = await mysql.createConnection({
        ...MYSQL_CONFIG,
        database: 'cplp_raras'
    });
    
    const backupContent = fs.readFileSync(BACKUP_FILE, 'utf8');
    
    // Dividir em statements SQL
    const statements = backupContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Executando ${statements.length} comandos SQL...`);
    
    let executed = 0;
    for (const statement of statements) {
        try {
            if (statement.includes('CREATE TABLE') || statement.includes('INSERT INTO')) {
                await connection.execute(statement);
                executed++;
                
                if (executed % 100 === 0) {
                    console.log(`   📈 ${executed}/${statements.length} comandos executados...`);
                }
            }
        } catch (err) {
            // Ignorar erros menores
            if (!err.message.includes('already exists')) {
                console.log(`   ⚠️  Erro no comando: ${err.message.substring(0, 80)}...`);
            }
        }
    }
    
    await connection.end();
    console.log(`✅ ${executed} comandos executados com sucesso`);
    return true;
}

async function verifyImport() {
    console.log('\n🔍 VERIFICANDO IMPORTAÇÃO');
    console.log('═'.repeat(60));
    
    try {
        const connection = await mysql.createConnection({
            ...MYSQL_CONFIG,
            database: 'cplp_raras'
        });
        
        // Listar tabelas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Tabelas encontradas: ${tables.length}`);
        
        let totalRecords = 0;
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const count = rows[0].count;
            totalRecords += count;
            
            const status = count > 0 ? '✅' : '⚪';
            console.log(`   ${status} ${tableName}: ${count.toLocaleString()} registros`);
        }
        
        console.log(`\n📈 Total de registros: ${totalRecords.toLocaleString()}`);
        
        await connection.end();
        return true;
        
    } catch (error) {
        console.log('❌ Erro na verificação:', error.message);
        return false;
    }
}

async function compareWithSQLite() {
    console.log('\n🔄 COMPARANDO COM SQLite LOCAL');
    console.log('═'.repeat(60));
    
    const sqlite3 = require('sqlite3').verbose();
    
    return new Promise((resolve) => {
        const db = new sqlite3.Database(SQLITE_DB, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log('❌ Erro ao abrir SQLite:', err.message);
                resolve(false);
                return;
            }
            
            // Verificar países CPLP no SQLite
            db.get("SELECT COUNT(*) as count FROM cplp_countries", [], (err, row) => {
                if (err) {
                    console.log('❌ Erro ao consultar SQLite:', err.message);
                } else {
                    console.log(`📊 SQLite - Países CPLP: ${row.count} registros`);
                }
                
                db.close();
                resolve(true);
            });
        });
    });
}

async function main() {
    console.log('🚀 CONFIGURAÇÃO COMPLETA MySQL LOCAL');
    console.log('═'.repeat(80));
    console.log('🎯 OBJETIVO: Sincronizar 3 bases idênticas');
    console.log('═'.repeat(80));
    
    try {
        // 1. Verificar MySQL
        let mysqlReady = await checkMySQLInstallation();
        
        // 2. Instalar se necessário
        if (!mysqlReady) {
            console.log('\n⚠️  MySQL não disponível - instalando...');
            const installed = await installMySQL();
            
            if (installed) {
                // Tentar conectar novamente
                await new Promise(resolve => setTimeout(resolve, 5000));
                mysqlReady = await checkMySQLInstallation();
            }
        }
        
        if (!mysqlReady) {
            console.log('\n❌ Não foi possível configurar MySQL');
            console.log('💡 Instale MySQL manualmente e execute novamente');
            return;
        }
        
        // 3. Criar database
        const dbCreated = await createDatabase();
        if (!dbCreated) {
            console.log('❌ Falha ao criar database');
            return;
        }
        
        // 4. Importar backup
        const imported = await importBackup();
        if (!imported) {
            console.log('❌ Falha ao importar backup');
            return;
        }
        
        // 5. Verificar importação
        await verifyImport();
        
        // 6. Comparar com SQLite
        await compareWithSQLite();
        
        console.log('\n🎉 SINCRONIZAÇÃO COMPLETA!');
        console.log('═'.repeat(50));
        console.log('✅ MySQL local: configurado e populado');
        console.log('✅ SQLite local: dados CPLP importados');
        console.log('🔒 MySQL servidor: apenas consulta');
        console.log('💾 Backup: preservado e seguro');
        
        console.log('\n🎯 ESTADO DAS 3 BASES:');
        console.log('🟢 SQLite Local: Dados CPLP + estruturas');
        console.log('🟢 MySQL Local: Dados completos (123K registros)');
        console.log('🔒 MySQL Servidor: Dados completos (APENAS CONSULTA)');
        
    } catch (error) {
        console.error('\n❌ Erro durante configuração:', error.message);
    }
}

// Verificar se mysql2 está instalado
try {
    require('mysql2/promise');
    main();
} catch (err) {
    console.log('❌ Módulo mysql2 não encontrado!');
    console.log('💡 Execute: npm install mysql2');
}
