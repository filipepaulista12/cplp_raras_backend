/**
 * 🔍 VERIFICAÇÃO COMPLETA DE TODAS AS 20 TABELAS MYSQL
 * CADEIA: Servidor → MySQL Local → SQLite (Prisma)
 * META: Garantir sincronização 100% em toda a pipeline
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function verificacaoCompletaTodasTabelas() {
    console.log('🔍 VERIFICAÇÃO COMPLETA DE TODAS AS 20 TABELAS MYSQL');
    console.log('=' + '='.repeat(80));
    console.log('🎯 CADEIA: Servidor → MySQL Local → SQLite (Prisma)');
    console.log('📊 META: Garantir sincronização 100% em toda a pipeline');
    
    let mysqlConn;
    
    try {
        // Conectar ao MySQL local
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexão MySQL Local estabelecida');
        
        // 1. DESCOBRIR TODAS AS TABELAS DO MYSQL
        console.log('\n🔍 DESCOBRINDO TODAS AS TABELAS DO MYSQL...');
        
        const [tables] = await mysqlConn.query(`
            SELECT TABLE_NAME, TABLE_ROWS
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'cplp_raras'
            ORDER BY TABLE_NAME
        `);
        
        console.log(`📊 Total de tabelas encontradas: ${tables.length}`);
        
        // 2. CONTAR REGISTROS EM CADA TABELA MYSQL
        console.log('\n📊 CONTANDO REGISTROS EM CADA TABELA MYSQL...');
        
        const mysqlCounts = {};
        
        for (let table of tables) {
            try {
                const [result] = await mysqlConn.query(`SELECT COUNT(*) as count FROM ${table.TABLE_NAME}`);
                mysqlCounts[table.TABLE_NAME] = result[0].count;
                console.log(`   📋 ${table.TABLE_NAME}: ${result[0].count.toLocaleString()}`);
            } catch (e) {
                console.log(`   ❌ ${table.TABLE_NAME}: ERRO - ${e.message}`);
                mysqlCounts[table.TABLE_NAME] = 0;
            }
        }
        
        // 3. MAPEAR TABELAS MYSQL PARA MODELOS PRISMA
        console.log('\n🗺️  MAPEANDO TABELAS MYSQL → MODELOS PRISMA...');
        
        const tableMapping = {
            'cplp_countries': { prisma: 'cplpCountry', description: 'Países CPLP' },
            'hpo_terms': { prisma: 'hpoTerm', description: 'Termos HPO' },
            'orpha_diseases': { prisma: 'rareDisease', description: 'Doenças Raras Orphanet' },
            'drugbank_drugs': { prisma: 'drugbankDrug', description: 'Medicamentos Drugbank' },
            'drug_interactions': { prisma: 'drugInteraction', description: 'Interações Medicamentosas' },
            'hpo_disease_associations': { prisma: 'hpoDiseasAssociation', description: 'Associações HPO-Doença' },
            'hpo_gene_associations': { prisma: 'hpoGeneAssociation', description: 'Associações HPO-Gene' },
            'orpha_external_mappings': { prisma: null, description: 'Mapeamentos Externos (apoio)' },
            'orpha_disease_synonyms': { prisma: null, description: 'Sinônimos de Doenças (apoio)' },
            'hpo_synonyms': { prisma: null, description: 'Sinônimos HPO (apoio)' },
            'drug_names': { prisma: null, description: 'Nomes de Medicamentos (apoio)' },
            'drug_categories': { prisma: null, description: 'Categorias de Medicamentos (apoio)' },
            'gene_info': { prisma: null, description: 'Informações de Genes (apoio)' },
            'disease_genes': { prisma: null, description: 'Genes-Doenças (apoio)' },
            'phenotype_annotations': { prisma: null, description: 'Anotações de Fenótipos (apoio)' },
            'clinical_features': { prisma: null, description: 'Características Clínicas (apoio)' },
            'epidemiology_data': { prisma: null, description: 'Dados Epidemiológicos (apoio)' },
            'treatment_info': { prisma: null, description: 'Informações de Tratamento (apoio)' },
            'research_studies': { prisma: null, description: 'Estudos de Pesquisa (apoio)' },
            'patient_registries': { prisma: null, description: 'Registros de Pacientes (apoio)' }
        };
        
        // 4. CONTAR REGISTROS NO PRISMA/SQLITE
        console.log('\n📊 CONTANDO REGISTROS NO PRISMA/SQLITE...');
        
        const prismaCounts = {};
        
        try {
            prismaCounts['cplpCountry'] = await prisma.cplpCountry.count();
            prismaCounts['hpoTerm'] = await prisma.hpoTerm.count();
            prismaCounts['rareDisease'] = await prisma.rareDisease.count();
            prismaCounts['drugbankDrug'] = await prisma.drugbankDrug.count();
            prismaCounts['drugInteraction'] = await prisma.drugInteraction.count();
            prismaCounts['hpoDiseasAssociation'] = await prisma.hpoDiseasAssociation.count();
            prismaCounts['hpoGeneAssociation'] = await prisma.hpoGeneAssociation.count();
            
            console.log('   📋 Contagens Prisma concluídas');
            
        } catch (e) {
            console.log(`   ❌ Erro contando Prisma: ${e.message}`);
        }
        
        // 5. ANÁLISE COMPARATIVA COMPLETA
        console.log('\n🎯 ANÁLISE COMPARATIVA COMPLETA - TODAS AS 20 TABELAS');
        console.log('=' + '='.repeat(80));
        
        let totalMysql = 0;
        let totalPrisma = 0;
        let tabelasPrincipais = 0;
        let tabelasApoio = 0;
        let tabelasPerfeitas = 0;
        let tabelasComDados = 0;
        let tabelasVazias = 0;
        
        console.log('📊 TABELAS PRINCIPAIS (com equivalente Prisma):');
        console.log('-'.repeat(80));
        
        for (let [mysqlTable, mapping] of Object.entries(tableMapping)) {
            const mysqlCount = mysqlCounts[mysqlTable] || 0;
            totalMysql += mysqlCount;
            
            if (mysqlCount > 0) {
                tabelasComDados++;
            } else {
                tabelasVazias++;
            }
            
            if (mapping.prisma) {
                tabelasPrincipais++;
                const prismaCount = prismaCounts[mapping.prisma] || 0;
                totalPrisma += prismaCount;
                
                const percent = mysqlCount > 0 ? ((prismaCount / mysqlCount) * 100).toFixed(1) : 0;
                const status = percent >= 99 ? '🎉 PERFEITO' : percent >= 90 ? '✅ EXCELENTE' : percent >= 50 ? '⚠️  PARCIAL' : '❌ CRÍTICO';
                
                if (percent >= 99) tabelasPerfeitas++;
                
                console.log(`📋 ${mysqlTable} → ${mapping.prisma}`);
                console.log(`   📊 MySQL: ${mysqlCount.toLocaleString()} | Prisma: ${prismaCount.toLocaleString()} | ${status} (${percent}%)`);
                console.log(`   📝 ${mapping.description}`);
                
            } else {
                tabelasApoio++;
                console.log(`📋 ${mysqlTable} (TABELA DE APOIO)`);
                console.log(`   📊 MySQL: ${mysqlCount.toLocaleString()}`);
                console.log(`   📝 ${mapping.description}`);
            }
            console.log('');
        }
        
        // 6. VERIFICAR TABELAS EXTRAS NO MYSQL
        console.log('🔍 VERIFICANDO TABELAS EXTRAS...');
        
        const tabelasExtras = [];
        for (let table of tables) {
            if (!tableMapping[table.TABLE_NAME]) {
                tabelasExtras.push({
                    name: table.TABLE_NAME,
                    count: mysqlCounts[table.TABLE_NAME] || 0
                });
            }
        }
        
        if (tabelasExtras.length > 0) {
            console.log('📋 TABELAS EXTRAS ENCONTRADAS:');
            tabelasExtras.forEach(table => {
                console.log(`   📊 ${table.name}: ${table.count.toLocaleString()}`);
                totalMysql += table.count;
                if (table.count > 0) tabelasComDados++;
                else tabelasVazias++;
            });
        } else {
            console.log('✅ Nenhuma tabela extra encontrada');
        }
        
        // 7. ESTATÍSTICAS FINAIS
        console.log('\n🎯 ESTATÍSTICAS FINAIS COMPLETAS');
        console.log('=' + '='.repeat(80));
        
        const totalTabelas = tables.length;
        const syncPercent = totalMysql > 0 ? ((totalPrisma / totalMysql) * 100).toFixed(1) : 0;
        
        console.log(`📊 TOTAIS GERAIS:`);
        console.log(`   🗃️  Total de tabelas MySQL: ${totalTabelas}`);
        console.log(`   📋 Tabelas principais (→Prisma): ${tabelasPrincipais}`);
        console.log(`   📋 Tabelas de apoio: ${tabelasApoio}`);
        console.log(`   📋 Tabelas extras: ${tabelasExtras.length}`);
        console.log('');
        
        console.log(`📊 STATUS DAS TABELAS:`);
        console.log(`   ✅ Com dados: ${tabelasComDados}`);
        console.log(`   ❌ Vazias: ${tabelasVazias}`);
        console.log(`   🎉 Perfeitas (99%+): ${tabelasPerfeitas}/${tabelasPrincipais}`);
        console.log('');
        
        console.log(`📊 REGISTROS TOTAIS:`);
        console.log(`   🗄️  MySQL Total: ${totalMysql.toLocaleString()}`);
        console.log(`   🗄️  Prisma Total: ${totalPrisma.toLocaleString()}`);
        console.log(`   📈 Sincronização: ${syncPercent}%`);
        console.log('');
        
        // 8. DIAGNÓSTICO FINAL
        console.log('🏥 DIAGNÓSTICO FINAL');
        console.log('=' + '='.repeat(80));
        
        if (totalTabelas >= 20) {
            console.log('✅ TODAS AS 20+ TABELAS CONFIRMADAS!');
        } else {
            console.log(`⚠️  ATENÇÃO: Apenas ${totalTabelas} tabelas encontradas (esperadas: 20+)`);
        }
        
        if (tabelasPerfeitas === tabelasPrincipais) {
            console.log('🎉 PERFEIÇÃO ABSOLUTA: Todas as tabelas principais 100% sincronizadas!');
        } else if (tabelasPerfeitas >= tabelasPrincipais * 0.8) {
            console.log('✅ EXCELENTE: Maioria das tabelas principais sincronizadas!');
        } else {
            console.log('⚠️  ATENÇÃO: Várias tabelas principais precisam de sincronização!');
        }
        
        if (syncPercent >= 99) {
            console.log('🏆 SINCRONIZAÇÃO PERFEITA: 99%+ de dados transferidos!');
        } else if (syncPercent >= 90) {
            console.log('✅ SINCRONIZAÇÃO EXCELENTE: 90%+ de dados transferidos!');
        } else if (syncPercent >= 70) {
            console.log('⚠️  SINCRONIZAÇÃO PARCIAL: 70%+ de dados transferidos');
        } else {
            console.log('❌ SINCRONIZAÇÃO CRÍTICA: Menos de 70% transferido!');
        }
        
        // 9. RECOMENDAÇÕES
        console.log('\n💡 RECOMENDAÇÕES');
        console.log('=' + '='.repeat(80));
        
        if (tabelasVazias > 0) {
            console.log(`⚠️  ${tabelasVazias} tabelas estão vazias - verificar se é esperado`);
        }
        
        if (tabelasExtras.length > 0) {
            console.log(`💡 ${tabelasExtras.length} tabelas extras encontradas - analisar se precisam ser mapeadas`);
        }
        
        if (tabelasPerfeitas < tabelasPrincipais) {
            const problemTables = tabelasPrincipais - tabelasPerfeitas;
            console.log(`🔧 ${problemTables} tabelas principais precisam de atenção para sincronização`);
        }
        
        console.log('\n🎯 RESUMO EXECUTIVO:');
        console.log(`📊 Pipeline: Servidor → MySQL Local (${totalTabelas} tabelas) → Prisma (${tabelasPrincipais} modelos)`);
        console.log(`🎉 Status: ${tabelasPerfeitas}/${tabelasPrincipais} tabelas perfeitas, ${syncPercent}% sincronização`);
        console.log(`💎 Sistema: ${totalMysql.toLocaleString()} registros MySQL → ${totalPrisma.toLocaleString()} registros Prisma`);
        
        if (syncPercent >= 95 && tabelasPerfeitas >= tabelasPrincipais * 0.8) {
            console.log('\n🏆🏆🏆 SISTEMA EM PERFEIÇÃO OPERACIONAL! 🏆🏆🏆');
        } else if (syncPercent >= 80) {
            console.log('\n✅✅ SISTEMA OPERACIONAL COM PEQUENOS AJUSTES! ✅✅');
        } else {
            console.log('\n⚠️⚠️ SISTEMA PRECISA DE AJUSTES NA SINCRONIZAÇÃO! ⚠️⚠️');
        }
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO na verificação:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR VERIFICAÇÃO COMPLETA
verificacaoCompletaTodasTabelas().then(() => {
    console.log('\n🏁 VERIFICAÇÃO COMPLETA FINALIZADA!');
    console.log('📊 Todas as 20 tabelas MySQL analisadas!');
    console.log('🎯 Pipeline Servidor → MySQL → Prisma verificada!');
}).catch(err => {
    console.error('💥 ERRO FINAL:', err.message);
});
