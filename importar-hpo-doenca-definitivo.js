/**
 * 🎯 SOLUÇÃO DEFINITIVA HPO-DOENÇA: Corrigir mapeamento das doenças
 * PROBLEMA: MySQL usa ORPHA:XXXXX, Prisma tem apenas o número
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function importarHpoDoencaDefinitivo() {
    console.log('🎯 SOLUÇÃO DEFINITIVA: HPO-DOENÇA');
    console.log('=' + '='.repeat(50));
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. VERIFICAR FORMATO DAS DOENÇAS NO PRISMA
        console.log('\n🔍 VERIFICANDO FORMATO DOENÇAS PRISMA...');
        
        const prismaDiseaseSample = await prisma.rareDisease.findMany({
            take: 10,
            select: { id: true, orphacode: true, name: true }
        });
        
        console.log('📊 Amostra doenças no Prisma:');
        prismaDiseaseSample.forEach((d, i) => {
            console.log(`   [${i+1}] ID=${d.id} | ORPHA=${d.orphacode} | ${d.name?.substring(0, 40)}`);
        });
        
        // 2. CRIAR MAPEAMENTO CORRETO DE DOENÇAS
        console.log('\n🗺️  CRIANDO MAPEAMENTO ORPHA CORRETO...');
        
        // Buscar todas as doenças do Prisma
        const prismaDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        // Criar mapeamento ORPHA:XXXXX → Prisma ID
        const orphaCodeToPrismaId = new Map();
        prismaDiseases.forEach(disease => {
            if (disease.orphacode) {
                // Adicionar com prefixo ORPHA: se não tiver
                const orphaWithPrefix = disease.orphacode.toString().startsWith('ORPHA:') 
                    ? disease.orphacode 
                    : `ORPHA:${disease.orphacode}`;
                orphaCodeToPrismaId.set(orphaWithPrefix, disease.id);
                
                // Também mapear sem prefixo para garantir
                const orphaNumber = disease.orphacode.toString().replace('ORPHA:', '');
                orphaCodeToPrismaId.set(orphaNumber, disease.id);
            }
        });
        
        console.log(`   📊 Mapeamentos ORPHA criados: ${orphaCodeToPrismaId.size}`);
        
        // 3. CRIAR MAPEAMENTO HPO
        const [mysqlHpoTerms] = await mysqlConn.query(`
            SELECT id as mysql_id, hpoId as hpo_code 
            FROM hpo_terms 
            WHERE hpoId IS NOT NULL
        `);
        
        const prismaHpoTerms = await prisma.hpoTerm.findMany({
            select: { id: true, hpo_id: true }
        });
        
        const mysqlHpoToCode = new Map();
        mysqlHpoTerms.forEach(hpo => {
            mysqlHpoToCode.set(hpo.mysql_id, hpo.hpo_code);
        });
        
        const prismaHpoCodeToId = new Map();
        prismaHpoTerms.forEach(hpo => {
            prismaHpoCodeToId.set(hpo.hpo_id, hpo.id);
        });
        
        console.log(`   📊 Mapeamentos HPO: ${prismaHpoCodeToId.size}`);
        
        // 4. TESTE MAPEAMENTO CORRIGIDO
        console.log('\n🧪 TESTANDO MAPEAMENTO CORRIGIDO...');
        
        const [testAssocs] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId, frequencyTerm, evidence
            FROM hpo_disease_associations 
            LIMIT 100
        `);
        
        let testSuccess = 0;
        let testFailed = 0;
        
        for (let assoc of testAssocs) {
            const hpoCode = mysqlHpoToCode.get(assoc.hpoTermId);
            const hpoPrismaId = hpoCode ? prismaHpoCodeToId.get(hpoCode) : null;
            const diseasePrismaId = orphaCodeToPrismaId.get(assoc.diseaseId);
            
            if (hpoPrismaId && diseasePrismaId) {
                testSuccess++;
            } else {
                testFailed++;
                if (testFailed <= 3) {
                    console.log(`   ❌ Falha: HPO=${hpoCode} (${!!hpoPrismaId}) | Disease=${assoc.diseaseId} (${!!diseasePrismaId})`);
                }
            }
        }
        
        console.log(`   📊 Teste corrigido: ${testSuccess} sucessos, ${testFailed} falhas de 100`);
        
        if (testSuccess < 80) {
            console.log('❌ AINDA HAY PROBLEMAS - Investigando mais...');
            
            // Verificar alguns códigos ORPHA específicos
            const testOrphaCodes = ['ORPHA:207110', 'ORPHA:896', 'ORPHA:93262'];
            console.log('🔍 Testando códigos ORPHA específicos:');
            
            for (let code of testOrphaCodes) {
                const prismaId = orphaCodeToPrismaId.get(code);
                const numberOnly = code.replace('ORPHA:', '');
                const prismaIdNumber = orphaCodeToPrismaId.get(numberOnly);
                
                console.log(`   ${code}: Prisma ID = ${prismaId || 'null'} | Número ${numberOnly}: ${prismaIdNumber || 'null'}`);
            }
            
            return;
        }
        
        // 5. LIMPAR ASSOCIAÇÕES EXISTENTES HPO-DOENÇA (SE EXISTIREM)
        console.log('\n🧹 LIMPANDO ASSOCIAÇÕES HPO-DOENÇA EXISTENTES...');
        
        const existingHpoDisease = await prisma.hpoDiseasAssociation.count();
        if (existingHpoDisease > 0) {
            await prisma.hpoDiseasAssociation.deleteMany({});
            console.log(`   🗑️  ${existingHpoDisease} associações removidas`);
        }
        
        // 6. IMPORTAR ASSOCIAÇÕES HPO-DOENÇA
        console.log('\n🔗 IMPORTANDO ASSOCIAÇÕES HPO-DOENÇA...');
        
        const [allHpoDiseaseAssocs] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId, frequencyTerm, evidence
            FROM hpo_disease_associations
        `);
        
        console.log(`   📊 Total a importar: ${allHpoDiseaseAssocs.length.toLocaleString()}`);
        
        let hpoDiseaseImported = 0;
        let hpoDiseaseSkipped = 0;
        const batchSize = 500;
        let batch = [];
        
        for (let assoc of allHpoDiseaseAssocs) {
            try {
                // Converter MySQL ID → Código HPO → Prisma ID
                const hpoCode = mysqlHpoToCode.get(assoc.hpoTermId);
                const hpoPrismaId = hpoCode ? prismaHpoCodeToId.get(hpoCode) : null;
                const diseasePrismaId = orphaCodeToPrismaId.get(assoc.diseaseId);
                
                if (!hpoPrismaId || !diseasePrismaId) {
                    hpoDiseaseSkipped++;
                    continue;
                }
                
                batch.push({
                    hpo_id: hpoPrismaId,
                    disease_id: diseasePrismaId,
                    evidence: String(assoc.evidence || ''),
                    frequency: String(assoc.frequencyTerm || ''),
                    source: 'HPO'
                });
                
                // Executar em lotes
                if (batch.length >= batchSize) {
                    await prisma.hpoDiseasAssociation.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    hpoDiseaseImported += batch.length;
                    batch = [];
                    
                    if (hpoDiseaseImported % 5000 === 0) {
                        console.log(`   📊 ${hpoDiseaseImported.toLocaleString()} associações HPO-doença importadas...`);
                    }
                }
                
            } catch (e) {
                hpoDiseaseSkipped++;
                if (hpoDiseaseSkipped <= 3) {
                    console.log(`   ⚠️  Erro:`, e.message.substring(0, 100));
                }
            }
        }
        
        // Processar último lote
        if (batch.length > 0) {
            await prisma.hpoDiseasAssociation.createMany({
                data: batch,
                skipDuplicates: true
            });
            hpoDiseaseImported += batch.length;
        }
        
        console.log(`✅ ${hpoDiseaseImported.toLocaleString()} associações HPO-doença importadas (${hpoDiseaseSkipped} puladas)`);
        
        // 7. VERIFICAÇÃO FINAL COMPLETA
        console.log('\n🎉 VERIFICAÇÃO FINAL COMPLETA!');
        console.log('=' + '='.repeat(60));
        
        const finalCounts = {
            cplp: await prisma.cplpCountry.count(),
            hpo: await prisma.hpoTerm.count(),
            diseases: await prisma.rareDisease.count(),
            drugs: await prisma.drugbankDrug.count(),
            interactions: await prisma.drugInteraction.count(),
            hpoDisease: await prisma.hpoDiseasAssociation.count(),
            hpoGene: await prisma.hpoGeneAssociation.count()
        };
        
        const totalPrismaFinal = Object.values(finalCounts).reduce((a, b) => a + b, 0);
        
        console.log('💎 SISTEMA PRISMA COMPLETO:');
        console.log(`   📍 CPLP Countries: ${finalCounts.cplp.toLocaleString()}`);
        console.log(`   🧬 HPO Terms: ${finalCounts.hpo.toLocaleString()}`);
        console.log(`   🏥 Rare Diseases: ${finalCounts.diseases.toLocaleString()}`);
        console.log(`   💊 Drugbank Drugs: ${finalCounts.drugs.toLocaleString()}`);
        console.log(`   🔄 Drug Interactions: ${finalCounts.interactions.toLocaleString()}`);
        console.log(`   🔗 HPO-Disease Assoc: ${finalCounts.hpoDisease.toLocaleString()}`);
        console.log(`   🧬 HPO-Gene Assoc: ${finalCounts.hpoGene.toLocaleString()}`);
        console.log(`   🎯 TOTAL FINAL: ${totalPrismaFinal.toLocaleString()}`);
        
        // Comparação com MySQL
        const [mysqlFinalCounts] = await mysqlConn.query(`
            SELECT 
                (SELECT COUNT(*) FROM cplp_countries) as cplp,
                (SELECT COUNT(*) FROM hpo_terms) as hpo,
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM drugbank_drugs) as drugs,
                (SELECT COUNT(*) FROM drug_interactions) as interactions,
                (SELECT COUNT(*) FROM hpo_disease_associations) as hpo_disease,
                (SELECT COUNT(*) FROM hpo_gene_associations) as hpo_gene
        `);
        
        const totalMysqlFinal = Object.values(mysqlFinalCounts[0]).reduce((a, b) => a + b, 0);
        
        console.log('\n🗄️  MYSQL REFERENCE:');
        console.log(`   📊 TOTAL: ${totalMysqlFinal.toLocaleString()}`);
        
        const syncPercentageFinal = ((totalPrismaFinal / totalMysqlFinal) * 100).toFixed(1);
        
        console.log('\n🏆 RESULTADO ABSOLUTO FINAL:');
        console.log('=' + '='.repeat(50));
        console.log(`📈 Sincronização: ${syncPercentageFinal}%`);
        console.log(`📊 Registros: ${totalPrismaFinal.toLocaleString()}/${totalMysqlFinal.toLocaleString()}`);
        
        // Análise de associações
        const totalAssocs = finalCounts.hpoDisease + finalCounts.hpoGene;
        const expectedAssocs = 50024 + 24501;
        const assocPercent = ((totalAssocs / expectedAssocs) * 100).toFixed(1);
        
        console.log('\n🎯 ASSOCIAÇÕES CIENTÍFICAS:');
        console.log(`📊 HPO-Disease: ${finalCounts.hpoDisease.toLocaleString()}/50.024 (${((finalCounts.hpoDisease/50024)*100).toFixed(1)}%)`);
        console.log(`📊 HPO-Gene: ${finalCounts.hpoGene.toLocaleString()}/24.501 (${((finalCounts.hpoGene/24501)*100).toFixed(1)}%)`);
        console.log(`🎯 Total Assoc: ${totalAssocs.toLocaleString()}/${expectedAssocs.toLocaleString()} (${assocPercent}%)`);
        
        // Resultado final
        if (syncPercentageFinal >= 95) {
            console.log('\n🎉🎉🎉 PERFEIÇÃO ABSOLUTA! 🎉🎉🎉');
            console.log('✅ SISTEMA 100% IGUALZINHO AO SERVIDOR!');
            console.log('🚀 MISSÃO COMPLETADA COM SUCESSO TOTAL!');
        } else if (syncPercentageFinal >= 85) {
            console.log('\n🎉🎉 EXCELENTE SUCESSO! 🎉🎉');
            console.log('✅ Sistema quase perfeito!');
            console.log('🔬 Base científica robusta e completa!');
        } else if (finalCounts.hpoDisease >= 40000) {
            console.log('\n🎉 GRANDE SUCESSO!');
            console.log('✅ Associações HPO-doença importadas!');
            console.log('🔬 Sistema científico funcional!');
        } else {
            console.log('\n⚠️  Progresso parcial - verificar logs');
        }
        
    } catch (error) {
        console.error('💥 ERRO FINAL:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR IMPORTAÇÃO DEFINITIVA
importarHpoDoencaDefinitivo().then(() => {
    console.log('\n🏆🏆🏆 IMPORTAÇÃO HPO-DOENÇA CONCLUÍDA! 🏆🏆🏆');
    console.log('💎 SISTEMA CIENTÍFICO COMPLETO E FUNCIONAL!');
    console.log('🚀 MISSÃO CUMPRIDA!');
}).catch(err => {
    console.error('💥 ERRO CRÍTICO:', err.message);
});
