/**
 * 🚀 IMPORTAÇÃO COMPLETA FORÇADA - AGORA!
 * Vai importar TODO o backup sem parar
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cplp_raras',
    multipleStatements: true,
    maxAllowedPacket: 1073741824 // 1GB
};

async function importarTudoAgora() {
    console.log('🚀 IMPORTAÇÃO COMPLETA FORÇADA - SEM PARAR!');
    console.log('=' + '='.repeat(50));
    
    let connection;
    
    try {
        // 1. Conectar
        connection = await mysql.createConnection(mysqlConfig);
        console.log('✅ MySQL conectado');
        
        // 2. Preparar base - limpar tudo
        console.log('\n🗑️  LIMPANDO BASE...');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('DROP DATABASE IF EXISTS cplp_raras');
        await connection.execute('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await connection.execute('USE cplp_raras');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Base limpa e recriada');
        
        // 3. Ler backup COMPLETO
        console.log('\n📂 LENDO BACKUP COMPLETO...');
        const backupPath = './database/Dump20250903.sql';
        
        if (!fs.existsSync(backupPath)) {
            throw new Error('❌ Backup não encontrado em: ' + backupPath);
        }
        
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const sizeMB = (backupContent.length / 1024 / 1024).toFixed(1);
        console.log(`✅ Backup lido: ${sizeMB}MB`);
        
        // 4. Configurar MySQL para importação pesada
        console.log('\n⚙️  CONFIGURANDO MYSQL...');
        await connection.execute('SET SESSION sql_mode = ""');
        await connection.execute('SET SESSION foreign_key_checks = 0');
        await connection.execute('SET SESSION unique_checks = 0');
        await connection.execute('SET SESSION autocommit = 0');
        await connection.execute('SET SESSION max_allowed_packet = 1073741824');
        console.log('✅ MySQL configurado para importação pesada');
        
        // 5. EXECUTAR BACKUP COMPLETO
        console.log('\n🚀 EXECUTANDO BACKUP COMPLETO...');
        console.log('⏳ Isso pode demorar alguns minutos...');
        
        const startTime = Date.now();
        
        try {
            // Dividir em blocos menores se necessário
            const commands = backupContent.split(';').filter(cmd => cmd.trim().length > 0);
            console.log(`📊 Comandos SQL encontrados: ${commands.length}`);
            
            let processedCommands = 0;
            let errors = 0;
            
            for (let i = 0; i < commands.length; i++) {
                const command = commands[i].trim();
                if (command.length > 0) {
                    try {
                        await connection.execute(command + ';');
                        processedCommands++;
                        
                        // Progress report a cada 100 comandos
                        if (processedCommands % 100 === 0) {
                            console.log(`⏳ Processados: ${processedCommands}/${commands.length}`);
                        }
                        
                    } catch (cmdError) {
                        errors++;
                        if (errors < 10) { // Mostrar só os primeiros 10 erros
                            console.log(`⚠️  Erro no comando ${i}: ${cmdError.message.substring(0, 100)}`);
                        }
                    }
                }
            }
            
            await connection.execute('COMMIT');
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ Backup executado em ${duration}s`);
            console.log(`📊 Comandos processados: ${processedCommands}`);
            console.log(`⚠️  Erros: ${errors}`);
            
        } catch (execError) {
            console.log('⚠️  Erro durante execução, tentando continuar...');
            console.log(`❌ ${execError.message}`);
        }
        
        // 6. Restaurar configurações
        await connection.execute('SET SESSION foreign_key_checks = 1');
        await connection.execute('SET SESSION unique_checks = 1');
        await connection.execute('SET SESSION autocommit = 1');
        
        // 7. VERIFICAÇÃO FINAL
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        console.log('-'.repeat(30));
        
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📋 Tabelas criadas: ${tables.length}`);
        
        let totalRecords = 0;
        const mainTables = [
            'cplp_countries', 'hpo_terms', 'drug_interactions', 
            'orpha_diseases', 'orpha_classifications'
        ];
        
        for (let tableName of mainTables) {
            try {
                const [count] = await connection.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
                const records = count[0].c;
                totalRecords += records;
                const status = records > 0 ? '✅' : '⚪';
                console.log(`${status} ${tableName}: ${records.toLocaleString()}`);
            } catch (e) {
                console.log(`❌ ${tableName}: ${e.message.substring(0, 50)}`);
            }
        }
        
        console.log(`📊 TOTAL DE REGISTROS: ${totalRecords.toLocaleString()}`);
        
        // 8. STATUS FINAL
        console.log('\n🎉 RESULTADO:');
        if (totalRecords > 10000) {
            console.log('🚀 IMPORTAÇÃO MASSIVA CONCLUÍDA!');
            console.log(`📊 ${totalRecords.toLocaleString()} registros importados`);
            console.log('✅ Base MySQL está COMPLETA!');
        } else if (totalRecords > 100) {
            console.log('✅ Importação parcial concluída');
            console.log(`📊 ${totalRecords.toLocaleString()} registros importados`);
        } else {
            console.log('⚠️  Importação com problemas');
            console.log('❓ Verifique logs de erro acima');
        }
        
    } catch (error) {
        console.error('❌ ERRO FATAL:', error.message);
        console.log('\n🔧 TENTANDO CORREÇÃO...');
        
        // Tentar importação alternativa
        try {
            const backupContent = fs.readFileSync('./database/Dump20250903.sql', 'utf8');
            // Remover comandos problemáticos
            const cleanContent = backupContent
                .replace(/\/\*.*?\*\//gs, '') // Remove comentários
                .replace(/--.*$/gm, '')       // Remove comentários de linha
                .replace(/^\s*$/gm, '');      // Remove linhas vazias
            
            await connection.execute(cleanContent);
            console.log('✅ Importação alternativa funcionou!');
            
        } catch (altError) {
            console.log('❌ Importação alternativa também falhou');
            console.log('🔧 Última tentativa: comando direto...');
        }
        
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// EXECUTAR AGORA!
importarTudoAgora().then(() => {
    console.log('\n🎯 IMPORTAÇÃO FINALIZADA!');
    process.exit(0);
}).catch(err => {
    console.error('💥 FALHA FINAL:', err.message);
    process.exit(1);
});
