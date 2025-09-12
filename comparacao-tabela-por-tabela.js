/**
 * 📊 COMPARAÇÃO DETALHADA: MySQL vs Prisma (Tabela por Tabela)
 * Análise completa de todos os dados sincronizados
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function compararTabelasPorTabela() {
    console.log('📊 COMPARAÇÃO DETALHADA: MYSQL vs PRISMA');
    console.log('=' + '='.repeat(70));
    console.log('🎯 ANÁLISE TABELA POR TABELA');
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. CONTAGENS DETALHADAS MYSQL
        console.log('\n🗄️  CONTAGENS MYSQL (SERVIDOR LOCAL):');
        console.log('-' + '-'.repeat(50));
        
        const mysqlQueries = [
            'SELECT COUNT(*) as count FROM cplp_countries',
            'SELECT COUNT(*) as count FROM hpo_terms',
            'SELECT COUNT(*) as count FROM orpha_diseases',
            'SELECT COUNT(*) as count FROM drugbank_drugs',
            'SELECT COUNT(*) as count FROM drug_interactions',
            'SELECT COUNT(*) as count FROM hpo_disease_associations',
            'SELECT COUNT(*) as count FROM hpo_gene_associations'
        ];
        
        const mysqlTables = [
            'cplp_countries',
            'hpo_terms', 
            'orpha_diseases',
            'drugbank_drugs',
            'drug_interactions',
            'hpo_disease_associations',
            'hpo_gene_associations'
        ];
        
        const mysqlCounts = {};
        let totalMysql = 0;
        
        for (let i = 0; i < mysqlQueries.length; i++) {
            const [result] = await mysqlConn.query(mysqlQueries[i]);
            const count = result[0].count;
            mysqlCounts[mysqlTables[i]] = count;
            totalMysql += count;
            console.log(`   📋 ${mysqlTables[i]}: ${count.toLocaleString()}`);
        }
        
        console.log(`   🎯 TOTAL MYSQL: ${totalMysql.toLocaleString()}`);
        
        // 2. CONTAGENS DETALHADAS PRISMA
        console.log('\n💎 CONTAGENS PRISMA (SQLITE LOCAL):');
        console.log('-' + '-'.repeat(50));
        
        const prismaCounts = {
            cplp_countries: await prisma.cplpCountry.count(),
            hpo_terms: await prisma.hpoTerm.count(),
            rare_diseases: await prisma.rareDisease.count(),
            drugbank_drugs: await prisma.drugbankDrug.count(),
            drug_interactions: await prisma.drugInteraction.count(),
            hpo_disease_associations: await prisma.hpoDiseasAssociation.count(),
            hpo_gene_associations: await prisma.hpoGeneAssociation.count()
        };
        
        const prismaLabels = [
            'cplp_countries',
            'hpo_terms',
            'rare_diseases (≈ orpha_diseases)',
            'drugbank_drugs',
            'drug_interactions', 
            'hpo_disease_associations',
            'hpo_gene_associations'
        ];
        
        let totalPrisma = 0;
        Object.entries(prismaCounts).forEach(([table, count], i) => {
            totalPrisma += count;
            console.log(`   📋 ${prismaLabels[i]}: ${count.toLocaleString()}`);
        });
        
        console.log(`   🎯 TOTAL PRISMA: ${totalPrisma.toLocaleString()}`);
        
        // 3. COMPARAÇÃO DETALHADA
        console.log('\n🔍 COMPARAÇÃO DETALHADA POR TABELA:');
        console.log('=' + '='.repeat(70));
        
        const comparisons = [
            { 
                mysql: 'cplp_countries', 
                prisma: 'cplp_countries',
                mysqlCount: mysqlCounts.cplp_countries,
                prismaCount: prismaCounts.cplp_countries
            },
            { 
                mysql: 'hpo_terms', 
                prisma: 'hpo_terms',
                mysqlCount: mysqlCounts.hpo_terms,
                prismaCount: prismaCounts.hpo_terms
            },
            { 
                mysql: 'orpha_diseases', 
                prisma: 'rare_diseases',
                mysqlCount: mysqlCounts.orpha_diseases,
                prismaCount: prismaCounts.rare_diseases
            },
            { 
                mysql: 'drugbank_drugs', 
                prisma: 'drugbank_drugs',
                mysqlCount: mysqlCounts.drugbank_drugs,
                prismaCount: prismaCounts.drugbank_drugs
            },
            { 
                mysql: 'drug_interactions', 
                prisma: 'drug_interactions',
                mysqlCount: mysqlCounts.drug_interactions,
                prismaCount: prismaCounts.drug_interactions
            },
            { 
                mysql: 'hpo_disease_associations', 
                prisma: 'hpo_disease_associations',
                mysqlCount: mysqlCounts.hpo_disease_associations,
                prismaCount: prismaCounts.hpo_disease_associations
            },
            { 
                mysql: 'hpo_gene_associations', 
                prisma: 'hpo_gene_associations',
                mysqlCount: mysqlCounts.hpo_gene_associations,
                prismaCount: prismaCounts.hpo_gene_associations
            }
        ];
        
        let perfectMatches = 0;
        let highMatches = 0;
        let mediumMatches = 0;
        let lowMatches = 0;
        
        comparisons.forEach((comp, i) => {
            const percent = comp.mysqlCount > 0 ? ((comp.prismaCount / comp.mysqlCount) * 100) : 0;
            const percentStr = percent.toFixed(1);
            
            let status = '';
            let icon = '';
            
            if (percent >= 99) {
                status = 'PERFEITO';
                icon = '🎉';
                perfectMatches++;
            } else if (percent >= 90) {
                status = 'EXCELENTE';
                icon = '✅';
                highMatches++;
            } else if (percent >= 70) {
                status = 'BOM';
                icon = '🟢';
                mediumMatches++;
            } else if (percent >= 50) {
                status = 'MÉDIO';
                icon = '🟡';
                mediumMatches++;
            } else if (percent >= 20) {
                status = 'BAIXO';
                icon = '🟠';
                lowMatches++;
            } else {
                status = 'CRÍTICO';
                icon = '🔴';
                lowMatches++;
            }
            
            console.log(`\n${i + 1}. ${icon} ${status} - ${percentStr}%`);
            console.log(`   📊 MySQL: ${comp.mysql}`);
            console.log(`   📊 Prisma: ${comp.prisma}`);
            console.log(`   🔢 MySQL: ${comp.mysqlCount.toLocaleString()}`);
            console.log(`   🔢 Prisma: ${comp.prismaCount.toLocaleString()}`);
            console.log(`   📈 Sincronização: ${percentStr}%`);
            
            if (percent < 100) {
                const missing = comp.mysqlCount - comp.prismaCount;
                console.log(`   ❌ Faltando: ${missing.toLocaleString()}`);
            }
        });
        
        // 4. RESUMO ESTATÍSTICO
        console.log('\n📈 RESUMO ESTATÍSTICO:');
        console.log('=' + '='.repeat(50));
        
        const totalSync = ((totalPrisma / totalMysql) * 100).toFixed(1);
        
        console.log(`📊 Sincronização Geral: ${totalSync}%`);
        console.log(`📊 Total MySQL: ${totalMysql.toLocaleString()}`);
        console.log(`📊 Total Prisma: ${totalPrisma.toLocaleString()}`);
        console.log(`📊 Diferença: ${(totalMysql - totalPrisma).toLocaleString()}`);
        
        console.log('\n🎯 DISTRIBUIÇÃO POR QUALIDADE:');
        console.log(`   🎉 Perfeitas (99-100%): ${perfectMatches} tabelas`);
        console.log(`   ✅ Excelentes (90-99%): ${highMatches} tabelas`);
        console.log(`   🟢 Boas (70-89%): ${mediumMatches} tabelas`);
        console.log(`   🟠 Baixas (20-69%): ${lowMatches} tabelas`);
        
        // 5. ANÁLISE POR CATEGORIA
        console.log('\n🔬 ANÁLISE POR CATEGORIA CIENTÍFICA:');
        console.log('=' + '='.repeat(50));
        
        // Dados Básicos Científicos
        const basicScientificMySQL = mysqlCounts.hpo_terms + mysqlCounts.orpha_diseases + 
                                    mysqlCounts.drugbank_drugs + mysqlCounts.drug_interactions;
        const basicScientificPrisma = prismaCounts.hpo_terms + prismaCounts.rare_diseases + 
                                     prismaCounts.drugbank_drugs + prismaCounts.drug_interactions;
        const basicSync = ((basicScientificPrisma / basicScientificMySQL) * 100).toFixed(1);
        
        console.log(`🧬 DADOS CIENTÍFICOS BÁSICOS:`);
        console.log(`   📊 MySQL: ${basicScientificMySQL.toLocaleString()}`);
        console.log(`   📊 Prisma: ${basicScientificPrisma.toLocaleString()}`);
        console.log(`   📈 Sincronização: ${basicSync}%`);
        
        // Associações Científicas
        const associationsMySQL = mysqlCounts.hpo_disease_associations + mysqlCounts.hpo_gene_associations;
        const associationsPrisma = prismaCounts.hpo_disease_associations + prismaCounts.hpo_gene_associations;
        const assocSync = ((associationsPrisma / associationsMySQL) * 100).toFixed(1);
        
        console.log(`\n🔗 ASSOCIAÇÕES CIENTÍFICAS:`);
        console.log(`   📊 MySQL: ${associationsMySQL.toLocaleString()}`);
        console.log(`   📊 Prisma: ${associationsPrisma.toLocaleString()}`);
        console.log(`   📈 Sincronização: ${assocSync}%`);
        
        // 6. ANÁLISE DE PROBLEMAS
        console.log('\n⚠️  ANÁLISE DE PROBLEMAS IDENTIFICADOS:');
        console.log('=' + '='.repeat(50));
        
        const hpoDiseaseDiff = mysqlCounts.hpo_disease_associations - prismaCounts.hpo_disease_associations;
        const hpoGenePercent = ((prismaCounts.hpo_gene_associations / mysqlCounts.hpo_gene_associations) * 100).toFixed(1);
        
        console.log(`🔴 HPO-Disease Associations:`);
        console.log(`   📊 Faltando: ${hpoDiseaseDiff.toLocaleString()} associações (${((hpoDiseaseDiff/mysqlCounts.hpo_disease_associations)*100).toFixed(1)}%)`);
        console.log(`   💡 Causa: Códigos OMIM sem mapeamento ORPHA completo`);
        console.log(`   🎯 Atual: ${prismaCounts.hpo_disease_associations.toLocaleString()} de ${mysqlCounts.hpo_disease_associations.toLocaleString()}`);
        
        console.log(`\n✅ HPO-Gene Associations:`);
        console.log(`   📊 Sincronização: ${hpoGenePercent}%`);
        console.log(`   💡 Status: ${hpoGenePercent >= 99 ? 'Completa' : 'Quase completa'}`);
        
        // 7. CONCLUSÕES E RECOMENDAÇÕES
        console.log('\n🎯 CONCLUSÕES E RECOMENDAÇÕES:');
        console.log('=' + '='.repeat(50));
        
        if (perfectMatches >= 5) {
            console.log('🎉 EXCELENTE: Maioria das tabelas sincronizadas perfeitamente!');
        } else if (perfectMatches + highMatches >= 5) {
            console.log('✅ MUITO BOM: Sistema altamente sincronizado!');
        } else if (totalSync >= 60) {
            console.log('🟢 BOM: Sistema bem sincronizado com algumas limitações!');
        } else {
            console.log('🟡 MÉDIO: Sistema funcional mas com sincronização limitada!');
        }
        
        console.log('\n💡 PRÓXIMOS PASSOS RECOMENDADOS:');
        if (hpoDiseaseDiff > 30000) {
            console.log('   1. 🎯 Expandir mapeamentos OMIM → ORPHA');
            console.log('   2. 🔍 Investigar códigos DECIPHER e outros');
            console.log('   3. 📊 Considerar importação de códigos OMIM diretamente');
        }
        
        if (basicSync >= 99) {
            console.log('   ✅ Dados científicos básicos: COMPLETOS');
        }
        
        if (prismaCounts.hpo_gene_associations >= 20000) {
            console.log('   ✅ Associações genéticas: FUNCIONAIS');
        }
        
        console.log('\n🏆 AVALIAÇÃO FINAL:');
        if (totalSync >= 80) {
            console.log('🎉🎉🎉 SISTEMA ALTAMENTE FUNCIONAL! 🎉🎉🎉');
            console.log('💎 Pronto para pesquisa científica avançada!');
        } else if (totalSync >= 60) {
            console.log('🎉🎉 SISTEMA FUNCIONAL! 🎉🎉');
            console.log('🔬 Adequado para pesquisa científica!');
        } else if (totalSync >= 40) {
            console.log('🎉 SISTEMA BÁSICO FUNCIONAL! 🎉');
            console.log('📊 Dados científicos essenciais disponíveis!');
        } else {
            console.log('⚠️  Sistema com limitações - melhorias necessárias');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR COMPARAÇÃO
compararTabelasPorTabela().then(() => {
    console.log('\n🏆🏆🏆 COMPARAÇÃO DETALHADA CONCLUÍDA! 🏆🏆🏆');
    console.log('📊 ANÁLISE COMPLETA TABELA POR TABELA FINALIZADA!');
}).catch(err => {
    console.error('💥 ERRO:', err.message);
});
