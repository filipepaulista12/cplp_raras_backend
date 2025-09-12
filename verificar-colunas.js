const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarColunas() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DAS TABELAS...\n');
        
        const tabelas = ['ensembl_genes', 'ema_medicines', 'eu_clinical_trials', 'who_health_data'];
        
        for (const tabela of tabelas) {
            console.log(`📊 ${tabela.toUpperCase()}:`);
            
            // Buscar uma amostra para ver as colunas
            const sample = await prisma.$queryRawUnsafe(`SELECT * FROM ${tabela} LIMIT 1`);
            
            if (sample && sample.length > 0) {
                const colunas = Object.keys(sample[0]);
                console.log(`  Colunas: ${colunas.join(', ')}\n`);
                
                // Mostrar dados da primeira linha
                console.log('  Dados da primeira linha:');
                const dados = sample[0];
                colunas.slice(0, 5).forEach(col => {
                    let valor = dados[col];
                    if (typeof valor === 'string' && valor.length > 50) {
                        valor = valor.substring(0, 50) + '...';
                    }
                    console.log(`    ${col}: ${valor}`);
                });
                console.log('');
            } else {
                console.log('  Tabela vazia\n');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarColunas();