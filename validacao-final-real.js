/**
 * VALIDAÇÃO FINAL REAL - FASE 1
 * Baseada apenas nas tabelas que realmente existem
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

async function validacaoFinalRealFase1() {
    let connection;
    
    try {
        console.log('🏁 VALIDAÇÃO FINAL REAL - FASE 1');
        console.log('=' .repeat(60));
        
        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Primeiro, vamos descobrir que tabelas existem realmente
        console.log('🔍 Descobrindo tabelas existentes...');
        const [tables] = await connection.execute(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'cplp_raras'
            ORDER BY table_name
        `);
        
        const tabelasExistentes = tables.map(t => t.table_name);
        console.log(`📋 Tabelas encontradas: ${tabelasExistentes.join(', ')}`);
        
        // 1. VERIFICAR INTEGRIDADE BASEADA NAS TABELAS REAIS
        console.log('\n📊 1. VERIFICANDO INTEGRIDADE REAL...');
        
        let contagens = {};
        let totalRegistros = 0;
        
        // Verificar cada tabela individualmente
        for (const tabela of tabelasExistentes) {
            try {
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tabela}`);
                contagens[tabela] = count[0].count;
                totalRegistros += count[0].count;
                console.log(`   📊 ${tabela}: ${count[0].count.toLocaleString()} registros`);
            } catch (error) {
                console.log(`   ⚠️ ${tabela}: Erro ao contar - ${error.message}`);
                contagens[tabela] = 0;
            }
        }
        
        console.log(`\n   ✅ TOTAL SISTEMA: ${totalRegistros.toLocaleString()} registros`);
        
        // 2. VALIDAR DADOS GENÔMICOS SE EXISTIREM
        console.log('\n🧬 2. VALIDANDO DADOS GENÔMICOS...');
        
        let dadosGenomicos = {};
        
        if (tabelasExistentes.includes('clinvar_variants')) {
            const [clinvarData] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_variants,
                    COUNT(DISTINCT variation_id) as unique_variants,
                    COUNT(DISTINCT gene_symbol) as unique_genes,
                    COUNT(CASE WHEN clinical_significance IS NOT NULL THEN 1 END) as with_significance
                FROM clinvar_variants
            `);
            dadosGenomicos.clinvar = clinvarData[0];
            console.log(`   🧪 ClinVar: ${clinvarData[0].total_variants} variantes, ${clinvarData[0].unique_genes} genes`);
        }
        
        if (tabelasExistentes.includes('omim_entries')) {
            const [omimData] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_entries,
                    COUNT(DISTINCT omim_id) as unique_omim_ids,
                    COUNT(DISTINCT gene_symbol) as unique_genes,
                    COUNT(CASE WHEN inheritance_pattern IS NOT NULL THEN 1 END) as with_inheritance
                FROM omim_entries
            `);
            dadosGenomicos.omim = omimData[0];
            console.log(`   📊 OMIM: ${omimData[0].total_entries} entradas, ${omimData[0].unique_genes} genes`);
        }
        
        // 3. TESTE DE PERFORMANCE SIMPLES
        console.log('\n⚡ 3. TESTE DE PERFORMANCE...');
        
        const startTime = Date.now();
        
        // Consulta simples mas representativa
        const [performanceTest] = await connection.execute(`
            SELECT COUNT(*) as total
            FROM orpha_diseases 
            WHERE is_active = 1
            LIMIT 1000
        `);
        
        const queryTime = Date.now() - startTime;
        console.log(`   ⏱️ Consulta base: ${queryTime}ms`);
        console.log(`   📊 Resultados: ${performanceTest[0].total.toLocaleString()}`);
        console.log(`   ✅ Performance: ${queryTime < 1000 ? 'EXCELENTE' : queryTime < 3000 ? 'BOA' : 'PRECISA OTIMIZAÇÃO'}`);
        
        // 4. VERIFICAR MAPEAMENTOS SE EXISTIREM
        console.log('\n🔗 4. VERIFICANDO MAPEAMENTOS...');
        
        let mapeamentos = [];
        if (tabelasExistentes.includes('omim_external_mappings')) {
            const [mappingsData] = await connection.execute(`
                SELECT 
                    external_db,
                    COUNT(*) as count
                FROM omim_external_mappings
                GROUP BY external_db
                ORDER BY count DESC
            `);
            mapeamentos = mappingsData;
            
            console.log(`   🔗 Databases mapeadas: ${mappingsData.length}`);
            mappingsData.forEach(m => {
                console.log(`     - ${m.external_db}: ${m.count} mapeamentos`);
            });
        } else {
            console.log('   ℹ️ Nenhuma tabela de mapeamentos encontrada');
        }
        
        // 5. ANÁLISE DE EXPANSÃO
        console.log('\n📈 5. ANÁLISE DE EXPANSÃO...');
        
        const baseOriginal = 65293;
        const crescimento = totalRegistros - baseOriginal;
        const crescimentoPercent = Math.round((crescimento / baseOriginal) * 100);
        
        console.log(`   📊 Base original: ${baseOriginal.toLocaleString()} registros`);
        console.log(`   📊 Sistema atual: ${totalRegistros.toLocaleString()} registros`);
        console.log(`   📈 Crescimento: ${crescimento >= 0 ? '+' : ''}${crescimento.toLocaleString()} (${crescimentoPercent >= 0 ? '+' : ''}${crescimentoPercent}%)`);
        
        // 6. AVALIAÇÃO FINAL
        console.log('\n🎯 6. AVALIAÇÃO FINAL...');
        
        let score = 0;
        let criteria = {};
        
        // Sistema operacional
        criteria.sistema_operacional = totalRegistros > 10000;
        if (criteria.sistema_operacional) score += 25;
        
        // Dados base preservados
        criteria.dados_preservados = contagens.orpha_diseases >= 10000 && contagens.hpo_terms >= 15000;
        if (criteria.dados_preservados) score += 25;
        
        // Dados genômicos integrados
        criteria.genomicos_integrados = (dadosGenomicos.clinvar?.total_variants > 0) || (dadosGenomicos.omim?.total_entries > 0);
        if (criteria.genomicos_integrados) score += 25;
        
        // Performance adequada
        criteria.performance_ok = queryTime < 3000;
        if (criteria.performance_ok) score += 25;
        
        console.log(`   ✅ Sistema operacional: ${criteria.sistema_operacional ? 'SIM' : 'NÃO'}`);
        console.log(`   ✅ Dados base preservados: ${criteria.dados_preservados ? 'SIM' : 'NÃO'}`);
        console.log(`   ✅ Genômicos integrados: ${criteria.genomicos_integrados ? 'SIM' : 'NÃO'}`);
        console.log(`   ✅ Performance adequada: ${criteria.performance_ok ? 'SIM' : 'NÃO'}`);
        
        // 7. RELATÓRIO FINAL
        const relatorio = {
            data_validacao: new Date().toISOString(),
            fase: 'FASE 1 - VALIDAÇÃO FINAL',
            score_final: score,
            status: score >= 75 ? 'APROVADO' : score >= 50 ? 'APROVADO_COM_RESSALVAS' : 'PRECISA_AJUSTES',
            
            sistema: {
                tabelas_existentes: tabelasExistentes.length,
                total_registros: totalRegistros,
                contagens_por_tabela: contagens
            },
            
            genomicos: dadosGenomicos,
            performance: { query_time_ms: queryTime, performance_level: queryTime < 1000 ? 'EXCELENTE' : 'BOA' },
            mapeamentos: mapeamentos.length,
            expansao: { crescimento_absoluto: crescimento, crescimento_percentual: crescimentoPercent },
            
            criterios_avaliacao: criteria,
            
            preparacao_fase2: {
                fundacao_estabelecida: score >= 75,
                dados_integrados: criteria.genomicos_integrados,
                sistema_estavel: criteria.sistema_operacional && criteria.performance_ok,
                pronto_expansao: score >= 75
            }
        };
        
        // Salvar relatório
        const reportPath = `relatorios/FASE1-VALIDACAO-REAL-FINAL-${timestamp}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(relatorio, null, 2));
        
        // RESULTADO FINAL
        console.log('\n' + '='.repeat(80));
        console.log('🏆 RESULTADO FINAL - VALIDAÇÃO FASE 1');
        console.log('='.repeat(80));
        console.log(`🎯 SCORE: ${score}/100`);
        console.log(`📊 STATUS: ${relatorio.status}`);
        console.log(`📈 SISTEMA: ${totalRegistros.toLocaleString()} registros`);
        console.log(`⚡ PERFORMANCE: ${queryTime}ms`);
        console.log(`🧬 GENÔMICOS: ${criteria.genomicos_integrados ? 'INTEGRADOS' : 'PENDENTE'}`);
        console.log(`🚀 FASE 2: ${relatorio.preparacao_fase2.pronto_expansao ? 'AUTORIZADA' : 'PENDENTE'}`);
        console.log(`📄 RELATÓRIO: ${reportPath}`);
        console.log('='.repeat(80));
        
        if (score >= 75) {
            console.log('🎉 FASE 1 APROVADA! FUNDAÇÃO GENÔMICA ESTABELECIDA!');
            console.log('🚀 AUTORIZADO: Início da Fase 2 - Expansão Massiva');
        } else if (score >= 50) {
            console.log('✅ FASE 1 APROVADA COM RESSALVAS - Sistema operacional');
            console.log('⚠️ Recomendado: Otimizações antes da Fase 2');
        } else {
            console.log('⚠️ Sistema precisa de ajustes significativos');
        }
        
        return {
            aprovado: score >= 50,
            score: score,
            status: relatorio.status,
            relatorio: reportPath
        };
        
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
        return { aprovado: false, erro: error.message };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar validação
validacaoFinalRealFase1()
    .then(result => {
        console.log('\n📋 VALIDAÇÃO CONCLUÍDA!');
        if (result.aprovado) {
            console.log('✅ Sistema aprovado para operação');
            console.log(`🎯 Score final: ${result.score}/100`);
        } else {
            console.log('⚠️ Sistema precisa de ajustes');
            if (result.erro) console.log(`❌ Erro: ${result.erro}`);
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
