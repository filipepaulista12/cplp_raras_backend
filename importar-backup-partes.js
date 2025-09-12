const fs = require('fs').promises;
const mysql = require('mysql2/promise');

console.log('⚡ IMPORTAÇÃO RÁPIDA - BACKUP POR PARTES');
console.log('═'.repeat(45));

async function importarBackupPorPartes() {
    let connection;
    
    try {
        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ MySQL conectado');
        
        // Ler backup
        console.log('📂 Carregando backup...');
        const backupSQL = await fs.readFile('database/Dump20250903.sql', 'utf8');
        
        // Extrair apenas os CREATE TABLE e INSERT principais
        console.log('🔍 Extraindo comandos principais...');
        
        const lines = backupSQL.split('\n');
        let createTableCommands = [];
        let insertCommands = [];
        let currentTable = '';
        
        for (const line of lines) {
            const cleanLine = line.trim();
            
            // Encontrar CREATE TABLE
            if (cleanLine.startsWith('CREATE TABLE')) {
                const match = cleanLine.match(/CREATE TABLE `(\w+)`/);
                if (match) {
                    currentTable = match[1];
                    createTableCommands.push(cleanLine);
                    console.log(`📋 Encontrada tabela: ${currentTable}`);
                }
            }
            
            // Encontrar INSERT para tabelas importantes
            else if (cleanLine.startsWith('INSERT INTO')) {
                const importantTables = [
                    'cplp_countries', 'hpo_terms', 'rare_diseases', 
                    'orphanet_diseases', 'gard_diseases', 'drugbank_drugs'
                ];
                
                for (const table of importantTables) {
                    if (cleanLine.includes(`INSERT INTO \`${table}\``)) {
                        insertCommands.push(cleanLine);
                        break;
                    }
                }
            }
        }
        
        console.log(`🏗️ Tabelas encontradas: ${createTableCommands.length}`);
        console.log(`📥 Comandos INSERT: ${insertCommands.length}`);
        
        // Executar CREATE TABLE primeiro
        console.log('\n🏗️ Criando estrutura de tabelas...');
        
        let tablesCreated = 0;
        for (const createCmd of createTableCommands.slice(0, 20)) { // Limitar a 20 tabelas principais
            try {
                await connection.query(createCmd + ';');
                tablesCreated++;
                console.log(`✅ Tabela ${tablesCreated} criada`);
            } catch (error) {
                console.log(`⚠️ Erro ao criar tabela: ${error.message.substring(0, 50)}...`);
            }
        }
        
        // Executar INSERTs em batches
        console.log('\n📥 Inserindo dados...');
        
        let recordsInserted = 0;
        const batchSize = 100;
        
        for (let i = 0; i < insertCommands.length; i += batchSize) {
            const batch = insertCommands.slice(i, i + batchSize);
            
            for (const insertCmd of batch) {
                try {
                    await connection.query(insertCmd + ';');
                    recordsInserted++;
                } catch (error) {
                    // Ignorar erros de inserção para continuar
                }
            }
            
            console.log(`⚡ Processados: ${Math.min(i + batchSize, insertCommands.length)}/${insertCommands.length} INSERTs`);
        }
        
        console.log(`✅ Registros inseridos: ${recordsInserted.toLocaleString()}`);
        
        // Verificar resultado
        console.log('\n📊 VERIFICANDO RESULTADO:');
        console.log('─'.repeat(30));
        
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 Tabelas criadas: ${tables.length}`);
        
        // Contar registros em tabelas principais
        const mainTables = ['cplp_countries', 'hpo_terms', 'rare_diseases', 'orphanet_diseases'];
        let totalRecords = 0;
        
        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            try {
                const [count] = await connection.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
                const records = count[0].total;
                totalRecords += records;
                
                if (mainTables.includes(tableName) || records > 0) {
                    console.log(`✅ ${tableName}: ${records.toLocaleString()} registros`);
                }
            } catch (error) {
                // Ignorar erros de contagem
            }
        }
        
        console.log(`\n📈 TOTAL GERAL: ${totalRecords.toLocaleString()} registros`);
        
        if (totalRecords > 50000) {
            console.log('🎉 ✅ SUCESSO! Dados científicos importados!');
        } else if (totalRecords > 1000) {
            console.log('🎯 ⚠️ PARCIAL - Dados básicos importados');
        } else {
            console.log('❌ LIMITADO - Poucos dados importados');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

importarBackupPorPartes();
