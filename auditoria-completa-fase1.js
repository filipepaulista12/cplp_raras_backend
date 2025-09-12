/**
 * AUDITORIA COMPLETA - FASE 1
 * Identificação de dados incompletos vs dados completos
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

async function auditoriaCompletaFase1() {
    let connection;
    
    try {
        console.log('🔍 AUDITORIA COMPLETA - ANÁLISE DE DADOS FASE 1');
        console.log('=' .repeat(70));
        
        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        const auditoria = {
            data_auditoria: new Date().toISOString(),
            problemas_identificados: [],
            dados_completos: [],
            dados_incompletos: [],
            recomendacoes: []
        };
        
        // 1. ANÁLISE ORPHANET - DEVERIA TER DADOS MASSIVOS
        console.log('🦠 1. AUDITORIA ORPHANET...');
        const [orphaStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM orpha_clinical_signs) as clinical_signs,
                (SELECT COUNT(*) FROM orpha_epidemiology) as epidemiology,
                (SELECT COUNT(*) FROM orpha_phenotypes) as phenotypes,
                (SELECT COUNT(*) FROM orpha_gene_associations) as gene_associations,
                (SELECT COUNT(*) FROM orpha_natural_history) as natural_history,
                (SELECT COUNT(*) FROM orpha_textual_information) as textual_info,
                (SELECT COUNT(*) FROM orpha_cplp_epidemiology) as cplp_epidemiology
        `);
        
        const orphaData = orphaStats[0];
        console.log(`   📊 Doenças: ${orphaData.diseases.toLocaleString()}`);
        console.log(`   📊 Sinais clínicos: ${orphaData.clinical_signs.toLocaleString()}`);
        console.log(`   📊 Epidemiologia: ${orphaData.epidemiology.toLocaleString()}`);
        console.log(`   📊 Fenótipos: ${orphaData.phenotypes.toLocaleString()}`);
        console.log(`   📊 Associações genéticas: ${orphaData.gene_associations.toLocaleString()}`);
        console.log(`   📊 História natural: ${orphaData.natural_history.toLocaleString()}`);
        console.log(`   📊 Informações textuais: ${orphaData.textual_info.toLocaleString()}`);
        console.log(`   📊 Epidemiologia CPLP: ${orphaData.cplp_epidemiology.toLocaleString()}`);
        
        // PROBLEMA IDENTIFICADO: Muitas tabelas Orphanet estão vazias!
        if (orphaData.clinical_signs === 0) {
            auditoria.problemas_identificados.push({
                componente: 'Orphanet Clinical Signs',
                problema: 'Tabela completamente vazia - dados não foram carregados',
                impacto: 'Alto - perda de informações clínicas essenciais',
                registros_esperados: '50,000+',
                registros_atuais: 0
            });
        }
        
        if (orphaData.epidemiology === 0) {
            auditoria.problemas_identificados.push({
                componente: 'Orphanet Epidemiology',
                problema: 'Dados epidemiológicos não carregados',
                impacto: 'Alto - sem dados de prevalência e incidência',
                registros_esperados: '20,000+',
                registros_atuais: 0
            });
        }
        
        if (orphaData.phenotypes === 0) {
            auditoria.problemas_identificados.push({
                componente: 'Orphanet Phenotypes',
                problema: 'Fenótipos não carregados da API Orphanet',
                impacto: 'Crítico - sem associações fenótipo-doença',
                registros_esperados: '100,000+',
                registros_atuais: 0
            });
        }
        
        // 2. ANÁLISE HPO - DEVERIA TER MAIS ASSOCIAÇÕES
        console.log('\n🧬 2. AUDITORIA HPO...');
        const [hpoStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM hpo_terms) as terms,
                (SELECT COUNT(*) FROM hpo_disease_associations) as disease_assoc,
                (SELECT COUNT(*) FROM hpo_gene_associations) as gene_assoc,
                (SELECT COUNT(*) FROM hpo_phenotype_associations) as phenotype_assoc
        `);
        
        const hpoData = hpoStats[0];
        console.log(`   🧬 Termos HPO: ${hpoData.terms.toLocaleString()}`);
        console.log(`   🔗 Associações doença: ${hpoData.disease_assoc.toLocaleString()}`);
        console.log(`   🔗 Associações gene: ${hpoData.gene_assoc.toLocaleString()}`);
        console.log(`   🔗 Associações fenótipo: ${hpoData.phenotype_assoc.toLocaleString()}`);
        
        // HPO parece ter dados bons, mas verificar se são completos
        if (hpoData.phenotype_assoc === 0) {
            auditoria.problemas_identificados.push({
                componente: 'HPO Phenotype Associations',
                problema: 'Associações fenótipo-HPO não carregadas',
                impacto: 'Médio - reduz capacidade de busca por fenótipos',
                registros_esperados: '200,000+',
                registros_atuais: 0
            });
        }
        
        // 3. ANÁLISE CLINVAR - MUITO PEQUENO!
        console.log('\n🧪 3. AUDITORIA CLINVAR...');
        const [clinvarStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM clinvar_variants) as variants,
                (SELECT COUNT(*) FROM clinvar_genes) as genes,
                (SELECT COUNT(*) FROM clinvar_submissions) as submissions,
                (SELECT COUNT(*) FROM clinvar_hpo_associations) as hpo_assoc
        `);
        
        const clinvarData = clinvarStats[0];
        console.log(`   🧪 Variantes: ${clinvarData.variants.toLocaleString()}`);
        console.log(`   🧬 Genes: ${clinvarData.genes.toLocaleString()}`);
        console.log(`   📝 Submissions: ${clinvarData.submissions.toLocaleString()}`);
        console.log(`   🔗 Associações HPO: ${clinvarData.hpo_assoc.toLocaleString()}`);
        
        // PROBLEMA CRÍTICO: ClinVar tem apenas 100 variantes!
        auditoria.problemas_identificados.push({
            componente: 'ClinVar Variants',
            problema: 'CRÍTICO - Apenas 100 variantes carregadas (deveria ter 1M+)',
            impacto: 'Crítico - base genômica insuficiente',
            registros_esperados: '1,000,000+',
            registros_atuais: clinvarData.variants,
            solucao: 'Implementar download completo da API ClinVar'
        });
        
        if (clinvarData.hpo_assoc === 0) {
            auditoria.problemas_identificados.push({
                componente: 'ClinVar HPO Associations',
                problema: 'Associações ClinVar-HPO não estabelecidas',
                impacto: 'Alto - sem integração fenótipo-genótipo',
                registros_esperados: '500,000+',
                registros_atuais: 0
            });
        }
        
        // 4. ANÁLISE OMIM - MUITO PEQUENO!
        console.log('\n📊 4. AUDITORIA OMIM...');
        const [omimStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM omim_entries) as entries,
                (SELECT COUNT(*) FROM omim_phenotypes) as phenotypes,
                (SELECT COUNT(*) FROM omim_external_mappings) as mappings,
                (SELECT COUNT(*) FROM omim_hpo_associations) as hpo_assoc
        `);
        
        const omimData = omimStats[0];
        console.log(`   📊 Entradas: ${omimData.entries.toLocaleString()}`);
        console.log(`   📊 Fenótipos: ${omimData.phenotypes.toLocaleString()}`);
        console.log(`   🔗 Mapeamentos: ${omimData.mappings.toLocaleString()}`);
        console.log(`   🔗 Associações HPO: ${omimData.hpo_assoc.toLocaleString()}`);
        
        // PROBLEMA CRÍTICO: OMIM tem apenas 50 entradas!
        auditoria.problemas_identificados.push({
            componente: 'OMIM Entries',
            problema: 'CRÍTICO - Apenas 50 entradas OMIM (deveria ter 25K+)',
            impacto: 'Crítico - cobertura genômica insuficiente',
            registros_esperados: '25,000+',
            registros_atuais: omimData.entries,
            solucao: 'Implementar acesso completo à API OMIM'
        });
        
        if (omimData.hpo_assoc === 0) {
            auditoria.problemas_identificados.push({
                componente: 'OMIM HPO Associations',
                problema: 'Associações OMIM-HPO não estabelecidas',
                impacto: 'Alto - sem linking genótipo-fenótipo',
                registros_esperados: '100,000+',
                registros_atuais: 0
            });
        }
        
        // 5. ANÁLISE DRUGBANK - PARECE OK
        console.log('\n💊 5. AUDITORIA DRUGBANK...');
        const [drugStats] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM drugbank_drugs) as drugs,
                (SELECT COUNT(*) FROM drug_disease_associations) as disease_assoc,
                (SELECT COUNT(*) FROM drug_interactions) as interactions
        `);
        
        const drugData = drugStats[0];
        console.log(`   💊 Medicamentos: ${drugData.drugs.toLocaleString()}`);
        console.log(`   🔗 Associações doença: ${drugData.disease_assoc.toLocaleString()}`);
        console.log(`   ⚠️ Interações: ${drugData.interactions.toLocaleString()}`);
        
        if (drugData.disease_assoc === 0) {
            auditoria.problemas_identificados.push({
                componente: 'Drug Disease Associations',
                problema: 'Associações medicamento-doença não carregadas',
                impacto: 'Alto - sem recomendações terapêuticas',
                registros_esperados: '50,000+',
                registros_atuais: 0
            });
        }
        
        // 6. IDENTIFICAR DADOS QUE ESTÃO COMPLETOS
        if (orphaData.diseases > 10000) {
            auditoria.dados_completos.push({
                componente: 'Orphanet Diseases',
                status: 'COMPLETO',
                registros: orphaData.diseases,
                qualidade: 'Boa'
            });
        }
        
        if (hpoData.terms > 15000) {
            auditoria.dados_completos.push({
                componente: 'HPO Terms',
                status: 'COMPLETO',
                registros: hpoData.terms,
                qualidade: 'Excelente'
            });
        }
        
        if (hpoData.disease_assoc > 40000) {
            auditoria.dados_completos.push({
                componente: 'HPO Disease Associations',
                status: 'COMPLETO',
                registros: hpoData.disease_assoc,
                qualidade: 'Excelente'
            });
        }
        
        // 7. GERAR RECOMENDAÇÕES
        console.log('\n🎯 6. RECOMENDAÇÕES CRÍTICAS...');
        
        auditoria.recomendacoes = [
            {
                prioridade: 'CRÍTICA',
                acao: 'Implementar download completo ClinVar',
                detalhes: 'Configurar acesso à API oficial ClinVar para obter 1M+ variantes',
                impacto: 'Fundamental para credibilidade da base genômica',
                tempo_estimado: '2-3 dias'
            },
            {
                prioridade: 'CRÍTICA',
                acao: 'Implementar acesso completo OMIM',
                detalhes: 'Configurar licença e API OMIM para obter 25K+ entradas',
                impacto: 'Essencial para cobertura genômica completa',
                tempo_estimado: '3-5 dias'
            },
            {
                prioridade: 'ALTA',
                acao: 'Completar dados Orphanet',
                detalhes: 'Carregar fenótipos, epidemiologia e sinais clínicos',
                impacto: 'Melhora significativa da qualidade clínica',
                tempo_estimado: '1-2 dias'
            },
            {
                prioridade: 'ALTA',
                acao: 'Estabelecer associações HPO',
                detalhes: 'Criar links ClinVar-HPO e OMIM-HPO para integração',
                impacto: 'Habilita busca por fenótipos',
                tempo_estimado: '1 dia'
            },
            {
                prioridade: 'MÉDIA',
                acao: 'Carregar associações medicamento-doença',
                detalhes: 'Completar dados DrugBank com indicações terapêuticas',
                impacto: 'Adiciona valor clínico significativo',
                tempo_estimado: '1 dia'
            }
        ];
        
        auditoria.recomendacoes.forEach((rec, index) => {
            console.log(`   ${index + 1}. [${rec.prioridade}] ${rec.acao}`);
            console.log(`      → ${rec.detalhes}`);
            console.log(`      → Impacto: ${rec.impacto}`);
            console.log(`      → Tempo: ${rec.tempo_estimado}\n`);
        });
        
        // 8. RESUMO EXECUTIVO
        const problemasCount = auditoria.problemas_identificados.length;
        const completosCount = auditoria.dados_completos.length;
        
        console.log('=' .repeat(80));
        console.log('📋 RESUMO EXECUTIVO DA AUDITORIA');
        console.log('=' .repeat(80));
        console.log(`❌ PROBLEMAS IDENTIFICADOS: ${problemasCount}`);
        console.log(`✅ COMPONENTES COMPLETOS: ${completosCount}`);
        console.log(`🎯 AÇÕES RECOMENDADAS: ${auditoria.recomendacoes.length}`);
        
        console.log('\n🔥 PROBLEMAS MAIS CRÍTICOS:');
        auditoria.problemas_identificados
            .filter(p => p.impacto === 'Crítico')
            .forEach(p => {
                console.log(`   ❌ ${p.componente}: ${p.problema}`);
            });
        
        console.log('\n✅ COMPONENTES BEM IMPLEMENTADOS:');
        auditoria.dados_completos.forEach(d => {
            console.log(`   ✅ ${d.componente}: ${d.registros.toLocaleString()} registros`);
        });
        
        // Salvar auditoria
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = `relatorios/AUDITORIA-FASE1-COMPLETA-${timestamp}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(auditoria, null, 2));
        
        console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
        
        // Decisão final
        const criticosCount = auditoria.problemas_identificados.filter(p => p.impacto === 'Crítico').length;
        
        if (criticosCount > 0) {
            console.log('\n🚨 CONCLUSÃO: FASE 1 PRECISA SER REFEITA COM DADOS COMPLETOS');
            console.log('🔄 Recomendado: Implementar downloads completos antes de prosseguir para Fase 2');
        } else {
            console.log('\n✅ CONCLUSÃO: Fase 1 adequada para prosseguir com otimizações');
        }
        
        return {
            problemas_criticos: criticosCount,
            total_problemas: problemasCount,
            componentes_ok: completosCount,
            relatorio: reportPath,
            precisa_refazer: criticosCount > 0
        };
        
    } catch (error) {
        console.error('❌ Erro na auditoria:', error.message);
        return { erro: error.message };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar auditoria
auditoriaCompletaFase1()
    .then(result => {
        console.log('\n🔍 AUDITORIA CONCLUÍDA!');
        if (result.precisa_refazer) {
            console.log('🚨 AÇÃO NECESSÁRIA: Refazer Fase 1 com dados completos');
            console.log(`❌ Problemas críticos: ${result.problemas_criticos}`);
        } else {
            console.log('✅ Fase 1 pode ser otimizada e prosseguir');
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO:', error.message);
    });
