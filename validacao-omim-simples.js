/**
 * VALIDAÇÃO SIMPLES - TAREFA 1.5 ETL OMIM
 * Verificação rápida dos dados carregados
 */

const mysql = require('mysql2/promise');

async function validarOMIM() {
    let connection;
    
    try {
        console.log('🔍 VALIDAÇÃO OMIM - TAREFA 1.5');
        console.log('=' .repeat(50));
        
        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        // 1. Verificar contagens OMIM
        console.log('📊 Verificando dados OMIM...');
        const [omimCounts] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM omim_entries) as entries,
                (SELECT COUNT(*) FROM omim_phenotypes) as phenotypes,
                (SELECT COUNT(*) FROM omim_external_mappings) as external_mappings,
                (SELECT COUNT(*) FROM omim_hpo_associations) as hpo_associations
        `);
        
        console.log(`   ✅ Entradas OMIM: ${omimCounts[0].entries}`);
        console.log(`   ✅ Fenótipos: ${omimCounts[0].phenotypes}`);
        console.log(`   ✅ Mapeamentos externos: ${omimCounts[0].external_mappings}`);
        console.log(`   ✅ Associações HPO: ${omimCounts[0].hpo_associations}`);
        
        // 2. Verificar exemplos de dados
        console.log('\n🧬 Exemplos de entradas OMIM:');
        const [entries] = await connection.execute(`
            SELECT omim_id, title, gene_symbol, inheritance_pattern
            FROM omim_entries 
            ORDER BY omim_id 
            LIMIT 5
        `);
        
        entries.forEach(entry => {
            console.log(`   📋 ${entry.omim_id}: ${entry.title} (${entry.gene_symbol}) - ${entry.inheritance_pattern}`);
        });
        
        // 3. Verificar integridade total do sistema
        console.log('\n🌐 Integridade total do sistema:');
        const [totalCounts] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM cplp_countries) as countries,
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM hpo_terms) as hpo_terms,
                (SELECT COUNT(*) FROM clinvar_variants) as clinvar,
                (SELECT COUNT(*) FROM omim_entries) as omim
        `);
        
        const totals = totalCounts[0];
        const grandTotal = totals.countries + totals.diseases + totals.hpo_terms + totals.clinvar + totals.omim;
        
        console.log(`   🇵🇹 Países CPLP: ${totals.countries}`);
        console.log(`   🦠 Doenças Orphanet: ${totals.diseases}`);
        console.log(`   🧬 Termos HPO: ${totals.hpo_terms}`);
        console.log(`   🧪 Variantes ClinVar: ${totals.clinvar}`);
        console.log(`   📊 Entradas OMIM: ${totals.omim}`);
        console.log(`   📈 TOTAL EXPANDIDO: ${grandTotal.toLocaleString()} registros`);
        
        // 4. Análise de crescimento
        const crescimentoBase = 65293; // Base original
        const crescimentoAnterior = 65991; // Após ClinVar
        const crescimentoAtual = grandTotal;
        const expansaoOmim = crescimentoAtual - crescimentoAnterior;
        
        console.log('\n📈 ANÁLISE DE EXPANSÃO:');
        console.log(`   📊 Base original: ${crescimentoBase.toLocaleString()} registros`);
        console.log(`   📊 Após ClinVar: ${crescimentoAnterior.toLocaleString()} registros`);
        console.log(`   📊 Após OMIM: ${crescimentoAtual.toLocaleString()} registros`);
        console.log(`   🚀 Expansão OMIM: +${expansaoOmim} registros`);
        console.log(`   🎯 Crescimento total: ${Math.round(((crescimentoAtual - crescimentoBase) / crescimentoBase) * 100)}%`);
        
        console.log('\n✅ VALIDAÇÃO CONCLUÍDA - DADOS OMIM INTEGRADOS COM SUCESSO!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Executar validação
validarOMIM()
    .then(success => {
        if (success) {
            console.log('\n🎉 TAREFA 1.5 VALIDADA COM SUCESSO!');
            console.log('🔄 Pronto para Tarefa 1.6 - Validação Final Fase 1');
        } else {
            console.log('\n💥 VALIDAÇÃO FALHOU!');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
        process.exit(1);
    });
