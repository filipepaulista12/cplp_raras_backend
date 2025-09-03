// Verificar tabelas que precisam de tradução
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
    console.log('🔍 VERIFICANDO TABELAS COM COLUNAS PT');
    console.log('=====================================\n');
    
    try {
        // Verificar GardTerm
        try {
            const gardTotal = await prisma.gardTerm.count();
            const gardNeedTranslation = await prisma.gardTerm.count({
                where: { 
                    OR: [
                        { termPt: null },
                        { termPt: '' }
                    ]
                }
            });
            console.log(`📋 GardTerm: ${gardTotal} total, ${gardNeedTranslation} precisam tradução (${((gardNeedTranslation/gardTotal)*100).toFixed(1)}%)`);
        } catch (e) {
            console.log('📋 GardTerm: tabela não encontrada');
        }

        // Verificar GardDisease  
        try {
            const gardDiseaseTotal = await prisma.gardDisease.count();
            const gardDiseaseNeedTranslation = await prisma.gardDisease.count({
                where: {
                    OR: [
                        { diseaseName_pt: null },
                        { diseaseName_pt: '' }
                    ]
                }
            });
            console.log(`🦠 GardDisease: ${gardDiseaseTotal} total, ${gardDiseaseNeedTranslation} precisam tradução (${((gardDiseaseNeedTranslation/gardDiseaseTotal)*100).toFixed(1)}%)`);
        } catch (e) {
            console.log('🦠 GardDisease: tabela não encontrada');
        }

        // Verificar OrphaClassification
        try {
            const orphaClassTotal = await prisma.orphaClassification.count();
            const orphaClassNeedTranslation = await prisma.orphaClassification.count({
                where: {
                    OR: [
                        { name_pt: null },
                        { name_pt: '' }
                    ]
                }
            });
            console.log(`📂 OrphaClassification: ${orphaClassTotal} total, ${orphaClassNeedTranslation} precisam tradução (${((orphaClassNeedTranslation/orphaClassTotal)*100).toFixed(1)}%)`);
        } catch (e) {
            console.log('📂 OrphaClassification: tabela não encontrada');
        }

        // Verificar outras possíveis tabelas
        const possibleTables = [
            'orphaGene', 'orphaPhenotype', 'orphaPrevalence', 
            'orphaExternalRef', 'drugBankTarget', 'drugBankPathway'
        ];

        console.log('\n🔍 OUTRAS TABELAS:');
        for (const tableName of possibleTables) {
            try {
                const count = await prisma[tableName].count();
                console.log(`   ${tableName}: ${count} registros`);
            } catch (e) {
                // Tabela não existe, ok
            }
        }

        console.log('\n✅ Verificação concluída!');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
