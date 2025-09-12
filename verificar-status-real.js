/**
 * 🔍 VERIFICAÇÃO REAL ATUAL: Status VERDADEIRO do Prisma
 * Checando se as importações realmente funcionaram
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarStatusReal() {
    console.log('🔍 VERIFICAÇÃO REAL ATUAL DO PRISMA');
    console.log('=' + '='.repeat(50));
    
    try {
        console.log('✅ Conectando ao Prisma...');
        
        // Contar TODOS os registros
        const counts = {
            cplpCountry: await prisma.cplpCountry.count(),
            rareDisease: await prisma.rareDisease.count(),
            hpoTerm: await prisma.hpoTerm.count(),
            drugbankDrug: await prisma.drugbankDrug.count(),
            drugInteraction: await prisma.drugInteraction.count(),
            hpoDiseasAssociation: await prisma.hpoDiseasAssociation.count(),
            hpoGeneAssociation: await prisma.hpoGeneAssociation.count(),
            drugDiseaseAssociation: await prisma.drugDiseaseAssociation.count()
        };
        
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        
        console.log('\n💎 STATUS REAL ATUAL DO PRISMA:');
        console.log('=' + '='.repeat(50));
        console.log(`📍 CPLP Countries: ${counts.cplpCountry.toLocaleString()}`);
        console.log(`🧬 HPO Terms: ${counts.hpoTerm.toLocaleString()}`);
        console.log(`🏥 Rare Diseases: ${counts.rareDisease.toLocaleString()}`);
        console.log(`💊 Drugbank Drugs: ${counts.drugbankDrug.toLocaleString()}`);
        console.log(`🔄 Drug Interactions: ${counts.drugInteraction.toLocaleString()}`);
        console.log(`🔗 HPO-Disease Assoc: ${counts.hpoDiseasAssociation.toLocaleString()}`);
        console.log(`🧬 HPO-Gene Assoc: ${counts.hpoGeneAssociation.toLocaleString()}`);
        console.log(`💊 Drug-Disease Assoc: ${counts.drugDiseaseAssociation.toLocaleString()}`);
        console.log(`📊 TOTAL GERAL: ${total.toLocaleString()}`);
        
        console.log('\n🎯 ANÁLISE DETALHADA:');
        console.log('=' + '='.repeat(30));
        
        if (counts.hpoTerm > 19000) {
            console.log('✅ HPO Terms: IMPORTADOS COM SUCESSO!');
        } else if (counts.hpoTerm > 0) {
            console.log('⚠️  HPO Terms: PARCIALMENTE IMPORTADOS');
        } else {
            console.log('❌ HPO Terms: NÃO IMPORTADOS');
        }
        
        if (counts.drugbankDrug > 400) {
            console.log('✅ Drugbank Drugs: IMPORTADOS COM SUCESSO!');
        } else if (counts.drugbankDrug > 0) {
            console.log('⚠️  Drugbank Drugs: PARCIALMENTE IMPORTADOS');
        } else {
            console.log('❌ Drugbank Drugs: NÃO IMPORTADOS');
        }
        
        if (counts.drugInteraction > 180) {
            console.log('✅ Drug Interactions: IMPORTADOS COM SUCESSO!');
        } else if (counts.drugInteraction > 0) {
            console.log('⚠️  Drug Interactions: PARCIALMENTE IMPORTADOS');
        } else {
            console.log('❌ Drug Interactions: NÃO IMPORTADOS');
        }
        
        if (counts.hpoDiseasAssociation > 1000) {
            console.log('✅ HPO-Disease Assoc: IMPORTADOS COM SUCESSO!');
        } else if (counts.hpoDiseasAssociation > 0) {
            console.log('⚠️  HPO-Disease Assoc: PARCIALMENTE IMPORTADOS');
        } else {
            console.log('❌ HPO-Disease Assoc: NÃO IMPORTADOS');
        }
        
        if (counts.hpoGeneAssociation > 1000) {
            console.log('✅ HPO-Gene Assoc: IMPORTADOS COM SUCESSO!');
        } else if (counts.hpoGeneAssociation > 0) {
            console.log('⚠️  HPO-Gene Assoc: PARCIALMENTE IMPORTADOS');
        } else {
            console.log('❌ HPO-Gene Assoc: NÃO IMPORTADOS');
        }
        
        // Mostrar alguns exemplos dos dados importados
        console.log('\n📋 EXEMPLOS DOS DADOS IMPORTADOS:');
        console.log('=' + '='.repeat(40));
        
        if (counts.hpoTerm > 0) {
            const hpoSample = await prisma.hpoTerm.findMany({ take: 3 });
            console.log('\n🧬 HPO Terms (amostra):');
            hpoSample.forEach((hpo, i) => {
                console.log(`   [${i+1}] ${hpo.hpo_id}: ${hpo.name}`);
            });
        }
        
        if (counts.drugbankDrug > 0) {
            const drugSample = await prisma.drugbankDrug.findMany({ take: 3 });
            console.log('\n💊 Drugbank Drugs (amostra):');
            drugSample.forEach((drug, i) => {
                console.log(`   [${i+1}] ${drug.drugbank_id}: ${drug.name}`);
            });
        }
        
        if (counts.drugInteraction > 0) {
            const interactionSample = await prisma.drugInteraction.findMany({ take: 3 });
            console.log('\n🔄 Drug Interactions (amostra):');
            interactionSample.forEach((interaction, i) => {
                console.log(`   [${i+1}] ${interaction.drug1_id} ↔ ${interaction.drug2_id}`);
                console.log(`       Severidade: ${interaction.severity}`);
            });
        }
        
        console.log('\n🏆 CONCLUSÃO:');
        console.log('=' + '='.repeat(20));
        
        const successfulImports = [
            counts.hpoTerm > 19000,
            counts.drugbankDrug > 400,
            counts.drugInteraction > 180
        ].filter(Boolean).length;
        
        if (successfulImports === 3) {
            console.log('🎉 TODAS AS IMPORTAÇÕES FORAM SUCESSO!');
            console.log('✅ O relatório anterior estava desatualizado');
            console.log('💎 Sistema está com dados científicos completos');
        } else if (successfulImports >= 2) {
            console.log('✅ MAIORIA DAS IMPORTAÇÕES FORAM SUCESSO!');
            console.log('📊 Progresso significativo alcançado');
        } else if (successfulImports >= 1) {
            console.log('⚠️  ALGUMAS IMPORTAÇÕES FORAM SUCESSO');
            console.log('🔧 Ainda há trabalho a fazer');
        } else {
            console.log('❌ IMPORTAÇÕES NÃO FORAM EFETIVAS');
            console.log('🔧 Precisamos investigar os problemas');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// EXECUTAR VERIFICAÇÃO REAL
verificarStatusReal().then(() => {
    console.log('\n🔍 VERIFICAÇÃO REAL CONCLUÍDA!');
}).catch(err => {
    console.error('💥 ERRO NA VERIFICAÇÃO:', err.message);
});
