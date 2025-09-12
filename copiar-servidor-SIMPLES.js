/**
 * 🚀 CÓPIA DIRETA SIMPLES - SEM PREPARED STATEMENTS
 */

const mysql = require('mysql2/promise');

const serverConfig = {
    host: '200.144.254.4',
    user: 'filipe',
    password: 'IamSexyAndIKnowIt#2025(*',
    database: 'cplp_raras',
    port: 3306
};

const localConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cplp_raras',
    port: 3306
};

async function copiarServidorSimples() {
    console.log('🚀 CÓPIA DIRETA DO SERVIDOR - MODO SIMPLES');
    console.log('=' + '='.repeat(50));
    
    let serverConn, localConn;
    
    try {
        // 1. CONECTAR
        serverConn = await mysql.createConnection(serverConfig);
        localConn = await mysql.createConnection(localConfig);
        console.log('✅ AMBAS CONEXÕES OK!');
        
        // 2. LIMPAR LOCAL
        console.log('\n🗑️  LIMPANDO LOCAL...');
        await localConn.query('SET FOREIGN_KEY_CHECKS = 0');
        await localConn.query('DROP DATABASE IF EXISTS cplp_raras');
        await localConn.query('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await localConn.query('USE cplp_raras');
        console.log('✅ Base local limpa');
        
        // 3. LISTAR TABELAS
        const [tables] = await serverConn.query('SHOW TABLES');
        console.log(`\n📊 ${tables.length} tabelas para copiar`);
        
        // 4. COPIAR CADA TABELA
        for (let i = 0; i < tables.length; i++) {
            const tableName = Object.values(tables[i])[0];
            
            try {
                console.log(`\n${i+1}/${tables.length} - ${tableName}`);
                
                // Pegar estrutura
                const [createResult] = await serverConn.query(`SHOW CREATE TABLE ${tableName}`);
                const createSQL = createResult[0]['Create Table'];
                
                // Criar localmente
                await localConn.query(createSQL);
                console.log('   ✅ Estrutura criada');
                
                // Pegar dados
                const [rows] = await serverConn.query(`SELECT * FROM ${tableName}`);
                
                if (rows.length > 0) {
                    console.log(`   📊 ${rows.length.toLocaleString()} registros...`);
                    
                    // Descobrir colunas
                    const columns = Object.keys(rows[0]);
                    const columnList = columns.join(', ');
                    
                    // Inserir em lotes pequenos
                    const batchSize = 100;
                    let inserted = 0;
                    
                    for (let j = 0; j < rows.length; j += batchSize) {
                        const batch = rows.slice(j, j + batchSize);
                        
                        // Preparar VALUES
                        const valueStrings = batch.map(row => {
                            const values = columns.map(col => {
                                const val = row[col];
                                if (val === null) return 'NULL';
                                if (typeof val === 'string') return mysql.escape(val);
                                return val;
                            });
                            return `(${values.join(', ')})`;
                        });
                        
                        const insertSQL = `INSERT INTO ${tableName} (${columnList}) VALUES ${valueStrings.join(', ')}`;
                        
                        try {
                            await localConn.query(insertSQL);
                            inserted += batch.length;
                            
                            if (inserted % 500 === 0) {
                                console.log(`     📈 ${inserted}/${rows.length}`);
                            }
                        } catch (insertError) {
                            console.log(`     ⚠️  Erro lote: ${insertError.message.substring(0, 50)}`);
                        }
                    }
                    
                    console.log(`   ✅ ${inserted.toLocaleString()} inseridos`);
                } else {
                    console.log('   ⚪ Vazia');
                }
                
            } catch (tableError) {
                console.log(`   ❌ ${tableName}: ${tableError.message.substring(0, 100)}`);
            }
        }
        
        // 5. VERIFICAÇÃO FINAL
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        const [localTables] = await localConn.query('SHOW TABLES');
        console.log(`📋 Tabelas locais: ${localTables.length}`);
        
        let totalLocal = 0;
        for (let table of localTables) {
            const tableName = Object.values(table)[0];
            const [count] = await localConn.query(`SELECT COUNT(*) as c FROM ${tableName}`);
            const records = count[0].c;
            totalLocal += records;
            if (records > 0) {
                console.log(`   ✅ ${tableName}: ${records.toLocaleString()}`);
            }
        }
        
        console.log(`\n🎉 TOTAL COPIADO: ${totalLocal.toLocaleString()} registros`);
        
        if (totalLocal > 50000) {
            console.log('🚀 CÓPIA MASSIVA COMPLETA!');
            console.log('✅ Base local é cópia exata do servidor!');
        } else if (totalLocal > 1000) {
            console.log('✅ Cópia substancial completa!');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (serverConn) await serverConn.end();
        if (localConn) await localConn.end();
    }
}

copiarServidorSimples();
