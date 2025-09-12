const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDados() {
    try {
        console.log('🔍 VERIFICANDO DADOS REAIS NO BANCO...\n');
        
        // Verificar tabelas principais
        const ensemblCount = await prisma.ensembl_genes.count();
        console.log(`🧬 Genes Ensembl: ${ensemblCount.toLocaleString()}`);
        
        const uniprotCount = await prisma.uniprot_proteins.count();
        console.log(`🧬 Proteínas UniProt: ${uniprotCount.toLocaleString()}`);
        
        const expressionCount = await prisma.gene_expression_data.count();
        console.log(`📊 Dados de Expressão: ${expressionCount.toLocaleString()}`);
        
        const emaCount = await prisma.ema_medicines.count();
        console.log(`💊 Medicamentos EMA: ${emaCount.toLocaleString()}`);
        
        const trialsCount = await prisma.eu_clinical_trials.count();
        console.log(`🧪 Ensaios Clínicos EU: ${trialsCount.toLocaleString()}`);
        
        const whoCount = await prisma.who_health_data.count();
        console.log(`🌍 Dados WHO: ${whoCount.toLocaleString()}`);
        
        const totalPhase2 = ensemblCount + uniprotCount + expressionCount + emaCount + trialsCount + whoCount;
        console.log(`\n📊 TOTAL PHASE 2: ${totalPhase2.toLocaleString()} registros`);
        
        // Verificar alguns dados reais
        console.log('\n🔍 AMOSTRAS DE DADOS REAIS:');
        
        const sampleGenes = await prisma.ensembl_genes.findMany({ 
            take: 3,
            select: { ensembl_id: true, gene_symbol: true, gene_name: true, chromosome: true }
        });
        console.log('\n🧬 Genes Ensembl (amostra):');
        sampleGenes.forEach(gene => {
            console.log(`  ${gene.ensembl_id} | ${gene.gene_symbol} | ${gene.gene_name} | Chr${gene.chromosome}`);
        });
        
        const sampleMedicines = await prisma.ema_medicines.findMany({ 
            take: 3,
            select: { medicine_name: true, therapeutic_area: true, orphan_designation: true }
        });
        console.log('\n💊 Medicamentos EMA (amostra):');
        sampleMedicines.forEach(med => {
            console.log(`  ${med.medicine_name} | ${med.therapeutic_area} | Órfão: ${med.orphan_designation ? 'Sim' : 'Não'}`);
        });
        
        const sampleTrials = await prisma.eu_clinical_trials.findMany({ 
            take: 3,
            select: { study_title: true, medical_condition: true, study_phase: true }
        });
        console.log('\n🧪 Ensaios Clínicos (amostra):');
        sampleTrials.forEach(trial => {
            console.log(`  ${trial.study_title.substring(0, 60)}... | ${trial.medical_condition} | ${trial.study_phase}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar dados:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarDados();