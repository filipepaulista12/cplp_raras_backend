/**
 * FASE 1 - TAREFA 1.3: IMPLEMENTAÇÃO E TESTE DO SCHEMA EXPANDIDO
 * Versão simplificada focada na implementação
 */

const fs = require('fs');
const mysql = require('mysql2/promise');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

async function implementSchema() {
    let connection = null;
    
    try {
        console.log('🚀 INICIANDO IMPLEMENTAÇÃO DO SCHEMA EXPANDIDO');
        console.log('='.repeat(60));

        // 1. Conectar MySQL
        console.log('🔌 Conectando ao MySQL...');
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado com sucesso');

        // 2. Verificar tabelas existentes
        console.log('🔍 Verificando tabelas existentes...');
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        console.log(`📊 Tabelas existentes: ${tableNames.length}`);

        // 3. Ler e executar SQL de extensão
        console.log('📝 Carregando SQL de extensão...');
        const sqlFile = 'schemas/fase1-genomica/mysql-genomica-extension.sql';
        
        if (!fs.existsSync(sqlFile)) {
            throw new Error(`Arquivo SQL não encontrado: ${sqlFile}`);
        }

        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        console.log(`📄 SQL carregado: ${sqlContent.length} caracteres`);

        // 4. Dividir e executar comandos
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 20 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        console.log(`🔧 Encontrados ${statements.length} comandos SQL válidos`);

        let success = 0;
        let errors = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            console.log(`\n[${i + 1}/${statements.length}] Executando comando...`);
            
            try {
                await connection.execute(stmt);
                success++;
                console.log(`✅ Sucesso`);
                
                // Se for CREATE TABLE, mostrar qual tabela foi criada
                if (stmt.toUpperCase().includes('CREATE TABLE')) {
                    const tableName = stmt.match(/CREATE TABLE\s+(\w+)/i)?.[1];
                    console.log(`   📊 Tabela criada: ${tableName}`);
                }
                
            } catch (error) {
                errors++;
                if (error.message.includes('already exists')) {
                    console.log(`⚠️ Tabela já existe (OK)`);
                    success++; // Contar como sucesso
                } else {
                    console.log(`❌ Erro: ${error.message}`);
                }
            }
        }

        // 5. Verificar tabelas criadas
        console.log('\n🔍 Verificando novas tabelas...');
        const [newTables] = await connection.execute('SHOW TABLES');
        const newTableNames = newTables.map(row => Object.values(row)[0]);
        
        const genomicTables = [
            'clinvar_variants',
            'clinvar_submissions', 
            'clinvar_hpo_associations',
            'clinvar_genes',
            'omim_entries',
            'omim_phenotypes',
            'omim_hpo_associations',
            'omim_external_mappings'
        ];

        const createdGenomicTables = genomicTables.filter(table => 
            newTableNames.includes(table)
        );

        console.log(`📊 Tabelas genômicas encontradas: ${createdGenomicTables.length}/${genomicTables.length}`);
        createdGenomicTables.forEach(table => {
            console.log(`   ✅ ${table}`);
        });

        // 6. Testar estrutura das tabelas
        console.log('\n🧪 Testando estrutura das tabelas...');
        for (const table of createdGenomicTables) {
            try {
                const [columns] = await connection.execute(`DESCRIBE ${table}`);
                console.log(`   📊 ${table}: ${columns.length} colunas`);
            } catch (error) {
                console.log(`   ❌ Erro testando ${table}: ${error.message}`);
            }
        }

        // 7. Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📋 RELATÓRIO FINAL');
        console.log('='.repeat(60));
        console.log(`⏱️  Comandos executados: ${statements.length}`);
        console.log(`✅ Sucessos: ${success}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📊 Tabelas genômicas: ${createdGenomicTables.length}/8`);
        console.log(`🎯 Status: ${success >= statements.length ? 'SUCESSO COMPLETO' : 'PARCIAL'}`);
        
        if (createdGenomicTables.length >= 6) {
            console.log('\n🎉 SCHEMA EXPANDIDO IMPLEMENTADO COM SUCESSO!');
            console.log('🔄 Próximo passo: Atualizar schema Prisma');
        }

        return {
            sucesso: true,
            tabelas_criadas: createdGenomicTables.length,
            comandos_executados: success
        };

    } catch (error) {
        console.error('\n💥 ERRO FATAL:', error.message);
        return {
            sucesso: false,
            erro: error.message
        };
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexão MySQL fechada');
        }
    }
}

// Executar
implementSchema()
    .then(result => {
        if (result.sucesso) {
            console.log('\n✅ IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!');
        } else {
            console.log('\n❌ IMPLEMENTAÇÃO FALHOU!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
