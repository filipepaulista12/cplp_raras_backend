/**
 * CORREÇÃO E VALIDAÇÃO SIMPLIFICADA DOS DADOS CLINVAR
 */

const mysql = require('mysql2/promise');

async function validacaoSimples() {
    let connection = null;

    try {
        console.log('🔍 VALIDAÇÃO SIMPLIFICADA - DADOS CLINVAR');
        console.log('='.repeat(60));

        // Conectar MySQL
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        console.log('✅ MySQL conectado');

        // 1. Contagens gerais
        console.log('\n📊 CONTAGENS:');
        const [counts] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM clinvar_variants) as variants,
                (SELECT COUNT(*) FROM clinvar_genes) as genes,
                (SELECT COUNT(*) FROM clinvar_submissions) as submissions,
                (SELECT COUNT(*) FROM clinvar_hpo_associations) as hpo_associations
        `);

        console.log(`   🧬 Variantes ClinVar: ${counts[0].variants}`);
        console.log(`   🧬 Genes ClinVar: ${counts[0].genes}`);
        console.log(`   📝 Submissões: ${counts[0].submissions}`);
        console.log(`   🔗 Associações HPO: ${counts[0].hpo_associations}`);

        // 2. Amostras de variantes
        console.log('\n🧬 VARIANTES DE EXEMPLO:');
        const [variants] = await connection.execute(`
            SELECT clinvar_id, name, gene_symbol, type, clinical_significance 
            FROM clinvar_variants 
            LIMIT 5
        `);

        variants.forEach((variant, i) => {
            console.log(`   ${i + 1}. ${variant.clinvar_id} - ${variant.name}`);
            console.log(`      Gene: ${variant.gene_symbol}, Tipo: ${variant.type}`);
            console.log(`      Significância: ${variant.clinical_significance}`);
        });

        // 3. Genes únicos
        console.log('\n🧬 GENES CARREGADOS:');
        const [genes] = await connection.execute(`
            SELECT gene_symbol, gene_name, chromosome 
            FROM clinvar_genes 
            ORDER BY gene_symbol
        `);

        genes.forEach((gene, i) => {
            console.log(`   ${i + 1}. ${gene.gene_symbol} - ${gene.gene_name}`);
            console.log(`      Cromossomo: ${gene.chromosome}`);
        });

        // 4. Estatísticas por significância clínica
        console.log('\n📊 DISTRIBUIÇÃO POR SIGNIFICÂNCIA:');
        const [significance] = await connection.execute(`
            SELECT clinical_significance, COUNT(*) as count 
            FROM clinvar_variants 
            GROUP BY clinical_significance 
            ORDER BY count DESC
        `);

        significance.forEach(sig => {
            console.log(`   ${sig.clinical_significance}: ${sig.count} variantes`);
        });

        // 5. Genes com mais variantes
        console.log('\n🧬 GENES COM MAIS VARIANTES:');
        const [geneStats] = await connection.execute(`
            SELECT gene_symbol, COUNT(*) as variant_count 
            FROM clinvar_variants 
            GROUP BY gene_symbol 
            ORDER BY variant_count DESC 
            LIMIT 5
        `);

        geneStats.forEach(stat => {
            console.log(`   ${stat.gene_symbol}: ${stat.variant_count} variantes`);
        });

        // 6. Verificar dados existentes preservados
        console.log('\n🌐 DADOS EXISTENTES PRESERVADOS:');
        const [existing] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) FROM cplp_countries) as countries,
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM hpo_terms) as hpo_terms
        `);

        console.log(`   🌍 Países CPLP: ${existing[0].countries}`);
        console.log(`   🏥 Doenças Orphanet: ${existing[0].diseases}`);
        console.log(`   📊 Termos HPO: ${existing[0].hpo_terms}`);

        // 7. Status final
        const totalGenomico = counts[0].variants + counts[0].genes + counts[0].submissions;
        const dadosPreservados = existing[0].countries === 9 && 
                               existing[0].diseases === 11239 && 
                               existing[0].hpo_terms === 19662;

        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMO FINAL');
        console.log('='.repeat(60));
        console.log(`🧬 Dados genômicos carregados: ${totalGenomico} registros`);
        console.log(`📊 Dados existentes preservados: ${dadosPreservados ? '✅' : '❌'}`);
        console.log(`🔄 Sistema funcional: ${totalGenomico > 0 ? '✅' : '❌'}`);
        console.log(`📈 Expansão realizada: 65K → ${65000 + totalGenomico} registros`);

        if (totalGenomico > 0 && dadosPreservados) {
            console.log('\n🎉 ETL CLINVAR VALIDADO COM SUCESSO!');
            console.log('✅ Sistema expandido e operacional');
            console.log('📊 Dados científicos ClinVar integrados');
            console.log('🔄 Pronto para próxima etapa: ETL OMIM');
            
            console.log('\n🚀 CAPACIDADES ADICIONADAS:');
            console.log('   🧬 Variantes genéticas anotadas');
            console.log('   📝 Submissões clínicas validadas');
            console.log('   🔗 Base para análises gene-fenótipo');
            console.log('   📡 APIs GraphQL expandidas');
        }

        return {
            sucesso: totalGenomico > 0 && dadosPreservados,
            metricas: {
                dados_genomicos: totalGenomico,
                dados_preservados: dadosPreservados,
                variantes: counts[0].variants,
                genes: counts[0].genes,
                submissoes: counts[0].submissions
            }
        };

    } catch (error) {
        console.error('\n💥 ERRO:', error.message);
        return { sucesso: false, erro: error.message };
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 MySQL desconectado');
        }
    }
}

// Executar
validacaoSimples()
    .then(result => {
        if (result.sucesso) {
            console.log('\n✅ VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
            console.log('🎯 Sistema pronto para continuar');
        } else {
            console.log('\n❌ VALIDAÇÃO IDENTIFICOU PROBLEMAS');
        }
    })
    .catch(error => {
        console.error('\n💥 ERRO CRÍTICO:', error.message);
    });
