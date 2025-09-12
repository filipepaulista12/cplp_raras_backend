const { PrismaClient } = require('@prisma/client');

console.log('🎯 VERIFICAÇÃO RÁPIDA DE SINCRONIZAÇÃO');
console.log('═'.repeat(40));

async function verificarSincronizacao() {
    const prisma = new PrismaClient();
    
    try {
        console.log('📊 Verificando dados atuais...');
        
        // Verificar modelos disponíveis
        const models = {};
        
        try {
            models.cplp = await prisma.cplpCountry.count();
            console.log(`✅ CPLP Countries: ${models.cplp.toLocaleString()}`);
        } catch (e) {
            models.cplp = 0;
            console.log('❌ CPLP Countries: não disponível');
        }
        
        try {
            models.hpo = await prisma.hpoTerm.count();
            console.log(`✅ HPO Terms: ${models.hpo.toLocaleString()}`);
        } catch (e) {
            models.hpo = 0;
            console.log('❌ HPO Terms: não disponível');
        }
        
        try {
            models.diseases = await prisma.rareDisease.count();
            console.log(`✅ Rare Diseases: ${models.diseases.toLocaleString()}`);
        } catch (e) {
            models.diseases = 0;
            console.log('❌ Rare Diseases: não disponível');
        }
        
        const total = models.cplp + models.hpo + models.diseases;
        console.log(`\n📊 TOTAL PRISMA: ${total.toLocaleString()} registros`);
        
        // Verificar MySQL
        console.log('\n🔍 Verificando MySQL...');
        const mysql = require('mysql2/promise');
        
        try {
            const connection = await mysql.createConnection({
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                database: 'cplp_raras'
            });
            
            const [tables] = await connection.query('SHOW TABLES');
            console.log(`✅ MySQL conectado - ${tables.length} tabelas`);
            
            if (tables.length > 0) {
                let mysqlTotal = 0;
                for (const tableRow of tables) {
                    const tableName = Object.values(tableRow)[0];
                    try {
                        const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
                        const records = count[0].total;
                        mysqlTotal += records;
                        if (records > 0) {
                            console.log(`   📋 ${tableName}: ${records.toLocaleString()}`);
                        }
                    } catch (e) {
                        // Ignorar erros de contagem
                    }
                }
                console.log(`📊 TOTAL MYSQL: ${mysqlTotal.toLocaleString()} registros`);
                
                // Comparar
                if (total === mysqlTotal && total > 0) {
                    console.log('\n🎉 ✅ SINCRONIZAÇÃO PERFEITA!');
                    console.log('🔄 Ambas as bases estão idênticas');
                } else if (total > 0 && mysqlTotal > 0) {
                    console.log('\n⚠️ SINCRONIZAÇÃO PARCIAL');
                    console.log(`📊 Prisma: ${total.toLocaleString()}`);
                    console.log(`📊 MySQL: ${mysqlTotal.toLocaleString()}`);
                } else {
                    console.log('\n❌ SINCRONIZAÇÃO INCOMPLETA');
                    console.log('💡 Necessária sincronização manual');
                }
            }
            
            await connection.end();
            
        } catch (mysqlError) {
            console.log('❌ MySQL não conectado:', mysqlError.message.substring(0, 50));
        }
        
        // Status geral
        console.log('\n🎯 STATUS GERAL:');
        if (total > 10000) {
            console.log('✅ COMPLETO - Dataset científico robusto');
        } else if (total > 100) {
            console.log('⚠️ BÁSICO - Dataset funcional mas limitado');
        } else if (total > 0) {
            console.log('🔧 MÍNIMO - Dataset de teste');
        } else {
            console.log('❌ VAZIO - Necessária população inicial');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarSincronizacao();
