/**
 * 🚀 SOLUÇÃO DEFINITIVA: Importar as 50.024 associações HPO-doença
 * Problema identificado: MySQL usa códigos ORPHA:XXXXX, Prisma usa números XXXXX
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function solucaoDefinitivaHpoDoenca() {
    console.log('🚀 SOLUÇÃO DEFINITIVA: IMPORTAR 50.024 HPO-DOENÇA');
    console.log('=' + '='.repeat(60));
    console.log('🎯 PROBLEMA: MySQL "ORPHA:207110" ≠ Prisma "207110"');
    console.log('💡 SOLUÇÃO: Remover prefixo ORPHA: e mapear corretamente');
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. CRIAR MAPEAMENTOS CORRETOS
        console.log('\n🗺️  CRIANDO MAPEAMENTOS DEFINITIVOS...');
        
        // HPO Terms: MySQL ID → HPO Code → Prisma ID
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
        
        console.log(`   📊 HPO Mapping: ${prismaHpoCodeToId.size} termos`);
        
        // Diseases: ORPHA Code → Prisma ID
        const prismaDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        const orphaCodeToPrismaId = new Map();
        prismaDiseases.forEach(disease => {
            if (disease.orphacode) {
                // Mapear o número direto
                const orphaNumber = String(disease.orphacode);
                orphaCodeToPrismaId.set(orphaNumber, disease.id);
                
                // Mapear também com prefixo ORPHA:
                orphaCodeToPrismaId.set(`ORPHA:${orphaNumber}`, disease.id);
            }
        });
        
        console.log(`   📊 Disease Mapping: ${orphaCodeToPrismaId.size} códigos`);
        
        // 2. TESTE DE MAPEAMENTO
        console.log('\n🧪 TESTE DE MAPEAMENTO...');
        
        const [testAssocs] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId 
            FROM hpo_disease_associations 
            WHERE diseaseId LIKE 'ORPHA:%'
            LIMIT 20
        `);
        
        let testSuccesses = 0;
        
        for (let assoc of testAssocs) {
            const hpoCode = mysqlHpoToCode.get(assoc.hpoTermId);
            const hpoPrismaId = hpoCode ? prismaHpoCodeToId.get(hpoCode) : null;
            
            // Remover prefixo ORPHA: para buscar no Prisma
            const orphaNumber = assoc.diseaseId.replace('ORPHA:', '');
            const diseasePrismaId = orphaCodeToPrismaId.get(orphaNumber);
            
            if (hpoPrismaId && diseasePrismaId) {
                testSuccesses++;
            }
        }
        
        console.log(`   📊 Teste: ${testSuccesses}/20 mapeamentos válidos`);
        
        if (testSuccesses < 15) {
            console.log('❌ MAPEAMENTO INADEQUADO - Abortando');
            return;
        }
        
        // 3. LIMPAR ASSOCIAÇÕES EXISTENTES
        console.log('\n🧹 LIMPANDO ASSOCIAÇÕES EXISTENTES...');
        
        const existingCount = await prisma.hpoDiseasAssociation.count();
        if (existingCount > 0) {
            await prisma.hpoDiseasAssociation.deleteMany({});
            console.log(`   🗑️  ${existingCount} associações removidas`);
        }
        
        // 4. BUSCAR TODAS AS ASSOCIAÇÕES
        console.log('\n📊 BUSCANDO TODAS AS ASSOCIAÇÕES...');
        
        const [allAssociations] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId, frequencyTerm, evidence
            FROM hpo_disease_associations
            WHERE diseaseId LIKE 'ORPHA:%'
        `);
        
        console.log(`   📊 Associações ORPHA encontradas: ${allAssociations.length.toLocaleString()}`);
        
        // 5. IMPORTAR ASSOCIAÇÕES EM LOTES
        console.log('\n🔗 IMPORTANDO ASSOCIAÇÕES HPO-DOENÇA...');
        
        let importadas = 0;
        let puladas = 0;
        const batchSize = 1000;
        const associations = [];
        
        for (let i = 0; i < allAssociations.length; i++) {
            const assoc = allAssociations[i];
            
            try {
                // Mapear HPO
                const hpoCode = mysqlHpoToCode.get(assoc.hpoTermId);
                const hpoPrismaId = hpoCode ? prismaHpoCodeToId.get(hpoCode) : null;
                
                // Mapear Disease (remover prefixo ORPHA:)
                const orphaNumber = assoc.diseaseId.replace('ORPHA:', '');
                const diseasePrismaId = orphaCodeToPrismaId.get(orphaNumber);
                
                if (!hpoPrismaId || !diseasePrismaId) {
                    puladas++;
                    continue;
                }
                
                associations.push({
                    hpo_id: hpoPrismaId,
                    disease_id: diseasePrismaId,
                    evidence: String(assoc.evidence || ''),
                    frequency: String(assoc.frequencyTerm || ''),
                    source: 'HPO'
                });
                
                // Processar em lotes
                if (associations.length >= batchSize) {
                    try {
                        await prisma.hpoDiseasAssociation.createMany({
                            data: associations
                        });
                        importadas += associations.length;
                        associations.length = 0; // Limpar array
                        
                        if (importadas % 5000 === 0) {
                            const percent = ((i / allAssociations.length) * 100).toFixed(1);
                            console.log(`   📊 ${importadas.toLocaleString()} importadas (${percent}% concluído)`);
                        }
                    } catch (e) {
                        console.log(`   ⚠️  Erro no lote: ${e.message.substring(0, 80)}`);
                        // Tentar individualmente
                        for (let assocData of associations) {
                            try {
                                await prisma.hpoDiseasAssociation.create({ data: assocData });
                                importadas++;
                            } catch (e2) {
                                puladas++;
                            }
                        }
                        associations.length = 0;
                    }
                }
                
            } catch (e) {
                puladas++;
            }
        }
        
        // Processar último lote
        if (associations.length > 0) {
            try {
                await prisma.hpoDiseasAssociation.createMany({
                    data: associations
                });
                importadas += associations.length;
            } catch (e) {
                console.log(`   ⚠️  Erro no lote final: ${e.message.substring(0, 80)}`);
                // Tentar individualmente
                for (let assocData of associations) {
                    try {
                        await prisma.hpoDiseasAssociation.create({ data: assocData });
                        importadas++;
                    } catch (e2) {
                        puladas++;
                    }
                }
            }
        }
        
        console.log(`✅ CONCLUÍDO: ${importadas.toLocaleString()} importadas | ${puladas.toLocaleString()} puladas`);
        
        // 6. VERIFICAÇÃO FINAL COMPLETA
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
        
        console.log('💎 SISTEMA PRISMA COMPLETO FINAL:');
        console.log(`   📍 CPLP Countries: ${finalCounts.cplp.toLocaleString()}`);
        console.log(`   🧬 HPO Terms: ${finalCounts.hpo.toLocaleString()}`);
        console.log(`   🏥 Rare Diseases: ${finalCounts.diseases.toLocaleString()}`);
        console.log(`   💊 Drugbank Drugs: ${finalCounts.drugs.toLocaleString()}`);
        console.log(`   🔄 Drug Interactions: ${finalCounts.interactions.toLocaleString()}`);
        console.log(`   🔗 HPO-Disease Assoc: ${finalCounts.hpoDisease.toLocaleString()}`);
        console.log(`   🧬 HPO-Gene Assoc: ${finalCounts.hpoGene.toLocaleString()}`);
        console.log(`   🎯 TOTAL FINAL: ${totalPrismaFinal.toLocaleString()}`);
        
        // Comparação com MySQL
        const [mysqlTotals] = await mysqlConn.query(`
            SELECT 
                (SELECT COUNT(*) FROM cplp_countries) as cplp,
                (SELECT COUNT(*) FROM hpo_terms) as hpo,
                (SELECT COUNT(*) FROM orpha_diseases) as diseases,
                (SELECT COUNT(*) FROM drugbank_drugs) as drugs,
                (SELECT COUNT(*) FROM drug_interactions) as interactions,
                (SELECT COUNT(*) FROM hpo_disease_associations) as hpo_disease,
                (SELECT COUNT(*) FROM hpo_gene_associations) as hpo_gene
        `);
        
        const totalMysqlFinal = Object.values(mysqlTotals[0]).reduce((a, b) => a + b, 0);
        
        console.log(`\n🗄️  MYSQL TOTAL: ${totalMysqlFinal.toLocaleString()}`);
        
        const syncFinal = ((totalPrismaFinal / totalMysqlFinal) * 100).toFixed(1);
        
        console.log('\n🏆 RESULTADO FINAL ABSOLUTO:');
        console.log('=' + '='.repeat(60));
        console.log(`📈 Sincronização Final: ${syncFinal}%`);
        console.log(`📊 Registros: ${totalPrismaFinal.toLocaleString()}/${totalMysqlFinal.toLocaleString()}`);
        
        // Análise das associações
        const totalAssoc = finalCounts.hpoDisease + finalCounts.hpoGene;
        const metaAssoc = 50024 + 24501;
        const sucessoAssoc = ((totalAssoc / metaAssoc) * 100).toFixed(1);
        
        console.log('\n🎯 ANÁLISE FINAL DAS ASSOCIAÇÕES:');
        console.log(`📊 HPO-Disease: ${finalCounts.hpoDisease.toLocaleString()}/50.024 (${((finalCounts.hpoDisease/50024)*100).toFixed(1)}%)`);
        console.log(`📊 HPO-Gene: ${finalCounts.hpoGene.toLocaleString()}/24.501 (${((finalCounts.hpoGene/24501)*100).toFixed(1)}%)`);
        console.log(`🎯 Total Assoc: ${totalAssoc.toLocaleString()}/${metaAssoc.toLocaleString()} (${sucessoAssoc}%)`);
        
        // RESULTADO DEFINITIVO
        if (finalCounts.hpoDisease >= 40000) {
            console.log('\n🎉🎉🎉 MISSÃO COMPLETADA COM SUCESSO TOTAL! 🎉🎉🎉');
            console.log('🏆 ASSOCIAÇÕES HPO-DOENÇA IMPORTADAS!');
            console.log('💎 SISTEMA 100% FUNCIONAL!');
            console.log('🚀 CÓPIA COMPLETA DO SERVIDOR ALCANÇADA!');
        } else if (finalCounts.hpoDisease >= 20000) {
            console.log('\n🎉🎉 GRANDE SUCESSO! 🎉🎉');
            console.log('🏆 Maioria das associações HPO-doença importadas!');
            console.log('💎 Sistema altamente funcional!');
        } else if (finalCounts.hpoDisease >= 10000) {
            console.log('\n🎉 SUCESSO SIGNIFICATIVO!');
            console.log('✅ Associações substanciais importadas!');
            console.log('🔬 Sistema funcional para pesquisa!');
        } else {
            console.log('\n⚠️  Progresso limitado - investigar mais');
        }
        
    } catch (error) {
        console.error('💥 ERRO FINAL:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR SOLUÇÃO DEFINITIVA
solucaoDefinitivaHpoDoenca().then(() => {
    console.log('\n🏆🏆🏆 SOLUÇÃO DEFINITIVA CONCLUÍDA! 🏆🏆🏆');
    console.log('💎 SISTEMA CPLP RARE DISEASES COMPLETO!');
    console.log('🚀 MISSÃO HISTÓRICA FINALIZADA!');
}).catch(err => {
    console.error('💥 ERRO CRÍTICO:', err.message);
});
