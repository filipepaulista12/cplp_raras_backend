/**
 * VALIDAÇÃO FINAL ADAPTADA - FASE 1
 * Descoberta automática da estrutura das tabelas
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

async function validacaoFinalAdaptada() {
    let connection;
    
    try {
        console.log('🏁 VALIDAÇÃO FINAL ADAPTADA - FASE 1');
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
        
        // 1. VERIFICAR ESTRUTURA DAS TABELAS GENÔMICAS
        console.log('🔍 1. DESCOBRINDO ESTRUTURA DAS TABELAS...');
        
        const [clinvarStructure] = await connection.execute(`
            DESCRIBE clinvar_variants
        `);
        
        const [omimStructure] = await connection.execute(`
            DESCRIBE omim_entries
        `);
        
        console.log('📋 Campos ClinVar:', clinvarStructure.map(f => f.Field).join(', '));
        console.log('📋 Campos OMIM:', omimStructure.map(f => f.Field).join(', '));
        
        // 2. CONTAGEM GERAL DO SISTEMA
        console.log('\n📊 2. CONTAGEM GERAL DO SISTEMA...');
        
        const [contagens] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM cplp_countries) as countries,
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM hpo_terms) as hpo_terms,
                (SELECT COUNT(*) FROM clinvar_variants) as clinvar_variants,
                (SELECT COUNT(*) FROM clinvar_genes) as clinvar_genes,
                (SELECT COUNT(*) FROM clinvar_submissions) as clinvar_submissions,
                (SELECT COUNT(*) FROM omim_entries) as omim_entries,
                (SELECT COUNT(*) FROM omim_phenotypes) as omim_phenotypes,
                (SELECT COUNT(*) FROM omim_external_mappings) as omim_external_mappings,
                (SELECT COUNT(*) FROM drugbank_drugs) as drugbank_drugs,
                (SELECT COUNT(*) FROM hpo_disease_associations) as hpo_disease_associations
        `);
        
        const dados = contagens[0];
        const totalRegistros = Object.values(dados).reduce((sum, count) => sum + count, 0);
        
        console.log(`   🇵🇹 Países CPLP: ${dados.countries}`);
        console.log(`   🦠 Doenças Orphanet: ${dados.diseases.toLocaleString()}`);
        console.log(`   🧬 Termos HPO: ${dados.hpo_terms.toLocaleString()}`);
        console.log(`   🧪 ClinVar - Variantes: ${dados.clinvar_variants}`);
        console.log(`   🧪 ClinVar - Genes: ${dados.clinvar_genes}`);
        console.log(`   🧪 ClinVar - Submissions: ${dados.clinvar_submissions}`);
        console.log(`   📊 OMIM - Entradas: ${dados.omim_entries}`);
        console.log(`   📊 OMIM - Fenótipos: ${dados.omim_phenotypes}`);
        console.log(`   📊 OMIM - Mapeamentos: ${dados.omim_external_mappings}`);
        console.log(`   💊 DrugBank: ${dados.drugbank_drugs}`);
        console.log(`   🔗 HPO-Disease: ${dados.hpo_disease_associations.toLocaleString()}`);
        console.log(`\n   ✅ TOTAL: ${totalRegistros.toLocaleString()} registros`);
        
        // 3. VALIDAR DADOS GENÔMICOS COM CAMPOS CORRETOS
        console.log('\n🧬 3. VALIDANDO DADOS GENÔMICOS...');
        
        // ClinVar - usando campos que sabemos que existem
        const [clinvarData] = await connection.execute(`
            SELECT 
                COUNT(*) as total_variants,
                COUNT(DISTINCT gene_symbol) as unique_genes,
                COUNT(CASE WHEN clinical_significance IS NOT NULL THEN 1 END) as with_significance
            FROM clinvar_variants
        `);
        
        // OMIM - usando campos que sabemos que existem
        const [omimData] = await connection.execute(`
            SELECT 
                COUNT(*) as total_entries,
                COUNT(DISTINCT omim_id) as unique_omim_ids,
                COUNT(DISTINCT gene_symbol) as unique_genes,
                COUNT(CASE WHEN inheritance_pattern IS NOT NULL THEN 1 END) as with_inheritance
            FROM omim_entries
        `);
        
        // Genes únicos combinados
        const [genesUnicos] = await connection.execute(`
            SELECT COUNT(*) as total_genes FROM (
                SELECT gene_symbol FROM clinvar_variants WHERE gene_symbol IS NOT NULL
                UNION
                SELECT gene_symbol FROM omim_entries WHERE gene_symbol IS NOT NULL
            ) as combined_genes
        `);
        
        console.log(`   🧪 ClinVar: ${clinvarData[0].total_variants} variantes`);
        console.log(`   🧪 ClinVar: ${clinvarData[0].unique_genes} genes únicos`);
        console.log(`   🧪 ClinVar: ${clinvarData[0].with_significance} com significância clínica`);
        console.log(`   📊 OMIM: ${omimData[0].total_entries} entradas`);
        console.log(`   📊 OMIM: ${omimData[0].unique_genes} genes únicos`);
        console.log(`   📊 OMIM: ${omimData[0].with_inheritance} com padrão de herança`);
        console.log(`   🧬 Total genes únicos integrados: ${genesUnicos[0].total_genes}`);
        
        // 4. TESTE DE PERFORMANCE
        console.log('\n⚡ 4. TESTE DE PERFORMANCE...');
        
        const startTime = Date.now();
        
        // Consulta complexa integrando dados genômicos
        const [performanceTest] = await connection.execute(`
            SELECT 
                cv.gene_symbol,
                cv.clinical_significance,
                COUNT(cv.id) as clinvar_count,
                COUNT(oe.id) as omim_count
            FROM clinvar_variants cv
            LEFT JOIN omim_entries oe ON cv.gene_symbol = oe.gene_symbol
            WHERE cv.gene_symbol IS NOT NULL
            GROUP BY cv.gene_symbol, cv.clinical_significance
            ORDER BY clinvar_count DESC, omim_count DESC
            LIMIT 10
        `);
        
        const queryTime = Date.now() - startTime;
        
        console.log(`   ⏱️ Consulta genômica integrada: ${queryTime}ms`);
        console.log(`   📊 Genes com dados integrados: ${performanceTest.length}`);
        console.log(`   ✅ Performance: ${queryTime < 1000 ? 'EXCELENTE' : queryTime < 3000 ? 'BOA' : 'PRECISA OTIMIZAÇÃO'}`);
        
        // Mostrar alguns resultados da integração
        console.log('   🔗 Exemplos de integração:');
        performanceTest.slice(0, 5).forEach(row => {
            console.log(`     - ${row.gene_symbol}: ${row.clinvar_count} ClinVar + ${row.omim_count} OMIM (${row.clinical_significance})`);
        });
        
        // 5. VERIFICAR MAPEAMENTOS E INTEROPERABILIDADE
        console.log('\n🔗 5. VERIFICANDO INTEROPERABILIDADE...');
        
        const [mapeamentosOMIM] = await connection.execute(`
            SELECT 
                external_db,
                COUNT(*) as mappings_count
            FROM omim_external_mappings
            GROUP BY external_db
            ORDER BY mappings_count DESC
        `);
        
        const [mapeamentosOrpha] = await connection.execute(`
            SELECT 
                'Orpha_External' as source,
                COUNT(*) as mappings_count
            FROM orpha_external_mappings
        `);
        
        console.log(`   🔗 Mapeamentos OMIM:`);
        mapeamentosOMIM.forEach(m => {
            console.log(`     - ${m.external_db}: ${m.mappings_count} mapeamentos`);
        });
        
        console.log(`   🔗 Mapeamentos Orphanet: ${mapeamentosOrpha[0].mappings_count}`);
        
        // 6. ANÁLISE DE EXPANSÃO E QUALIDADE
        console.log('\n📈 6. ANÁLISE DE EXPANSÃO...');
        
        const baseOriginal = 65293; // Sistema original conhecido
        const crescimento = totalRegistros - baseOriginal;
        const crescimentoPercent = Math.round((crescimento / baseOriginal) * 100);
        
        console.log(`   📊 Base original: ${baseOriginal.toLocaleString()} registros`);
        console.log(`   📊 Sistema expandido: ${totalRegistros.toLocaleString()} registros`);
        console.log(`   📈 Crescimento: ${crescimento >= 0 ? '+' : ''}${crescimento.toLocaleString()} (${crescimentoPercent >= 0 ? '+' : ''}${crescimentoPercent}%)`);
        
        // Componentes da expansão
        const expansaoGenomica = dados.clinvar_variants + dados.clinvar_genes + dados.clinvar_submissions + 
                               dados.omim_entries + dados.omim_phenotypes + dados.omim_external_mappings;
        
        console.log(`   🧬 Expansão genômica: ${expansaoGenomica} registros`);
        console.log(`   💊 Dados farmacológicos: ${dados.drugbank_drugs} registros`);
        console.log(`   🔗 Associações HPO: ${dados.hpo_disease_associations.toLocaleString()} registros`);
        
        // 7. AVALIAÇÃO FINAL E SCORE
        console.log('\n🎯 7. AVALIAÇÃO FINAL...');
        
        let score = 0;
        let maxScore = 100;
        let criterios = {};
        
        // Critério 1: Sistema operacional e dados base (25 pontos)
        criterios.sistema_base = dados.countries >= 9 && dados.diseases >= 10000 && dados.hpo_terms >= 15000;
        if (criterios.sistema_base) score += 25;
        
        // Critério 2: Integração genômica (30 pontos)
        criterios.genomica_integrada = dados.clinvar_variants > 0 && dados.omim_entries > 0 && genesUnicos[0].total_genes > 0;
        if (criterios.genomica_integrada) score += 30;
        
        // Critério 3: Performance adequada (20 pontos)
        criterios.performance_ok = queryTime < 3000;
        if (criterios.performance_ok) score += 20;
        
        // Critério 4: Mapeamentos e interoperabilidade (15 pontos)
        criterios.interoperavel = mapeamentosOMIM.length >= 3 && mapeamentosOrpha[0].mappings_count > 1000;
        if (criterios.interoperavel) score += 15;
        
        // Critério 5: Expansão significativa (10 pontos)
        criterios.expansao_significativa = expansaoGenomica > 500;
        if (criterios.expansao_significativa) score += 10;
        
        console.log(`   ✅ Sistema base operacional: ${criterios.sistema_base ? 'SIM' : 'NÃO'} (25 pts)`);
        console.log(`   ✅ Genômica integrada: ${criterios.genomica_integrada ? 'SIM' : 'NÃO'} (30 pts)`);
        console.log(`   ✅ Performance adequada: ${criterios.performance_ok ? 'SIM' : 'NÃO'} (20 pts)`);
        console.log(`   ✅ Interoperabilidade: ${criterios.interoperavel ? 'SIM' : 'NÃO'} (15 pts)`);
        console.log(`   ✅ Expansão significativa: ${criterios.expansao_significativa ? 'SIM' : 'NÃO'} (10 pts)`);
        
        // 8. PREPARAÇÃO PARA FASE 2
        const prontoFase2 = score >= 80;
        const aprovadoOperacao = score >= 60;
        
        // 9. RELATÓRIO FINAL
        const relatorio = {
            data_validacao: new Date().toISOString(),
            fase: 'FASE 1 - VALIDAÇÃO FINAL COMPLETA',
            
            score_final: score,
            score_maximo: maxScore,
            status: score >= 80 ? 'APROVADO_FASE2' : score >= 60 ? 'APROVADO_OPERACAO' : 'PRECISA_AJUSTES',
            
            sistema_completo: {
                total_registros: totalRegistros,
                crescimento_absoluto: crescimento,
                crescimento_percentual: crescimentoPercent,
                componentes: dados
            },
            
            integracao_genomica: {
                clinvar: clinvarData[0],
                omim: omimData[0],
                genes_unicos_integrados: genesUnicos[0].total_genes,
                performance_ms: queryTime
            },
            
            interoperabilidade: {
                mapeamentos_omim: mapeamentosOMIM.length,
                mapeamentos_orpha: mapeamentosOrpha[0].mappings_count,
                total_mapeamentos: mapeamentosOMIM.reduce((sum, m) => sum + m.mappings_count, 0) + mapeamentosOrpha[0].mappings_count
            },
            
            criterios_avaliacao: criterios,
            
            preparacao_fase2: {
                pronto_expansao_massiva: prontoFase2,
                sistema_operacional: aprovadoOperacao,
                fundacao_genomica_estabelecida: criterios.genomica_integrada,
                arquitetura_escalavel: criterios.performance_ok
            }
        };
        
        // Salvar relatório
        const reportPath = `relatorios/FASE1-VALIDACAO-FINAL-APROVACAO-COMPLETA-${timestamp}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(relatorio, null, 2));
        
        // RESULTADO FINAL
        console.log('\n' + '='.repeat(90));
        console.log('🏆 RESULTADO FINAL - VALIDAÇÃO COMPLETA FASE 1');
        console.log('='.repeat(90));
        console.log(`🎯 SCORE FINAL: ${score}/${maxScore} pontos`);
        console.log(`📊 STATUS: ${relatorio.status}`);
        console.log(`📈 SISTEMA: ${totalRegistros.toLocaleString()} registros (${crescimentoPercent >= 0 ? '+' : ''}${crescimentoPercent}%)`);
        console.log(`🧬 GENÔMICA: ${genesUnicos[0].total_genes} genes integrados`);
        console.log(`⚡ PERFORMANCE: ${queryTime}ms consultas complexas`);
        console.log(`🔗 INTEROP: ${mapeamentosOMIM.length} databases + ${mapeamentosOrpha[0].mappings_count} mapeamentos`);
        console.log(`🚀 FASE 2: ${prontoFase2 ? 'AUTORIZADA' : 'PENDENTE'}`);
        console.log(`📄 RELATÓRIO: ${reportPath}`);
        console.log('='.repeat(90));
        
        if (score >= 80) {
            console.log('🎉 FASE 1 APROVADA COM EXCELÊNCIA!');
            console.log('🚀 AUTORIZADO: Início imediato da Fase 2 - Expansão para 15M+ registros');
            console.log('✨ Fundação genômica sólida estabelecida com sucesso!');
        } else if (score >= 60) {
            console.log('✅ FASE 1 APROVADA PARA OPERAÇÃO!');
            console.log('⚠️ Recomendado: Otimizações antes da expansão massiva');
            console.log('🔄 Sistema funcional e pronto para uso');
        } else {
            console.log('⚠️ Sistema precisa de ajustes significativos');
            console.log('🔧 Necessário: Correções antes de prosseguir');
        }
        
        return {
            aprovado: score >= 60,
            score: score,
            status: relatorio.status,
            relatorio: reportPath,
            pronto_fase2: prontoFase2
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
validacaoFinalAdaptada()
    .then(result => {
        console.log('\n📋 VALIDAÇÃO FINAL CONCLUÍDA!');
        if (result.aprovado) {
            console.log('✅ FASE 1 APROVADA!');
            console.log(`🎯 Score: ${result.score}/100`);
            console.log(`📊 Status: ${result.status}`);
            if (result.pronto_fase2) {
                console.log('🚀 SISTEMA PRONTO PARA FASE 2!');
            }
        } else {
            console.log('⚠️ Sistema precisa de ajustes');
            if (result.erro) console.log(`❌ Erro: ${result.erro}`);
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
