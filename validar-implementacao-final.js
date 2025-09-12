/**
 * VALIDAÇÃO FINAL - FASE 1 TAREFA 1.3
 * Testa a implementação do schema expandido
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

async function validarImplementacao() {
    let mysqlConnection = null;
    let prisma = null;

    try {
        console.log('🔍 VALIDAÇÃO FINAL DO SCHEMA EXPANDIDO');
        console.log('='.repeat(60));

        // 1. Testar Prisma Client
        console.log('📦 Testando Prisma Client...');
        prisma = new PrismaClient();
        await prisma.$connect();
        console.log('✅ Prisma Client conectado');

        // 2. Testar conexão MySQL
        console.log('🔌 Testando MySQL...');
        mysqlConnection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado');

        // 3. Verificar tabelas genômicas
        console.log('\n🧬 Verificando tabelas genômicas...');
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

        const [tables] = await mysqlConnection.execute('SHOW TABLES');
        const existingTables = tables.map(row => Object.values(row)[0]);
        
        let tabelasOK = 0;
        for (const table of genomicTables) {
            if (existingTables.includes(table)) {
                console.log(`   ✅ ${table}`);
                tabelasOK++;
            } else {
                console.log(`   ❌ ${table} - NÃO ENCONTRADA`);
            }
        }

        // 4. Testar modelos Prisma
        console.log('\n🔧 Testando modelos Prisma...');
        
        // Teste básico de cada modelo
        const modelTests = [
            { name: 'ClinvarVariant', model: 'clinvarVariant' },
            { name: 'ClinvarSubmission', model: 'clinvarSubmission' },
            { name: 'ClinvarHpoAssociation', model: 'clinvarHpoAssociation' },
            { name: 'ClinvarGene', model: 'clinvarGene' },
            { name: 'OmimEntry', model: 'omimEntry' },
            { name: 'OmimPhenotype', model: 'omimPhenotype' },
            { name: 'OmimHpoAssociation', model: 'omimHpoAssociation' },
            { name: 'OmimExternalMapping', model: 'omimExternalMapping' }
        ];

        let modelosOK = 0;
        for (const test of modelTests) {
            try {
                // Teste simples de contagem
                const count = await prisma[test.model].count();
                console.log(`   ✅ ${test.name}: ${count} registros`);
                modelosOK++;
            } catch (error) {
                console.log(`   ❌ ${test.name}: ${error.message}`);
            }
        }

        // 5. Testar dados existentes preservados
        console.log('\n📊 Verificando dados existentes...');
        const dataTests = [
            { table: 'cplp_countries', expected: 9 },
            { table: 'orpha_diseases', expected: 11239 },
            { table: 'hpo_terms', expected: 19662 }
        ];

        let dadosOK = 0;
        for (const test of dataTests) {
            try {
                const [result] = await mysqlConnection.execute(
                    `SELECT COUNT(*) as count FROM ${test.table}`
                );
                const count = result[0].count;
                
                if (count === test.expected) {
                    console.log(`   ✅ ${test.table}: ${count} registros (OK)`);
                    dadosOK++;
                } else {
                    console.log(`   ⚠️ ${test.table}: ${count} registros (esperado: ${test.expected})`);
                }
            } catch (error) {
                console.log(`   ❌ ${test.table}: ${error.message}`);
            }
        }

        // 6. Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📋 RELATÓRIO DE VALIDAÇÃO FINAL');
        console.log('='.repeat(60));
        console.log(`🗄️  Tabelas genômicas: ${tabelasOK}/8 ${tabelasOK === 8 ? '✅' : '❌'}`);
        console.log(`🔧 Modelos Prisma: ${modelosOK}/8 ${modelosOK === 8 ? '✅' : '❌'}`);
        console.log(`📊 Dados preservados: ${dadosOK}/3 ${dadosOK === 3 ? '✅' : '❌'}`);
        
        const sucessoTotal = tabelasOK === 8 && modelosOK === 8 && dadosOK === 3;
        
        console.log(`\n🎯 STATUS GERAL: ${sucessoTotal ? '✅ SUCESSO COMPLETO' : '⚠️ VERIFICAR PROBLEMAS'}`);
        
        if (sucessoTotal) {
            console.log('\n🎉 IMPLEMENTAÇÃO VALIDADA COM SUCESSO!');
            console.log('🚀 Sistema pronto para a próxima fase: ETL ClinVar');
            console.log('\n📋 PRÓXIMAS ETAPAS:');
            console.log('   1. ✅ Schema expandido implementado');
            console.log('   2. 🔄 Implementar ETL ClinVar (Tarefa 1.4)');
            console.log('   3. 🔄 Implementar ETL OMIM (Tarefa 1.5)');
            console.log('   4. 🔄 Testes de integração');
        }

        return {
            sucesso: sucessoTotal,
            tabelas: tabelasOK,
            modelos: modelosOK,
            dados: dadosOK
        };

    } catch (error) {
        console.error('\n💥 ERRO NA VALIDAÇÃO:', error.message);
        return {
            sucesso: false,
            erro: error.message
        };
    } finally {
        if (mysqlConnection) {
            await mysqlConnection.end();
            console.log('\n🔌 Conexão MySQL fechada');
        }
        if (prisma) {
            await prisma.$disconnect();
            console.log('🔌 Prisma desconectado');
        }
    }
}

// Executar validação
validarImplementacao()
    .then(result => {
        if (result.sucesso) {
            console.log('\n✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
        } else {
            console.log('\n❌ VALIDAÇÃO FALHOU!');
            console.log('📝 Verifique os problemas reportados acima');
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
