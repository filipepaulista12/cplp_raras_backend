const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listarTabelas() {
    try {
        console.log('🔍 LISTANDO TABELAS EXISTENTES...\n');
        
        // Usar query raw para listar tabelas SQLite
        const tabelas = await prisma.$queryRaw`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
            ORDER BY name;
        `;
        
        console.log('📊 TABELAS ENCONTRADAS:');
        tabelas.forEach((tabela, index) => {
            console.log(`${index + 1}. ${tabela.name}`);
        });
        
        console.log(`\n📈 Total: ${tabelas.length} tabelas`);
        
        // Verificar se existem dados nas tabelas principais
        console.log('\n🔍 VERIFICANDO DADOS...');
        
        for (const tabela of tabelas.slice(0, 10)) { // Verificar primeiras 10 tabelas
            try {
                const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela.name}`);
                const total = count[0].count;
                console.log(`  ${tabela.name}: ${Number(total).toLocaleString()} registros`);
                
                // Se há dados, mostrar uma amostra
                if (total > 0) {
                    const sample = await prisma.$queryRawUnsafe(`SELECT * FROM ${tabela.name} LIMIT 1`);
                    const colunas = Object.keys(sample[0] || {});
                    console.log(`    Colunas: ${colunas.slice(0, 5).join(', ')}${colunas.length > 5 ? '...' : ''}`);
                }
            } catch (error) {
                console.log(`  ${tabela.name}: Erro ao contar - ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

listarTabelas();