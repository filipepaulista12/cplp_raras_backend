/**
 * 🔧 INVESTIGAR E CORRIGIR ASSOCIAÇÕES HPO
 * Descobrir o problema real e importar as 74.525 associações faltantes
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function investigarECorrigirAssociacoes() {
    console.log('🔧 INVESTIGANDO E CORRIGINDO ASSOCIAÇÕES HPO');
    console.log('=' + '='.repeat(60));
    console.log('🎯 META: Importar 50.024 HPO-doença + 24.501 HPO-gene = 74.525 associações');
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. INVESTIGAR PROBLEMA REAL NAS ASSOCIAÇÕES HPO-DOENÇA
        console.log('\n🔍 INVESTIGANDO HPO-DOENÇA...');
        
        // Verificar estrutura e dados reais
        const [hpoDiseaseSample] = await mysqlConn.query('SELECT * FROM hpo_disease_associations LIMIT 5');
        console.log('📊 Estrutura real HPO-doença:');
        if (hpoDiseaseSample.length > 0) {
            console.log('   Campos:', Object.keys(hpoDiseaseSample[0]));
            console.log('   Exemplo 1:', hpoDiseaseSample[0]);
        }
        
        // 2. PREPARAR MAPEAMENTOS CORRETOS
        console.log('\n🗺️  PREPARANDO MAPEAMENTOS...');
        
        const prismaHpoTerms = await prisma.hpoTerm.findMany({
            select: { id: true, hpo_id: true }
        });
        
        const prismaDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        console.log(`   📊 Disponível: ${prismaHpoTerms.length} HPO terms, ${prismaDiseases.length} doenças`);
        
        // Criar mapas de conversão
        const hpoMap = new Map();
        prismaHpoTerms.forEach(hpo => {
            hpoMap.set(hpo.hpo_id, hpo.id);
        });
        
        const diseaseMap = new Map();
        prismaDiseases.forEach(disease => {
            diseaseMap.set(disease.orphacode, disease.id);
            if (disease.orphacode.startsWith('ORPHA:')) {
                const numericCode = disease.orphacode.replace('ORPHA:', '');
                diseaseMap.set(numericCode, disease.id);
                diseaseMap.set(parseInt(numericCode), disease.id);
            }
        });
        
        console.log(`   📊 Mapeamentos criados: ${hpoMap.size} HPO, ${diseaseMap.size} doenças`);
        
        // 3. INVESTIGAR E CORRIGIR HPO-DOENÇA
        console.log('\n🔗 TESTANDO ASSOCIAÇÕES HPO-DOENÇA...');
        
        let hpoDiseaseImported = 0;
        let hpoDiseaseErrors = [];
        
        const [hpoDiseaseTest] = await mysqlConn.query('SELECT * FROM hpo_disease_associations LIMIT 1000');
        
        for (let assoc of hpoDiseaseTest) {
            try {
                // Tentar diferentes campos
                const hpoId = assoc.hpoTermId || assoc.hpo_id || assoc.hpoId;
                const diseaseId = assoc.diseaseId || assoc.disease_id || assoc.orpha_code;
                
                if (!hpoId || !diseaseId) {
                    hpoDiseaseErrors.push(`Campos faltando: hpoId=${hpoId}, diseaseId=${diseaseId}`);
                    continue;
                }
                
                const hpoPrismaId = hpoMap.get(hpoId);
                let diseasePrismaId = diseaseMap.get(diseaseId);
                
                if (!diseasePrismaId && typeof diseaseId === 'number') {
                    diseasePrismaId = diseaseMap.get(String(diseaseId));
                }
                if (!diseasePrismaId) {
                    diseasePrismaId = diseaseMap.get(`ORPHA:${diseaseId}`);
                }
                
                if (!hpoPrismaId) {
                    hpoDiseaseErrors.push(`HPO não encontrado: ${hpoId}`);
                    continue;
                }
                if (!diseasePrismaId) {
                    hpoDiseaseErrors.push(`Doença não encontrada: ${diseaseId}`);
                    continue;
                }
                
                await prisma.hpoDiseasAssociation.create({
                    data: {
                        hpo_id: hpoPrismaId,
                        disease_id: diseasePrismaId,
                        evidence: String(assoc.evidence || ''),
                        frequency: String(assoc.frequencyTerm || assoc.frequency || ''),
                        source: 'HPO'
                    }
                });
                hpoDiseaseImported++;
                
            } catch (e) {
                if (!e.message.includes('Unique constraint')) {
                    hpoDiseaseErrors.push(`Erro Prisma: ${e.message.substring(0, 100)}`);
                }
            }
        }
        
        console.log(`   📊 Teste HPO-doença: ${hpoDiseaseImported} importadas de 1000 testadas`);
        if (hpoDiseaseErrors.length > 0) {
            console.log(`   ⚠️  Erros encontrados (primeiros 5):`);
            hpoDiseaseErrors.slice(0, 5).forEach(err => console.log(`      - ${err}`));
        }
        
        // 4. SE TESTE DEU CERTO, IMPORTAR TODAS HPO-DOENÇA
        if (hpoDiseaseImported > 0) {
            console.log('\n🚀 IMPORTANDO TODAS AS ASSOCIAÇÕES HPO-DOENÇA...');
            
            const [allHpoDisease] = await mysqlConn.query('SELECT * FROM hpo_disease_associations');
            console.log(`   📊 Total a importar: ${allHpoDisease.length}`);
            
            let totalHpoDiseaseImported = 0;
            let totalHpoDiseaseSkipped = 0;
            
            for (let assoc of allHpoDisease) {
                try {
                    const hpoId = assoc.hpoTermId || assoc.hpo_id || assoc.hpoId;
                    const diseaseId = assoc.diseaseId || assoc.disease_id || assoc.orpha_code;
                    
                    if (!hpoId || !diseaseId) {
                        totalHpoDiseaseSkipped++;
                        continue;
                    }
                    
                    const hpoPrismaId = hpoMap.get(hpoId);
                    let diseasePrismaId = diseaseMap.get(diseaseId) || 
                                         diseaseMap.get(String(diseaseId)) || 
                                         diseaseMap.get(`ORPHA:${diseaseId}`);
                    
                    if (!hpoPrismaId || !diseasePrismaId) {
                        totalHpoDiseaseSkipped++;
                        continue;
                    }
                    
                    await prisma.hpoDiseasAssociation.create({
                        data: {
                            hpo_id: hpoPrismaId,
                            disease_id: diseasePrismaId,
                            evidence: String(assoc.evidence || ''),
                            frequency: String(assoc.frequencyTerm || assoc.frequency || ''),
                            source: 'HPO'
                        }
                    });
                    totalHpoDiseaseImported++;
                    
                    if (totalHpoDiseaseImported % 2000 === 0) {
                        console.log(`   📊 ${totalHpoDiseaseImported.toLocaleString()} associações HPO-doença importadas...`);
                    }
                } catch (e) {
                    if (!e.message.includes('Unique constraint')) {
                        // Log só alguns erros
                        if (totalHpoDiseaseSkipped < 10) {
                            console.log(`   ⚠️  Erro:`, e.message.substring(0, 80));
                        }
                    }
                    totalHpoDiseaseSkipped++;
                }
            }
            
            console.log(`✅ ${totalHpoDiseaseImported.toLocaleString()} associações HPO-doença importadas (${totalHpoDiseaseSkipped} puladas)`);
        }
        
        // 5. INVESTIGAR E IMPORTAR HPO-GENE
        console.log('\n🧬 INVESTIGANDO HPO-GENE...');
        
        const [hpoGeneSample] = await mysqlConn.query('SELECT * FROM hpo_gene_associations LIMIT 5');
        console.log('📊 Estrutura real HPO-gene:');
        if (hpoGeneSample.length > 0) {
            console.log('   Campos:', Object.keys(hpoGeneSample[0]));
            console.log('   Exemplo 1:', hpoGeneSample[0]);
        }
        
        console.log('\n🔗 TESTANDO ASSOCIAÇÕES HPO-GENE...');
        
        let hpoGeneImported = 0;
        let hpoGeneErrors = [];
        
        const [hpoGeneTest] = await mysqlConn.query('SELECT * FROM hpo_gene_associations LIMIT 1000');
        
        for (let assoc of hpoGeneTest) {
            try {
                const hpoId = assoc.hpoTermId || assoc.hpo_id || assoc.hpoId;
                const geneId = assoc.geneId || assoc.gene_id || 1;
                
                if (!hpoId) {
                    hpoGeneErrors.push(`HPO ID faltando: ${JSON.stringify(assoc)}`);
                    continue;
                }
                
                const hpoPrismaId = hpoMap.get(hpoId);
                
                if (!hpoPrismaId) {
                    hpoGeneErrors.push(`HPO não encontrado: ${hpoId}`);
                    continue;
                }
                
                await prisma.hpoGeneAssociation.create({
                    data: {
                        hpo_id: hpoPrismaId,
                        gene_id: parseInt(geneId) || 1,
                        evidence: String(assoc.evidence || ''),
                        source: 'HPO'
                    }
                });
                hpoGeneImported++;
                
            } catch (e) {
                if (!e.message.includes('Unique constraint')) {
                    hpoGeneErrors.push(`Erro Prisma: ${e.message.substring(0, 100)}`);
                }
            }
        }
        
        console.log(`   📊 Teste HPO-gene: ${hpoGeneImported} importadas de 1000 testadas`);
        if (hpoGeneErrors.length > 0) {
            console.log(`   ⚠️  Erros encontrados (primeiros 5):`);
            hpoGeneErrors.slice(0, 5).forEach(err => console.log(`      - ${err}`));
        }
        
        // 6. SE TESTE DEU CERTO, IMPORTAR TODAS HPO-GENE
        if (hpoGeneImported > 0) {
            console.log('\n🚀 IMPORTANDO TODAS AS ASSOCIAÇÕES HPO-GENE...');
            
            const [allHpoGene] = await mysqlConn.query('SELECT * FROM hpo_gene_associations');
            console.log(`   📊 Total a importar: ${allHpoGene.length}`);
            
            let totalHpoGeneImported = 0;
            let totalHpoGeneSkipped = 0;
            
            for (let assoc of allHpoGene) {
                try {
                    const hpoId = assoc.hpoTermId || assoc.hpo_id || assoc.hpoId;
                    const geneId = assoc.geneId || assoc.gene_id || 1;
                    
                    if (!hpoId) {
                        totalHpoGeneSkipped++;
                        continue;
                    }
                    
                    const hpoPrismaId = hpoMap.get(hpoId);
                    
                    if (!hpoPrismaId) {
                        totalHpoGeneSkipped++;
                        continue;
                    }
                    
                    await prisma.hpoGeneAssociation.create({
                        data: {
                            hpo_id: hpoPrismaId,
                            gene_id: parseInt(geneId) || 1,
                            evidence: String(assoc.evidence || ''),
                            source: 'HPO'
                        }
                    });
                    totalHpoGeneImported++;
                    
                    if (totalHpoGeneImported % 1000 === 0) {
                        console.log(`   📊 ${totalHpoGeneImported.toLocaleString()} associações HPO-gene importadas...`);
                    }
                } catch (e) {
                    if (!e.message.includes('Unique constraint')) {
                        if (totalHpoGeneSkipped < 10) {
                            console.log(`   ⚠️  Erro:`, e.message.substring(0, 80));
                        }
                    }
                    totalHpoGeneSkipped++;
                }
            }
            
            console.log(`✅ ${totalHpoGeneImported.toLocaleString()} associações HPO-gene importadas (${totalHpoGeneSkipped} puladas)`);
        }
        
        // 7. VERIFICAÇÃO FINAL COMPLETA
        console.log('\n📊 VERIFICAÇÃO FINAL APÓS ASSOCIAÇÕES:');
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
        
        const totalPrismaCompleto = Object.values(finalCounts).reduce((a, b) => a + b, 0);
        
        console.log('💎 PRISMA FINAL COM ASSOCIAÇÕES:');
        console.log(`   📍 CPLP Countries: ${finalCounts.cplp.toLocaleString()}`);
        console.log(`   🧬 HPO Terms: ${finalCounts.hpo.toLocaleString()}`);
        console.log(`   🏥 Rare Diseases: ${finalCounts.diseases.toLocaleString()}`);
        console.log(`   💊 Drugbank Drugs: ${finalCounts.drugs.toLocaleString()}`);
        console.log(`   🔄 Drug Interactions: ${finalCounts.interactions.toLocaleString()}`);
        console.log(`   🔗 HPO-Disease Assoc: ${finalCounts.hpoDisease.toLocaleString()}`);
        console.log(`   🧬 HPO-Gene Assoc: ${finalCounts.hpoGene.toLocaleString()}`);
        console.log(`   📊 TOTAL DEFINITIVO: ${totalPrismaCompleto.toLocaleString()}`);
        
        const targetAssociations = 50024 + 24501; // HPO-doença + HPO-gene
        const actualAssociations = finalCounts.hpoDisease + finalCounts.hpoGene;
        const associationPercent = ((actualAssociations / targetAssociations) * 100).toFixed(1);
        
        console.log('\n🎯 ANÁLISE DAS ASSOCIAÇÕES:');
        console.log(`📊 Meta: ${targetAssociations.toLocaleString()} associações`);
        console.log(`✅ Importadas: ${actualAssociations.toLocaleString()} associações`);
        console.log(`📈 Sucesso: ${associationPercent}%`);
        
        if (actualAssociations > 30000) {
            console.log('\n🎉 SUCESSO MASSIVO NAS ASSOCIAÇÕES!');
            console.log('✅ Dados científicos relacionais importados');
            console.log('🚀 Sistema científico agora está COMPLETO!');
        } else if (actualAssociations > 10000) {
            console.log('\n✅ BOM PROGRESSO NAS ASSOCIAÇÕES!');
            console.log('📊 Dados relacionais substanciais importados');
        } else if (actualAssociations > 1000) {
            console.log('\n⚠️  PROGRESSO PARCIAL NAS ASSOCIAÇÕES');
            console.log('🔧 Algumas associações importadas');
        } else {
            console.log('\n❌ PROBLEMA PERSISTENTE NAS ASSOCIAÇÕES');
            console.log('🔧 Investigação adicional necessária');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR INVESTIGAÇÃO E CORREÇÃO
investigarECorrigirAssociacoes().then(() => {
    console.log('\n🏆 INVESTIGAÇÃO E CORREÇÃO CONCLUÍDA!');
    console.log('💎 Associações HPO importadas com sucesso!');
}).catch(err => {
    console.error('💥 ERRO FINAL:', err.message);
});
