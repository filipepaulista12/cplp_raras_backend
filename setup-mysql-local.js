const mysql = require('mysql2/promise');

console.log('🔧 CONFIGURAÇÃO E TESTE DO MySQL LOCAL');
console.log('═'.repeat(50));

async function setupMySQLLocal() {
    let connection = null;

    try {
        console.log('🔗 Testando conexão com MySQL local...');
        
        // Configuração de conexão
        const config = {
            host: 'localhost',
            user: 'root',
            password: 'IamSexyAndIKnowIt#2025(*)',
            port: 3306
        };

        // Conectar sem especificar database primeiro
        connection = await mysql.createConnection(config);
        console.log('✅ Conectado ao MySQL local');

        // Verificar versão
        const [version] = await connection.execute('SELECT VERSION() as version');
        console.log(`📊 Versão MySQL: ${version[0].version}`);

        // Criar database se não existir
        console.log('\n🗄️  Criando/verificando database...');
        await connection.execute('CREATE DATABASE IF NOT EXISTS cplp_raras');
        console.log('✅ Database cplp_raras criado/verificado');

        // Verificar databases
        const [databases] = await connection.execute('SHOW DATABASES');
        console.log(`📋 Databases disponíveis: ${databases.length}`);
        databases.forEach(db => {
            const dbName = Object.values(db)[0];
            if (dbName === 'cplp_raras') {
                console.log(`   ✅ ${dbName} (nossa database)`);
            } else {
                console.log(`   • ${dbName}`);
            }
        });

        // Conectar à database específica
        await connection.changeUser({ database: 'cplp_raras' });
        console.log('✅ Conectado à database cplp_raras');

        // Verificar tabelas existentes
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n📊 Tabelas existentes: ${tables.length}`);
        
        if (tables.length > 0) {
            console.log('📋 Tabelas encontradas:');
            for (const table of tables) {
                const tableName = Object.values(table)[0];
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                console.log(`   • ${tableName}: ${count[0].count} registros`);
            }
        } else {
            console.log('📋 Nenhuma tabela encontrada - pronto para importar backup');
        }

        console.log('\n✅ MySQL LOCAL CONFIGURADO E PRONTO!');
        console.log('🚀 Próximo passo: Importar backup completo');

    } catch (error) {
        console.error('❌ Erro na configuração MySQL:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 SOLUÇÕES:');
            console.log('   1. Verificar se MySQL está rodando: Get-Service MySQL80');
            console.log('   2. Iniciar serviço: Start-Service MySQL80');
            console.log('   3. Verificar porta 3306: netstat -an | findstr 3306');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 SOLUÇÕES:');
            console.log('   1. Verificar senha do root');
            console.log('   2. Usar mysql -u root -p para testar manualmente');
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔐 Conexão MySQL fechada');
        }
    }
}

setupMySQLLocal();
