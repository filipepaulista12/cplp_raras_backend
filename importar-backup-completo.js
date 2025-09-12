const fs = require('fs').promises;
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

console.log('🔥 IMPORTAÇÃO COMPLETA DO BACKUP SERVIDOR');
console.log('📦 Backup: 30.23MB com 123.607 registros científicos');
console.log('═'.repeat(55));

async function importarBackupCompleto() {
    let mysqlConn;
    const prisma = new PrismaClient();
    
    try {
        console.log('📂 Carregando backup do servidor...');
        const backupPath = 'database/Dump20250903.sql';
        
        // Verificar se backup existe
        try {
            const stats = await fs.stat(backupPath);
            console.log(`✅ Backup encontrado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } catch (error) {
            console.log('❌ Backup não encontrado em database/Dump20250903.sql');
            return;
        }
        
        // Conectar MySQL
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            multipleStatements: true
        });
        
        console.log('✅ MySQL conectado');
        
        // Recriar database limpa
        console.log('\n🗑️ Limpando database antiga...');
        await mysqlConn.execute('DROP DATABASE IF EXISTS cplp_raras');
        await mysqlConn.execute('CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        await mysqlConn.execute('USE cplp_raras');
        console.log('✅ Database recriado');
        
        // Ler backup SQL
        console.log('\n📖 Lendo arquivo SQL...');
        const backupSQL = await fs.readFile(backupPath, 'utf8');
        console.log(`📊 Tamanho: ${(backupSQL.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Processar SQL em chunks menores
        console.log('\n⚡ Processando SQL em partes...');
        
        // Dividir por statements
        const statements = backupSQL.split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0)
            .filter(stmt => !stmt.startsWith('--'))
            .filter(stmt => !stmt.startsWith('/*'));
        
        console.log(`🔢 Total de comandos SQL: ${statements.length.toLocaleString()}`);
        
        let executed = 0;
        let errors = 0;
        let createTables = 0;
        let inserts = 0;
        
        console.log('\n🚀 Executando importação...');
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            
            try {
                if (stmt.trim()) {
                    await mysqlConn.execute(stmt + ';');
                    executed++;
                    
                    // Contar tipos de comando
                    if (stmt.toUpperCase().includes('CREATE TABLE')) {
                        createTables++;
                    } else if (stmt.toUpperCase().includes('INSERT INTO')) {
                        inserts++;
                    }
                    
                    // Progresso a cada 1000 comandos
                    if (executed % 1000 === 0) {
                        const progress = ((i / statements.length) * 100).toFixed(1);
                        console.log(`   ⚡ Progresso: ${progress}% (${executed}/${statements.length})`);
                    }
                }
            } catch (error) {
                errors++;
                if (errors <= 5) { // Mostrar apenas primeiros 5 erros
                    console.log(`   ⚠️ Erro: ${error.message.substring(0, 80)}...`);
                }
            }
        }
        
        console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
        console.log('─'.repeat(35));
        console.log(`✅ Comandos executados: ${executed.toLocaleString()}`);
        console.log(`🏗️ Tabelas criadas: ${createTables}`);
        console.log(`📥 Inserções: ${inserts.toLocaleString()}`);
        console.log(`⚠️ Erros: ${errors}`);
        
        // Verificar tabelas criadas
        console.log('\n📋 VERIFICANDO TABELAS IMPORTADAS:');
        console.log('─'.repeat(40));
        
        const [tables] = await mysqlConn.execute('SHOW TABLES');
        console.log(`📊 Total de tabelas: ${tables.length}`);
        
        // Contar registros nas principais tabelas
        const mainTables = [
            'cplp_countries', 'hpo_terms', 'rare_diseases', 
            'orphanet_diseases', 'gard_diseases', 'drugbank_drugs',
            'country_statistics', 'disease_phenotypes'
        ];
        
        let totalRecords = 0;
        
        for (const table of mainTables) {
            try {
                const [count] = await mysqlConn.execute(`SELECT COUNT(*) as total FROM ${table}`);
                const records = count[0].total;
                totalRecords += records;
                console.log(`✅ ${table}: ${records.toLocaleString()} registros`);
            } catch (error) {
                console.log(`❌ ${table}: não existe ou erro`);
            }
        }
        
        console.log(`\n📈 TOTAL DE REGISTROS: ${totalRecords.toLocaleString()}`);
        
        // Verificar se chegou próximo aos 123.607 registros esperados
        if (totalRecords > 100000) {
            console.log('🎯 ✅ IMPORTAÇÃO COMPLETA - Dados científicos carregados!');
        } else if (totalRecords > 10000) {
            console.log('🎯 ⚠️ IMPORTAÇÃO PARCIAL - Alguns dados carregados');
        } else {
            console.log('🎯 ❌ IMPORTAÇÃO LIMITADA - Poucos dados carregados');
        }
        
        console.log('\n🔗 PRÓXIMO PASSO:');
        console.log('─'.repeat(25));
        console.log('Sincronizar dados do MySQL para Prisma/SQLite');
        console.log('Comando: node sincronizar-mysql-para-prisma.js');
        
    } catch (error) {
        console.error('❌ Erro na importação:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

importarBackupCompleto();
