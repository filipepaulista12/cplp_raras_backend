const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔍 CONSULTOR SQL INTERATIVO - CPLP Raras');
console.log('📊 Conectado ao banco com 550.000+ registros');
console.log('💡 Digite queries SQL ou comandos especiais:');
console.log('   - "tabelas" = listar todas as tabelas');
console.log('   - "contagem" = contar registros de todas as tabelas');
console.log('   - "genes" = ver amostras de genes');
console.log('   - "medicamentos" = ver amostras de medicamentos EMA');
console.log('   - "ensaios" = ver amostras de ensaios clínicos');
console.log('   - "exit" = sair');
console.log('📝 Exemplo: SELECT * FROM ensembl_genes LIMIT 5;');
console.log('─'.repeat(60));

async function executarQuery(query) {
    try {
        if (query.toLowerCase() === 'exit') {
            console.log('👋 Saindo...');
            await prisma.$disconnect();
            process.exit(0);
        }
        
        if (query.toLowerCase() === 'tabelas') {
            const tabelas = await prisma.$queryRaw`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
                ORDER BY name;
            `;
            console.log('📊 TABELAS DISPONÍVEIS:');
            tabelas.forEach((t, i) => console.log(`${String(i+1).padStart(2)}. ${t.name}`));
            return;
        }
        
        if (query.toLowerCase() === 'contagem') {
            const tabelas = ['ensembl_genes', 'uniprot_proteins', 'gene_expression_data', 
                           'ema_medicines', 'eu_clinical_trials', 'who_health_data',
                           'clinvar_variants', 'omim_entries', 'rare_diseases'];
            
            console.log('📈 CONTAGEM DE REGISTROS:');
            for (const tabela of tabelas) {
                try {
                    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela}`);
                    console.log(`  ${tabela}: ${Number(result[0].count).toLocaleString()}`);
                } catch (err) {
                    console.log(`  ${tabela}: Erro - ${err.message}`);
                }
            }
            return;
        }
        
        if (query.toLowerCase() === 'genes') {
            const genes = await prisma.$queryRaw`SELECT * FROM ensembl_genes LIMIT 5`;
            console.log('🧬 GENES ENSEMBL (amostra):');
            console.table(genes);
            return;
        }
        
        if (query.toLowerCase() === 'medicamentos') {
            const meds = await prisma.$queryRaw`SELECT * FROM ema_medicines LIMIT 5`;
            console.log('💊 MEDICAMENTOS EMA (amostra):');
            console.table(meds);
            return;
        }
        
        if (query.toLowerCase() === 'ensaios') {
            const trials = await prisma.$queryRaw`SELECT * FROM eu_clinical_trials LIMIT 5`;
            console.log('🧪 ENSAIOS CLÍNICOS (amostra):');
            console.table(trials);
            return;
        }
        
        // Executar query SQL customizada
        const resultado = await prisma.$queryRawUnsafe(query);
        
        if (Array.isArray(resultado)) {
            if (resultado.length === 0) {
                console.log('📭 Nenhum resultado encontrado.');
            } else {
                console.log(`📊 ${resultado.length} resultado(s):`);
                if (resultado.length <= 20) {
                    console.table(resultado);
                } else {
                    console.table(resultado.slice(0, 20));
                    console.log(`... e mais ${resultado.length - 20} registros`);
                }
            }
        } else {
            console.log('✅ Query executada com sucesso:', resultado);
        }
        
    } catch (error) {
        console.error('❌ Erro na query:', error.message);
    }
}

function prompt() {
    rl.question('🔍 SQL> ', (query) => {
        if (query.trim()) {
            executarQuery(query.trim()).then(() => {
                prompt();
            });
        } else {
            prompt();
        }
    });
}

prompt();