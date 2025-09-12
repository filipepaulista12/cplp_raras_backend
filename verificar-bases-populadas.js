/**
 * VERIFICAÇÃO SIMPLES: Bases locais populadas?
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const fs = require('fs');

const prisma = new PrismaClient();

async function verificarBasesPopuladas() {
    console.log('📊 AS BASES LOCAIS ESTÃO POPULADAS?');
    console.log('=' + '='.repeat(40));
    
    try {
        // 1. Prisma (SQLite)
        console.log('\n📋 PRISMA (SQLite):');
        const cplp = await prisma.cplpCountry.count();
        const hpo = await prisma.hpOTerm.count();
        const disease = await prisma.rareDisease.count();
        const prismaTotal = cplp + hpo + disease;
        
        console.log(`   📍 CPLP Countries: ${cplp}`);
        console.log(`   🧬 HPO Terms: ${hpo}`);
        console.log(`   🏥 Rare Diseases: ${disease}`);
        console.log(`   📊 TOTAL PRISMA: ${prismaTotal}`);
        
        // 2. MySQL
        console.log('\n📋 MYSQL:');
        try {
            const mysqlConn = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'cplp_raras'
            });
            
            const [tables] = await mysqlConn.execute('SHOW TABLES');
            console.log(`   📋 Tabelas criadas: ${tables.length}`);
            
            // Verificar principais tabelas
            let mysqlTotal = 0;
            const mainTables = [
                'cplp_countries',
                'hpo_terms', 
                'drug_interactions',
                'orpha_diseases',
                'orpha_classifications'
            ];
            
            for (let tableName of mainTables) {
                try {
                    const [count] = await mysqlConn.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
                    const records = count[0].c;
                    mysqlTotal += records;
                    const status = records > 0 ? '✅' : '⚪';
                    console.log(`   ${status} ${tableName}: ${records.toLocaleString()}`);
                } catch (e) {
                    console.log(`   ❌ ${tableName}: não existe`);
                }
            }
            
            console.log(`   📊 TOTAL MYSQL: ${mysqlTotal.toLocaleString()}`);
            await mysqlConn.end();
            
        } catch (e) {
            console.log('   ❌ MySQL não conectou ou não configurado');
        }
        
        // 3. Backup original
        console.log('\n📂 BACKUP ORIGINAL:');
        try {
            const backupPath = './database/Dump20250903.sql';
            const stats = fs.statSync(backupPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
            console.log(`   📄 Arquivo: ${sizeMB}MB`);
            console.log(`   📊 Estimativa: ~123.607 registros`);
        } catch (e) {
            console.log('   ❌ Backup não encontrado');
        }
        
        // 4. Análise final
        console.log('\n🎯 ANÁLISE:');
        console.log('-'.repeat(30));
        
        const prismaPopulado = prismaTotal > 20;
        const mysqlPopulado = mysqlTotal > 100;
        
        if (prismaPopulado && mysqlPopulado) {
            console.log('✅ AMBAS AS BASES ESTÃO POPULADAS');
            console.log(`   📊 Prisma: ${prismaTotal} registros`);
            console.log(`   📊 MySQL: ${mysqlTotal.toLocaleString()} registros`);
            
            if (mysqlTotal > 10000) {
                console.log('🎉 MySQL tem dados científicos substanciais!');
            } else if (mysqlTotal > 100) {
                console.log('✅ MySQL tem dados básicos importados');
            }
            
        } else {
            console.log('⚠️  NEM TODAS AS BASES ESTÃO POPULADAS:');
            console.log(`   Prisma: ${prismaPopulado ? '✅' : '❌'} (${prismaTotal} registros)`);
            console.log(`   MySQL: ${mysqlPopulado ? '✅' : '❌'} (${mysqlTotal} registros)`);
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarBasesPopuladas();
