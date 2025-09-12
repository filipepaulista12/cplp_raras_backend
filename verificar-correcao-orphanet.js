/**
 * VERIFICAÇÃO PÓS-CORREÇÃO ORPHANET
 * ==================================
 * Script para verificar se a correção funcionou
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCorrecao() {
    try {
        console.log('🔍 VERIFICANDO CORREÇÃO ORPHANET');
        console.log('==================================');

        const [
            totalDiseases,
            totalPhenotypes,
            totalEpidemiology,
            totalClinicalSigns,
            totalGenes,
            totalSummaries,
            totalManagement
        ] = await Promise.all([
            prisma.rareDisease.count(),
            prisma.diseasePhenotype.count(),
            prisma.diseaseEpidemiology.count(),
            prisma.diseaseClinicalSign.count(),
            prisma.diseaseGene.count(),
            prisma.diseaseSummary.count(),
            prisma.diseaseManagement.count()
        ]);

        console.log('📊 CONTAGENS ATUAIS:');
        console.log(`   🦠 Doenças totais: ${totalDiseases.toLocaleString()}`);
        console.log(`   📊 Fenótipos: ${totalPhenotypes.toLocaleString()}`);
        console.log(`   📊 Epidemiologia: ${totalEpidemiology.toLocaleString()}`);
        console.log(`   📊 Sinais clínicos: ${totalClinicalSigns.toLocaleString()}`);
        console.log(`   🧬 Genes: ${totalGenes.toLocaleString()}`);
        console.log(`   📄 Resumos: ${totalSummaries.toLocaleString()}`);
        console.log(`   🏥 Manejo: ${totalManagement.toLocaleString()}`);

        const totalDados = totalPhenotypes + totalEpidemiology + totalClinicalSigns + totalGenes + totalSummaries + totalManagement;
        console.log(`   📈 TOTAL DADOS ORPHANET: ${totalDados.toLocaleString()}`);

        // Verificar algumas amostras
        console.log('\n🔍 AMOSTRAS DE DADOS:');
        
        const phenotypeSample = await prisma.diseasePhenotype.findFirst({
            include: { disease: { select: { name: true } } }
        });
        
        if (phenotypeSample) {
            console.log(`   📊 Fenótipo exemplo: ${phenotypeSample.phenotype} (${phenotypeSample.disease.name})`);
        }

        const epidemiologySample = await prisma.diseaseEpidemiology.findFirst({
            include: { disease: { select: { name: true } } }
        });
        
        if (epidemiologySample) {
            console.log(`   📊 Epidemiologia exemplo: ${epidemiologySample.type} - ${epidemiologySample.value}`);
        }

        // Status final
        console.log('\n🎯 STATUS DA CORREÇÃO:');
        if (totalDados > 50000) {
            console.log('✅ SUCESSO COMPLETO - Dados massivos carregados!');
        } else if (totalDados > 10000) {
            console.log('⚠️ SUCESSO PARCIAL - Alguns dados carregados');
        } else if (totalDados > 0) {
            console.log('🔄 SUCESSO MÍNIMO - Poucos dados carregados');
        } else {
            console.log('❌ FALHA - Nenhum dado carregado');
        }

        console.log('\n==================================');
        
        return totalDados;

    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
        return 0;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
if (require.main === module) {
    verificarCorrecao()
        .then((total) => {
            console.log(`\n📊 Total final: ${total.toLocaleString()} registros`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = verificarCorrecao;
