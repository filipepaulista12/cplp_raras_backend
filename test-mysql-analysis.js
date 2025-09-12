const mysql = require('mysql2/promise');

async function analyzeMySQL() {
    console.log('\n🔍 TENTANDO CONECTAR NO MYSQL');
    console.log('=' .repeat(50));
    
    // Configurações possíveis do MySQL
    const configs = [
        {
            name: 'MySQL Local (Padrão)',
            config: {
                host: 'localhost',
                user: 'root',
                password: 'password',
                database: 'cplp_raras',
                port: 3306
            }
        },
        {
            name: 'MySQL Local (Sem Senha)',
            config: {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'cplp_raras',
                port: 3306
            }
        },
        {
            name: 'MySQL Local (mysql)',
            config: {
                host: 'localhost',
                user: 'mysql',
                password: 'mysql',
                database: 'cplp_raras',
                port: 3306
            }
        }
    ];

    for (const { name, config } of configs) {
        try {
            console.log(`\n🔌 Testando: ${name}`);
            console.log(`   Host: ${config.host}:${config.port}`);
            console.log(`   Database: ${config.database}`);
            
            const connection = await mysql.createConnection(config);
            console.log(`   ✅ Conectado com sucesso!`);
            
            // Listar tabelas
            const [tables] = await connection.execute("SHOW TABLES");
            console.log(`   📊 Encontradas ${tables.length} tabelas`);
            
            if (tables.length > 0) {
                console.log(`   📋 Tabelas encontradas:`);
                
                for (const table of tables) {
                    const tableName = Object.values(table)[0];
                    try {
                        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                        const count = rows[0].count;
                        console.log(`      • ${tableName}: ${count.toLocaleString()} registros`);
                    } catch (err) {
                        console.log(`      • ${tableName}: ERRO - ${err.message}`);
                    }
                }
            }
            
            await connection.end();
            return { success: true, name, tables: tables.length };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            if (error.code === 'ECONNREFUSED') {
                console.log(`   💡 MySQL não está rodando ou inacessível`);
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log(`   💡 Credenciais incorretas`);
            } else if (error.code === 'ER_BAD_DB_ERROR') {
                console.log(`   💡 Database não existe`);
            }
        }
    }
    
    return { success: false };
}

// Verificar se mysql2 está instalado
async function checkMySQLModule() {
    try {
        require('mysql2/promise');
        return true;
    } catch (err) {
        console.log('\n⚠️  Módulo mysql2 não encontrado. Instalando...');
        return false;
    }
}

async function main() {
    const hasMySQL = await checkMySQLModule();
    
    if (!hasMySQL) {
        console.log('\n💡 Para analisar MySQL, execute: npm install mysql2');
        console.log('   Depois execute novamente este script.');
        return;
    }
    
    const result = await analyzeMySQL();
    
    if (!result.success) {
        console.log('\n❌ Não foi possível conectar no MySQL');
        console.log('💡 Verifique se:');
        console.log('   • MySQL está instalado e rodando');
        console.log('   • Credenciais estão corretas');
        console.log('   • Database "cplp_raras" existe');
        console.log('\n🔧 Para configurar MySQL, execute:');
        console.log('   npm run setup:mysql');
    }
}

main().catch(console.error);
