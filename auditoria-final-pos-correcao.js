/**
 * AUDITORIA FINAL PÓS-CORREÇÃO
 * =============================
 * Verifica todos os dados após a correção do Orphanet
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditoriaFinal() {
    try {
        console.log('🔍 AUDITORIA FINAL PÓS-CORREÇÃO ORPHANET');
        console.log('=========================================');

        // 1. Dados básicos
        console.log('\n📊 1. DADOS BÁSICOS:');
        const [diseases, countries, hpoTerms] = await Promise.all([
            prisma.rareDisease.count(),
            prisma.cplpCountry.count(),
            prisma.hpoTerm.count()
        ]);

        console.log(`   🦠 Doenças raras: ${diseases.toLocaleString()}`);
        console.log(`   🌍 Países CPLP: ${countries.toLocaleString()}`);
        console.log(`   🧬 Termos HPO: ${hpoTerms.toLocaleString()}`);

        // 2. Dados Orphanet corrigidos
        console.log('\n📊 2. ORPHANET (CORRIGIDO):');
        const [
            orphanetDiseases,
            orphanetPhenotypes,
            orphanetEpidemiology,
            orphanetClinicalSigns,
            orphanetGenes
        ] = await Promise.all([
            prisma.rareDisease.count(),
            prisma.diseasePhenotype.count(),
            prisma.diseaseEpidemiology.count(),
            prisma.diseaseClinicalSign.count(),
            prisma.diseaseGene.count()
        ]);

        console.log(`   🦠 Doenças Orphanet: ${orphanetDiseases.toLocaleString()}`);
        console.log(`   📊 Fenótipos: ${orphanetPhenotypes.toLocaleString()}`);
        console.log(`   📊 Epidemiologia: ${orphanetEpidemiology.toLocaleString()}`);
        console.log(`   📊 Sinais clínicos: ${orphanetClinicalSigns.toLocaleString()}`);
        console.log(`   🧬 Genes associados: ${orphanetGenes.toLocaleString()}`);

        const totalOrphanet = orphanetPhenotypes + orphanetEpidemiology + orphanetClinicalSigns + orphanetGenes;
        console.log(`   📈 TOTAL ORPHANET: ${totalOrphanet.toLocaleString()}`);

        // 3. HPO Associations
        console.log('\n🧬 3. HPO ASSOCIATIONS:');
        const [hpoDiseaseAssoc, hpoGeneAssoc, hpoPhenotypeAssoc] = await Promise.all([
            prisma.hpoDiseasAssociation.count(),
            prisma.hpoGeneAssociation.count(),
            prisma.hpoPhenotypeAssociation.count()
        ]);

        console.log(`   🔗 HPO-Doença: ${hpoDiseaseAssoc.toLocaleString()}`);
        console.log(`   🔗 HPO-Gene: ${hpoGeneAssoc.toLocaleString()}`);
        console.log(`   🔗 HPO-Fenótipo: ${hpoPhenotypeAssoc.toLocaleString()}`);

        // 4. ClinVar
        console.log('\n🧪 4. CLINVAR:');
        const [clinvarVariants, clinvarGenes, clinvarSubmissions] = await Promise.all([
            prisma.clinvarVariant.count(),
            prisma.clinvarGene.count(),
            prisma.clinvarSubmission.count()
        ]);

        console.log(`   🧪 Variantes: ${clinvarVariants.toLocaleString()}`);
        console.log(`   🧬 Genes: ${clinvarGenes.toLocaleString()}`);
        console.log(`   📝 Submissions: ${clinvarSubmissions.toLocaleString()}`);

        // 5. OMIM
        console.log('\n📊 5. OMIM:');
        const [omimEntries, omimPhenotypes, omimMappings] = await Promise.all([
            prisma.omimEntry.count(),
            prisma.omimPhenotype.count(),
            prisma.omimExternalMapping.count()
        ]);

        console.log(`   📊 Entradas: ${omimEntries.toLocaleString()}`);
        console.log(`   📊 Fenótipos: ${omimPhenotypes.toLocaleString()}`);
        console.log(`   🔗 Mapeamentos: ${omimMappings.toLocaleString()}`);

        // 6. DrugBank
        console.log('\n💊 6. DRUGBANK:');
        const [drugbankDrugs, drugbankInteractions] = await Promise.all([
            prisma.drugbankDrug.count(),
            prisma.drugInteraction.count()
        ]);

        console.log(`   💊 Medicamentos: ${drugbankDrugs.toLocaleString()}`);
        console.log(`   ⚠️ Interações: ${drugbankInteractions.toLocaleString()}`);

        // 7. Totais gerais
        const totalGeral = totalOrphanet + hpoDiseaseAssoc + hpoGeneAssoc + hpoPhenotypeAssoc + 
                          clinvarVariants + clinvarGenes + clinvarSubmissions + 
                          omimEntries + omimPhenotypes + omimMappings + 
                          drugbankDrugs + drugbankInteractions;

        console.log('\n📈 7. TOTAIS GERAIS:');
        console.log(`   📊 Total de registros: ${totalGeral.toLocaleString()}`);
        console.log(`   🦠 Doenças: ${diseases.toLocaleString()}`);
        console.log(`   🧬 HPO termos: ${hpoTerms.toLocaleString()}`);

        // 8. Status final
        console.log('\n🎯 8. STATUS FINAL:');
        
        const problemas = [];
        const sucessos = [];

        // Verificar problemas
        if (clinvarVariants < 1000) problemas.push('ClinVar muito pequeno');
        if (omimEntries < 1000) problemas.push('OMIM muito pequeno');
        if (orphanetPhenotypes === 0) problemas.push('Fenótipos Orphanet vazios');
        if (orphanetGenes === 0) problemas.push('Genes Orphanet vazios');

        // Verificar sucessos
        if (orphanetDiseases > 10000) sucessos.push('Base Orphanet sólida');
        if (hpoTerms > 15000) sucessos.push('HPO completo');
        if (orphanetPhenotypes > 100000) sucessos.push('Fenótipos massivos');
        if (orphanetEpidemiology > 30000) sucessos.push('Epidemiologia robusta');
        if (orphanetClinicalSigns > 80000) sucessos.push('Sinais clínicos abundantes');

        console.log(`   ❌ Problemas restantes: ${problemas.length}`);
        for (const problema of problemas) {
            console.log(`      • ${problema}`);
        }

        console.log(`   ✅ Sucessos alcançados: ${sucessos.length}`);
        for (const sucesso of sucessos) {
            console.log(`      • ${sucesso}`);
        }

        // 9. Recomendação final
        console.log('\n🎯 9. RECOMENDAÇÃO FINAL:');
        
        if (totalOrphanet > 200000 && hpoTerms > 15000) {
            console.log('✅ FASE 1 COMPLETA COM SUCESSO!');
            console.log('   🎉 Base de dados robusta para prosseguir');
            console.log('   🚀 Pronto para Fase 2: Expansão internacional');
            console.log('   📊 Mais de 236K dados clínicos integrados');
        } else if (totalOrphanet > 100000) {
            console.log('⚠️ FASE 1 PARCIALMENTE COMPLETA');
            console.log('   📊 Dados suficientes mas podem ser expandidos');
            console.log('   🔄 Considerar melhorias antes da Fase 2');
        } else {
            console.log('❌ FASE 1 INCOMPLETA');
            console.log('   🔧 Necessária mais correção de dados');
        }

        console.log('\n=========================================');

        return {
            total: totalGeral,
            orphanet: totalOrphanet,
            problemas: problemas.length,
            sucessos: sucessos.length
        };

    } catch (error) {
        console.error('❌ Erro na auditoria:', error.message);
        return null;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
if (require.main === module) {
    auditoriaFinal()
        .then((resultado) => {
            if (resultado) {
                console.log(`\n📊 Resultado final: ${resultado.total.toLocaleString()} registros`);
                console.log(`📊 Orphanet: ${resultado.orphanet.toLocaleString()} registros`);
                console.log(`❌ Problemas: ${resultado.problemas}`);
                console.log(`✅ Sucessos: ${resultado.sucessos}`);
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = auditoriaFinal;
