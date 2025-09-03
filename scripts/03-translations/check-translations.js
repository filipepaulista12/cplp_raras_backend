const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealData() {
    console.log('🔍 VERIFICANDO DADOS REAIS DAS TRADUÇÕES');
    console.log('=======================================\n');
    
    try {
        // Verificar HPOTerm
        console.log('📋 HPOTerm - Primeiros 5 registros:');
        const hpoTerms = await prisma.hPOTerm.findMany({
            take: 5,
            select: {
                hpoCode: true,
                name: true,
                namePt: true,
                definition: true,
                definitionPt: true
            }
        });
        
        hpoTerms.forEach((term, index) => {
            console.log(`  ${index + 1}. ${term.hpoCode}:`);
            console.log(`     EN: ${term.name}`);
            console.log(`     PT: ${term.namePt || 'NULL'}`);
            console.log(`     DEF EN: ${(term.definition || 'NULL').substring(0, 50)}...`);
            console.log(`     DEF PT: ${(term.definitionPt || 'NULL').substring(0, 50)}...`);
            console.log('');
        });

        // Contar quantos têm tradução
        const totalHPO = await prisma.hPOTerm.count();
        const translatedHPOName = await prisma.hPOTerm.count({
            where: {
                AND: [
                    { namePt: { not: null } },
                    { namePt: { not: '' } }
                ]
            }
        });
        
        const translatedHPODef = await prisma.hPOTerm.count({
            where: {
                AND: [
                    { definitionPt: { not: null } },
                    { definitionPt: { not: '' } }
                ]
            }
        });

        console.log(`📊 HPOTerm:`);
        console.log(`   Total: ${totalHPO}`);
        console.log(`   Nomes traduzidos: ${translatedHPOName} (${((translatedHPOName/totalHPO)*100).toFixed(1)}%)`);
        console.log(`   Definições traduzidas: ${translatedHPODef} (${((translatedHPODef/totalHPO)*100).toFixed(1)}%)`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkRealData();
