const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mostrarDadosReais() {
    try {
        console.log('🔍 DEMONSTRAÇÃO - DADOS REAIS NO BANCO\n');
        
        // 1. Contagem total
        console.log('📊 TOTAIS POR TABELA:');
        const tabelas = ['ensembl_genes', 'ema_medicines', 'eu_clinical_trials', 'who_health_data', 'clinvar_variants', 'omim_entries'];
        
        let totalGeral = 0;
        for (const tabela of tabelas) {
            const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela}`);
            const count = Number(result[0].count);
            totalGeral += count;
            console.log(`  ${tabela}: ${count.toLocaleString()} registros`);
        }
        console.log(`  TOTAL GERAL: ${totalGeral.toLocaleString()} registros\n`);
        
        // 2. Amostras reais
        console.log('🧬 GENES ENSEMBL (primeiros 3):');
        const genes = await prisma.$queryRaw`SELECT ensembl_id, gene_symbol, gene_name, chromosome, biotype FROM ensembl_genes LIMIT 3`;
        genes.forEach(gene => {
            console.log(`  ${gene.ensembl_id} | ${gene.gene_symbol || 'N/A'} | ${gene.gene_name || 'N/A'} | Chr${gene.chromosome}`);
        });
        
        console.log('\n💊 MEDICAMENTOS EMA (primeiros 3):');
        const meds = await prisma.$queryRaw`SELECT medicine_name, therapeutic_area, orphan_designation FROM ema_medicines LIMIT 3`;
        meds.forEach(med => {
            console.log(`  ${med.medicine_name} | ${med.therapeutic_area} | Órfão: ${med.orphan_designation ? 'Sim' : 'Não'}`);
        });
        
        console.log('\n🧪 ENSAIOS CLÍNICOS EU (primeiros 3):');
        const trials = await prisma.$queryRaw`SELECT study_title, medical_condition, study_phase FROM eu_clinical_trials LIMIT 3`;
        trials.forEach(trial => {
            const title = trial.study_title ? trial.study_title.substring(0, 50) + '...' : 'N/A';
            console.log(`  ${title} | ${trial.medical_condition} | ${trial.study_phase}`);
        });
        
        console.log('\n🌍 DADOS WHO (primeiros 3):');
        const who = await prisma.$queryRaw`SELECT health_indicator, country, year, value FROM who_health_data LIMIT 3`;
        who.forEach(data => {
            console.log(`  ${data.health_indicator} | ${data.country} | ${data.year} | ${data.value}`);
        });
        
        console.log('\n✅ TODOS OS DADOS ACIMA SÃO REAIS DO BANCO SQLITE!');
        console.log('🌐 Acesse http://localhost:3001 para ver na interface web');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

mostrarDadosReais();