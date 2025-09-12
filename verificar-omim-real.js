/**
 * VERIFICAÇÃO RÁPIDA - NÚMEROS OMIM REAIS
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarOmim() {
    try {
        console.log('🔍 VERIFICANDO NÚMEROS OMIM REAIS');
        console.log('==================================');

        // Contar entradas OMIM
        const entriesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM omim_entries`;
        const entries = Number(entriesCount[0].count);

        // Contar fenótipos OMIM  
        const phenotypesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM omim_phenotypes`;
        const phenotypes = Number(phenotypesCount[0].count);

        // Estatísticas por tipo de entrada
        const typeStats = await prisma.$queryRaw`
            SELECT entry_type, COUNT(*) as count 
            FROM omim_entries 
            GROUP BY entry_type 
            ORDER BY count DESC
        `;

        console.log(`📊 Entradas OMIM: ${entries.toLocaleString()}`);
        console.log(`🦠 Fenótipos OMIM: ${phenotypes.toLocaleString()}`);
        console.log(`📈 Total OMIM: ${(entries + phenotypes).toLocaleString()}`);
        console.log('');
        console.log('📋 Distribuição por tipo:');
        
        let totalTipos = 0;
        for (const stat of typeStats) {
            const count = Number(stat.count);
            console.log(`   ${stat.entry_type}: ${count.toLocaleString()}`);
            totalTipos += count;
        }
        
        console.log('==================================');
        console.log('🎯 COMPARAÇÃO COM OMIM REAL:');
        console.log('   Meta OMIM Real: 27.000+ entradas');
        console.log('   Meta Genes: 17.570+');
        console.log('   Meta Fenótipos: 9.000+');
        console.log('');
        
        const genes = typeStats.find(s => s.entry_type === 'gene');
        const phenotypeEntries = typeStats.find(s => s.entry_type === 'phenotype');
        
        console.log('📊 NOSSOS NÚMEROS:');
        console.log(`   Entradas: ${entries.toLocaleString()} (${entries >= 27000 ? '✅' : '❌'} Meta: 27K+)`);
        console.log(`   Genes: ${genes ? Number(genes.count).toLocaleString() : '0'} (${genes && Number(genes.count) >= 17570 ? '✅' : '❌'} Meta: 17.570+)`);
        console.log(`   Fenótipos Totais: ${(phenotypes + (phenotypeEntries ? Number(phenotypeEntries.count) : 0)).toLocaleString()} (${(phenotypes + (phenotypeEntries ? Number(phenotypeEntries.count) : 0)) >= 9000 ? '✅' : '❌'} Meta: 9K+)`);
        
        const success = entries >= 27000 && (phenotypes + (phenotypeEntries ? Number(phenotypeEntries.count) : 0)) >= 9000;
        
        console.log('==================================');
        console.log(success ? '🎉 OMIM REALÍSTICO ATINGIDO!' : '⚠️  Ainda precisamos melhorar os números');
        
        return { entries, phenotypes, success };

    } catch (error) {
        console.error('❌ ERRO:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    verificarOmim()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = verificarOmim;
