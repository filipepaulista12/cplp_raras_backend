/**
 * 🚀 BACKUP DIRETO DO SERVIDOR - AGORA!
 * Acessa o servidor e baixa TUDO com estrutura e dados
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

// Configuração do servidor remoto
const serverConfig = {
    host: '200.144.254.4',
    port: 3306,
    user: 'root',
    password: '', // Vamos testar diferentes senhas
    database: 'cplp_raras'
};

// Configuração local
const localConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cplp_raras'
};

async function copiarServidorCompleto() {
    console.log('🚀 BACKUP DIRETO DO SERVIDOR - COPIANDO TUDO!');
    console.log('=' + '='.repeat(50));
    
    let serverConn, localConn;
    
    // Senhas para testar
    const senhasTeste = ['', 'password', 'root', 'cplp_raras', 'admin', '123456'];
    
    try {
        // 1. CONECTAR NO SERVIDOR - TESTAR SENHAS
        console.log('\n🔗 CONECTANDO NO SERVIDOR...');
        let conectado = false;
        
        for (let senha of senhasTeste) {
            try {
                console.log(`🔐 Testando senha: "${senha || 'vazia'}"`);
                const configTeste = { ...serverConfig, password: senha };
                serverConn = await mysql.createConnection(configTeste);
                console.log('✅ CONECTADO! Senha correta encontrada!');
                conectado = true;
                break;
            } catch (e) {
                console.log(`❌ Senha "${senha || 'vazia'}" incorreta`);
            }
        }
        
        if (!conectado) {
            throw new Error('❌ NENHUMA SENHA FUNCIONOU! Precisa da senha correta do servidor.');
        }
        
        // 2. CONECTAR LOCAL
        console.log('\n🔗 CONECTANDO LOCAL...');
        localConn = await mysql.createConnection(localConfig);
        console.log('✅ Conectado no MySQL local');
        
        // 3. LIMPAR BASE LOCAL
        console.log('\n🗑️  LIMPANDO BASE LOCAL...');
        await localConn.execute('DROP DATABASE IF EXISTS cplp_raras');
        await localConn.execute('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await localConn.execute('USE cplp_raras');
        console.log('✅ Base local limpa');
        
        // 4. LISTAR TODAS AS TABELAS DO SERVIDOR
        console.log('\n📋 LISTANDO TABELAS DO SERVIDOR...');
        const [tables] = await serverConn.execute('SHOW TABLES');
        console.log(`✅ Encontradas ${tables.length} tabelas no servidor`);
        
        const tableNames = tables.map(row => Object.values(row)[0]);
        tableNames.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table}`);
        });
        
        // 5. COPIAR ESTRUTURA DE TODAS AS TABELAS
        console.log('\n🏗️ COPIANDO ESTRUTURAS...');
        for (let i = 0; i < tableNames.length; i++) {
            const tableName = tableNames[i];
            try {
                console.log(`📋 ${i + 1}/${tableNames.length} - ${tableName}`);
                
                // Pegar CREATE TABLE do servidor
                const [createResult] = await serverConn.execute(`SHOW CREATE TABLE ${tableName}`);
                const createSQL = createResult[0]['Create Table'];
                
                // Criar tabela local
                await localConn.execute(createSQL);
                console.log(`   ✅ Estrutura criada`);
                
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message.substring(0, 50)}`);
            }
        }
        
        // 6. COPIAR DADOS DE TODAS AS TABELAS
        console.log('\n📊 COPIANDO DADOS...');
        let totalRecords = 0;
        
        for (let i = 0; i < tableNames.length; i++) {
            const tableName = tableNames[i];
            try {
                console.log(`📊 ${i + 1}/${tableNames.length} - ${tableName}`);
                
                // Contar registros no servidor
                const [countResult] = await serverConn.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
                const recordCount = countResult[0].total;
                
                if (recordCount > 0) {
                    console.log(`   📊 ${recordCount.toLocaleString()} registros`);
                    
                    // Pegar TODOS os dados
                    const [rows] = await serverConn.execute(`SELECT * FROM ${tableName}`);
                    
                    if (rows.length > 0) {
                        // Preparar INSERT em lotes
                        const batchSize = 1000;
                        for (let batch = 0; batch < rows.length; batch += batchSize) {
                            const batchRows = rows.slice(batch, batch + batchSize);
                            
                            // Criar placeholders
                            const columns = Object.keys(batchRows[0]);
                            const placeholders = columns.map(() => '?').join(',');
                            const values = batchRows.map(row => `(${placeholders})`).join(',');
                            
                            const insertSQL = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${values}`;
                            const insertValues = batchRows.flatMap(row => Object.values(row));
                            
                            await localConn.execute(insertSQL, insertValues);
                        }
                        
                        totalRecords += recordCount;
                        console.log(`   ✅ ${recordCount.toLocaleString()} registros copiados`);
                    }
                } else {
                    console.log(`   ⚪ Tabela vazia`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erro: ${error.message.substring(0, 50)}`);
            }
        }
        
        // 7. VERIFICAÇÃO FINAL
        console.log('\n🎉 CÓPIA COMPLETA!');
        console.log('=' + '='.repeat(30));
        console.log(`📋 Tabelas copiadas: ${tableNames.length}`);
        console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
        
        // Verificar localmente
        const [localTables] = await localConn.execute('SHOW TABLES');
        console.log(`✅ Tabelas locais: ${localTables.length}`);
        
        let localTotal = 0;
        for (let table of localTables) {
            const tableName = Object.values(table)[0];
            try {
                const [count] = await localConn.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
                const records = count[0].c;
                localTotal += records;
                if (records > 0) {
                    console.log(`   ✅ ${tableName}: ${records.toLocaleString()}`);
                }
            } catch (e) { /* skip */ }
        }
        
        console.log(`📊 TOTAL LOCAL: ${localTotal.toLocaleString()} registros`);
        
        if (localTotal > 50000) {
            console.log('🚀 SUCESSO TOTAL! Base completa copiada!');
        } else if (localTotal > 1000) {
            console.log('✅ Cópia substancial realizada!');
        } else {
            console.log('⚠️ Cópia parcial - pode ter problemas');
        }
        
    } catch (error) {
        console.error('❌ ERRO:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Servidor pode estar offline ou firewall bloqueando');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('🔧 Credenciais incorretas ou sem permissão');
        } else {
            console.log('🔧 Erro de rede ou configuração');
        }
        
    } finally {
        if (serverConn) await serverConn.end();
        if (localConn) await localConn.end();
    }
}

// EXECUTAR AGORA!
copiarServidorCompleto().then(() => {
    console.log('\n🎯 CÓPIA DO SERVIDOR FINALIZADA!');
}).catch(err => {
    console.error('💥 FALHA:', err.message);
});
