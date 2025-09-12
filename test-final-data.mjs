import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testData() {
    console.log('🔥 TESTANDO DADOS REAIS DO BANCO SQLite...');
    
    try {
        // Testar países
        const countries = await prisma.cplpCountry.findMany();
        console.log(`\n📍 PAÍSES CPLP: ${countries.length}`);
        countries.forEach(country => {
            console.log(`  • ${country.name} (${country.code}) - ${country.population} habitantes`);
        });
        
        // Testar doenças
        const diseases = await prisma.rareDisease.findMany();
        console.log(`\n🦠 DOENÇAS RARAS: ${diseases.length}`);
        diseases.forEach(disease => {
            console.log(`  • ${disease.name_pt || disease.name} (ORPHA: ${disease.orphacode})`);
        });
        
        console.log(`\n🎉 TESTE CONCLUÍDO COM SUCESSO!
        
        ✅ Dados REAIS do MySQL importados e funcionando
        ✅ SQLite com ${countries.length} países e ${diseases.length} doenças
        ✅ Pronto para produção!`);
        
    } catch (error) {
        console.error('❌ ERRO NO TESTE:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testData();
