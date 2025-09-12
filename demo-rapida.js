const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function demonstrarDadosReais() {
    try {
        console.log('🎯 DADOS REAIS - ÚLTIMAS AMOSTRAS:\n');
        
        // Genes reais
        const genes = await prisma.$queryRaw`SELECT ensembl_id, gene_symbol, gene_name, chromosome FROM ensembl_genes LIMIT 3`;
        console.log('🧬 GENES ENSEMBL:');
        genes.forEach(g => console.log(`   ${g.ensembl_id} | ${g.gene_symbol} | ${g.gene_name} | Chr${g.chromosome}`));
        
        // Medicamentos reais
        const meds = await prisma.$queryRaw`SELECT medicine_name, therapeutic_area, orphan_designation FROM ema_medicines LIMIT 3`;
        console.log('\n💊 MEDICAMENTOS EMA:');
        meds.forEach(m => console.log(`   ${m.medicine_name} | ${m.therapeutic_area} | Órfão: ${m.orphan_designation ? 'Sim' : 'Não'}`));
        
        // Ensaios reais
        const trials = await prisma.$queryRaw`SELECT trial_title, medical_condition, trial_phase FROM eu_clinical_trials LIMIT 3`;
        console.log('\n🧪 ENSAIOS CLÍNICOS:');
        trials.forEach(t => console.log(`   ${t.trial_title ? t.trial_title.substring(0, 40) + '...' : 'N/A'} | ${t.medical_condition} | ${t.trial_phase}`));
        
        console.log('\n🌐 INTERFACE WEB: http://localhost:3001');
        console.log('✅ Clique nos cards para navegar pelos dados!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

demonstrarDadosReais();