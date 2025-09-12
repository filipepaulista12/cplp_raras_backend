/**
 * 🔍 EXPLORAR SERVIDOR - Descobrir bases disponíveis
 */

const mysql = require('mysql2/promise');

const serverConfig = {
    host: '200.144.254.4',
    user: 'filipe',
    password: 'IamSexyAndIKnowIt#2025(*',
    port: 3306,
    connectTimeout: 30000
};

async function explorarServidor() {
    console.log('🔍 EXPLORANDO SERVIDOR...');
    
    let conn;
    
    try {
        // Conectar SEM especificar database
        conn = await mysql.createConnection(serverConfig);
        console.log('✅ CONECTADO NO SERVIDOR!');
        
        // Listar todas as databases
        console.log('\n📊 DATABASES DISPONÍVEIS:');
        const [databases] = await conn.execute('SHOW DATABASES');
        
        for (let db of databases) {
            const dbName = Object.values(db)[0];
            console.log(`   📂 ${dbName}`);
        }
        
        // Verificar se existe cplp_raras ou similar
        const cplpDbs = databases.filter(db => {
            const name = Object.values(db)[0].toLowerCase();
            return name.includes('cplp') || name.includes('raras');
        });
        
        if (cplpDbs.length > 0) {
            console.log('\n🎯 DATABASES CPLP/RARAS ENCONTRADAS:');
            for (let db of cplpDbs) {
                const dbName = Object.values(db)[0];
                console.log(`   ✅ ${dbName}`);
                
                // Ver tabelas desta database
                await conn.execute(`USE ${dbName}`);
                const [tables] = await conn.execute('SHOW TABLES');
                console.log(`      📋 Tabelas: ${tables.length}`);
                
                for (let table of tables.slice(0, 5)) { // Só primeiras 5
                    const tableName = Object.values(table)[0];
                    const [count] = await conn.execute(`SELECT COUNT(*) as c FROM ${tableName}`);
                    console.log(`         📊 ${tableName}: ${count[0].c.toLocaleString()}`);
                }
                
                if (tables.length > 5) {
                    console.log(`         ... e mais ${tables.length - 5} tabelas`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ ERRO:', error.message);
    } finally {
        if (conn) await conn.end();
    }
}

explorarServidor();
