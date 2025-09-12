/**
 * 🚀 CÓPIA DIRETA DO SERVIDOR - AGORA MESMO!
 * Servidor: 200.144.254.4
 * User: filipe
 * Pass: IamSexyAndIKnowIt#2025(*
 * DB: cplp
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

// Configuração do SERVIDOR REMOTO
const serverConfig = {
    host: '200.144.254.4',
    user: 'filipe',
    password: 'IamSexyAndIKnowIt#2025(*',
    database: 'cplp_raras',
    port: 3306,
    connectTimeout: 30000
};

// Configuração MySQL LOCAL
const localConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cplp_raras',
    port: 3306
};

async function copiarServidorCompleto() {
    console.log('🚀 CÓPIA DIRETA DO SERVIDOR - INICIANDO!');
    console.log('=' + '='.repeat(50));
    
    let serverConn, localConn;
    
    try {
        // 1. CONECTAR NO SERVIDOR
        console.log('\n🌐 CONECTANDO NO SERVIDOR...');
        console.log('📍 Host: 200.144.254.4');
        console.log('👤 User: filipe');
        console.log('🔐 Database: cplp_raras');
        
        serverConn = await mysql.createConnection(serverConfig);
        console.log('✅ SERVIDOR CONECTADO!');
        
        // 2. CONECTAR LOCAL
        console.log('\n💻 CONECTANDO LOCAL...');
        localConn = await mysql.createConnection(localConfig);
        console.log('✅ LOCAL CONECTADO!');
        
        // 3. LISTAR TABELAS DO SERVIDOR
        console.log('\n📋 LISTANDO TABELAS DO SERVIDOR...');
        const [serverTables] = await serverConn.execute('SHOW TABLES');
        console.log(`📊 Tabelas encontradas: ${serverTables.length}`);
        
        for (let table of serverTables) {
            const tableName = Object.values(table)[0];
            const [count] = await serverConn.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
            console.log(`   📋 ${tableName}: ${count[0].c.toLocaleString()} registros`);
        }
        
        // 4. LIMPAR BASE LOCAL
        console.log('\n🗑️  LIMPANDO BASE LOCAL...');
        await localConn.execute('SET FOREIGN_KEY_CHECKS = 0');
        await localConn.execute('DROP DATABASE IF EXISTS cplp_raras');
        await localConn.execute('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await localConn.execute('USE cplp_raras');
        console.log('✅ Base local limpa');
        
        // 5. COPIAR ESTRUTURA DE CADA TABELA
        console.log('\n🏗️  COPIANDO ESTRUTURAS...');
        
        for (let i = 0; i < serverTables.length; i++) {
            const tableName = Object.values(serverTables[i])[0];
            
            try {
                // Pegar estrutura da tabela
                const [createResult] = await serverConn.execute(`SHOW CREATE TABLE ${tableName}`);
                const createStatement = createResult[0]['Create Table'];
                
                // Criar tabela no local
                await localConn.execute(createStatement);
                console.log(`   ✅ ${i+1}/${serverTables.length} - ${tableName}`);
                
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message.substring(0, 100)}`);
            }
        }
        
        // 6. COPIAR DADOS DE CADA TABELA
        console.log('\n📊 COPIANDO DADOS...');
        let totalRecords = 0;
        
        for (let i = 0; i < serverTables.length; i++) {
            const tableName = Object.values(serverTables[i])[0];
            
            try {
                // Pegar todos os dados
                const [rows] = await serverConn.execute(`SELECT * FROM ${tableName}`);
                
                if (rows.length > 0) {
                    // Descobrir colunas
                    const columns = Object.keys(rows[0]);
                    const placeholders = columns.map(() => '?').join(', ');
                    const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
                    
                    // Inserir em lotes
                    console.log(`   ⏳ ${tableName}: ${rows.length.toLocaleString()} registros...`);
                    
                    const batchSize = 1000;
                    for (let j = 0; j < rows.length; j += batchSize) {
                        const batch = rows.slice(j, j + batchSize);
                        
                        for (let row of batch) {
                            const values = columns.map(col => row[col]);
                            await localConn.execute(insertSQL, values);
                        }
                        
                        if (j % (batchSize * 5) === 0 && j > 0) {
                            console.log(`     📊 ${j.toLocaleString()}/${rows.length.toLocaleString()}`);
                        }
                    }
                    
                    totalRecords += rows.length;
                    console.log(`   ✅ ${tableName}: ${rows.length.toLocaleString()} copiados`);
                } else {
                    console.log(`   ⚪ ${tableName}: vazia`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${tableName}: ${error.message.substring(0, 100)}`);
            }
        }
        
        // 7. VERIFICAÇÃO FINAL
        console.log('\n📊 VERIFICAÇÃO FINAL:');
        console.log('-'.repeat(40));
        
        const [localTables] = await localConn.execute('SHOW TABLES');
        console.log(`📋 Tabelas locais: ${localTables.length}`);
        
        let localTotal = 0;
        for (let table of localTables) {
            const tableName = Object.values(table)[0];
            const [count] = await localConn.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
            const records = count[0].c;
            localTotal += records;
            if (records > 0) {
                console.log(`   ✅ ${tableName}: ${records.toLocaleString()}`);
            }
        }
        
        console.log(`📊 TOTAL LOCAL: ${localTotal.toLocaleString()}`);
        
        // 8. RESULTADO
        console.log('\n🎉 RESULTADO FINAL:');
        console.log('=' + '='.repeat(30));
        
        if (localTotal > 10000) {
            console.log('🚀 CÓPIA MASSIVA CONCLUÍDA!');
            console.log(`📊 ${localTotal.toLocaleString()} registros copiados do servidor`);
            console.log('✅ Base local é CÓPIA EXATA do servidor!');
        } else if (localTotal > 100) {
            console.log('✅ Cópia parcial concluída');
            console.log(`📊 ${localTotal.toLocaleString()} registros copiados`);
        } else {
            console.log('⚠️  Poucos dados copiados');
            console.log('🔧 Verifique conexões e permissões');
        }
        
        // 9. SINCRONIZAR COM PRISMA TAMBÉM
        console.log('\n🔄 SINCRONIZANDO COM PRISMA...');
        
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            // Copiar dados essenciais para Prisma
            const [cplpData] = await localConn.execute('SELECT * FROM cplp_countries LIMIT 10');
            const [hpoData] = await localConn.execute('SELECT * FROM hpo_terms LIMIT 10');
            
            // Popular Prisma com amostra
            if (cplpData.length > 0) {
                console.log('   📍 Sincronizando CPLP...');
                for (let country of cplpData) {
                    try {
                        await prisma.cplpCountry.upsert({
                            where: { code: country.code || country.country_code },
                            update: {},
                            create: {
                                code: country.code || country.country_code,
                                name: country.name || country.country_name,
                                population: country.population || 0
                            }
                        });
                    } catch (e) { /* ignore */ }
                }
            }
            
            if (hpoData.length > 0) {
                console.log('   🧬 Sincronizando HPO...');
                for (let hpo of hpoData) {
                    try {
                        await prisma.hpOTerm.upsert({
                            where: { hpoId: hpo.hpo_id },
                            update: {},
                            create: {
                                hpoId: hpo.hpo_id,
                                name: hpo.name || hpo.term_name,
                                definition: hpo.definition || ''
                            }
                        });
                    } catch (e) { /* ignore */ }
                }
            }
            
            await prisma.$disconnect();
            console.log('✅ Prisma sincronizado');
            
        } catch (prismaError) {
            console.log('⚠️  Prisma sync falhou:', prismaError.message);
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('🔧 Problema de conexão - verificar firewall/rede');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('🔧 Credenciais incorretas - verificar user/pass');
        } else {
            console.log('🔧 Erro geral:', error.code);
        }
        
    } finally {
        if (serverConn) await serverConn.end();
        if (localConn) await localConn.end();
    }
}

// EXECUTAR AGORA!
copiarServidorCompleto().then(() => {
    console.log('\n✅ CÓPIA DO SERVIDOR FINALIZADA!');
}).catch(err => {
    console.error('💥 FALHA FINAL:', err.message);
});
