const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configurações do servidor remoto - APENAS CPLP_RARAS
const SERVER_CONFIG = {
    host: '200.144.254.4',
    user: 'filipe',
    password: 'IamSexyAndIKnowIt#2025(*',
    database: 'cplp_raras',
    port: 3306,
    charset: 'utf8mb4'
};

async function analyzeCPLPDatabase() {
    console.log('🔍 ANÁLISE COMPLETA - BASE CPLP_RARAS');
    console.log('═'.repeat(60));
    console.log(`🌐 Host: ${SERVER_CONFIG.host}`);
    console.log(`🗄️  Database: ${SERVER_CONFIG.database}`);
    console.log(`👤 User: ${SERVER_CONFIG.user}`);
    
    let connection;
    
    try {
        // Conectar diretamente na base cplp_raras
        connection = await mysql.createConnection(SERVER_CONFIG);
        console.log('✅ Conectado com sucesso!');
        
        // Listar tabelas
        const [tables] = await connection.query('SHOW TABLES');
        
        console.log(`\n📊 ESTRUTURA DA BASE CPLP_RARAS`);
        console.log('─'.repeat(50));
        console.log(`📋 Total de tabelas: ${tables.length}`);
        
        const tableDetails = [];
        let totalRecords = 0;
        
        // Analisar cada tabela
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            
            try {
                const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
                const count = rows[0].count;
                totalRecords += count;
                
                // Obter uma amostra de dados se tiver registros
                let sample = null;
                if (count > 0) {
                    const [sampleRows] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 3`);
                    sample = sampleRows;
                }
                
                tableDetails.push({ 
                    name: tableName, 
                    count: count,
                    sample: sample 
                });
                
                const status = count > 0 ? '✅' : '⚪';
                console.log(`   ${status} ${tableName}: ${count.toLocaleString()} registros`);
                
            } catch (err) {
                console.log(`   ❌ ${tableName}: ERRO - ${err.message}`);
                tableDetails.push({ name: tableName, count: 'ERRO', error: err.message });
            }
        }
        
        console.log(`\n📈 TOTAL GERAL: ${totalRecords.toLocaleString()} registros`);
        
        // Relatório detalhado das principais tabelas
        console.log('\n🏆 TOP TABELAS COM DADOS:');
        console.log('═'.repeat(80));
        
        const nonEmptyTables = tableDetails
            .filter(t => typeof t.count === 'number' && t.count > 0)
            .sort((a, b) => b.count - a.count);
        
        nonEmptyTables.forEach((table, index) => {
            console.log(`\n${index + 1}. 🗄️  TABELA: ${table.name}`);
            console.log(`   📊 Registros: ${table.count.toLocaleString()}`);
            
            if (table.sample && table.sample.length > 0) {
                console.log(`   📋 Estrutura (primeiros campos):`);
                const firstRow = table.sample[0];
                const fields = Object.keys(firstRow).slice(0, 5); // Primeiros 5 campos
                fields.forEach(field => {
                    const value = firstRow[field];
                    const displayValue = value ? String(value).substring(0, 50) : 'NULL';
                    console.log(`      • ${field}: ${displayValue}${String(value).length > 50 ? '...' : ''}`);
                });
            }
        });
        
        // Verificar tamanho do backup
        const backupFile = path.join(__dirname, 'database', 'backup_cplp_raras_20250908.sql');
        if (fs.existsSync(backupFile)) {
            const stats = fs.statSync(backupFile);
            console.log('\n💾 BACKUP DISPONÍVEL:');
            console.log('─'.repeat(40));
            console.log(`📁 Arquivo: backup_cplp_raras_20250908.sql`);
            console.log(`📊 Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`📅 Criado: ${stats.birthtime.toLocaleString('pt-BR')}`);
        }
        
        // Estatísticas por categoria
        console.log('\n📊 ANÁLISE POR CATEGORIA DE DADOS:');
        console.log('═'.repeat(80));
        
        const categories = {
            'CPLP/Países': nonEmptyTables.filter(t => t.name.includes('cplp')),
            'HPO/Fenótipos': nonEmptyTables.filter(t => t.name.includes('hpo')),
            'Orphanet/Doenças': nonEmptyTables.filter(t => t.name.includes('orpha')),
            'DrugBank/Medicamentos': nonEmptyTables.filter(t => t.name.includes('drug'))
        };
        
        Object.entries(categories).forEach(([category, tables]) => {
            const totalCategoryRecords = tables.reduce((sum, t) => sum + t.count, 0);
            console.log(`\n🏷️  ${category}:`);
            console.log(`   📊 Tabelas: ${tables.length}`);
            console.log(`   📈 Registros: ${totalCategoryRecords.toLocaleString()}`);
            
            if (tables.length > 0) {
                tables.forEach(table => {
                    console.log(`      • ${table.name}: ${table.count.toLocaleString()}`);
                });
            }
        });
        
        return {
            totalTables: tables.length,
            totalRecords: totalRecords,
            tables: tableDetails,
            categories: categories
        };
        
    } catch (error) {
        console.error('❌ Erro durante análise:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão fechada');
        }
    }
}

// Executar análise
analyzeCPLPDatabase()
    .then(result => {
        console.log('\n🎯 RESUMO FINAL:');
        console.log('═'.repeat(50));
        console.log(`✅ Base CPLP-Raras analisada com sucesso!`);
        console.log(`📦 ${result.totalTables} tabelas encontradas`);
        console.log(`📈 ${result.totalRecords.toLocaleString()} registros totais`);
        console.log(`💾 Backup disponível localmente`);
        console.log('\n🚀 Pronto para importar dados localmente!');
    })
    .catch(error => {
        console.error('\n❌ Erro na análise:', error.message);
    });
