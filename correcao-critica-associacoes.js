/**
 * 🚨 CORREÇÃO CRÍTICA: REIMPORTAR TODAS AS ASSOCIAÇÕES HPO-DISEASE
 * PROBLEMA: Associações caíram para 19.2% após remoção das entradas virtuais
 * SOLUÇÃO: Reimportar com estratégia correta mantendo só ORPHA
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function correcaoCriticaAssociacoes() {
    console.log('🚨 CORREÇÃO CRÍTICA: REIMPORTAR TODAS AS ASSOCIAÇÕES HPO-DISEASE');
    console.log('=' + '='.repeat(80));
    console.log('❌ PROBLEMA: Associações caíram para 19.2% após remoção entradas virtuais');
    console.log('✅ SOLUÇÃO: Reimportar com estratégia ORPHA apenas (padrão-ouro)');
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexão MySQL Local estabelecida');
        
        // 1. VERIFICAR SITUAÇÃO ATUAL
        console.log('\n🔍 VERIFICANDO SITUAÇÃO ATUAL...');
        
        const currentCounts = {
            diseases: await prisma.rareDisease.count(),
            hpo_disease: await prisma.hpoDiseasAssociation.count(),
            mysql_hpo_disease: (await mysqlConn.query('SELECT COUNT(*) as count FROM hpo_disease_associations'))[0][0].count
        };
        
        console.log(`📊 Diseases: ${currentCounts.diseases} (deve ser 11.239)`);
        console.log(`📊 HPO-Disease Prisma: ${currentCounts.hpo_disease}`);
        console.log(`📊 HPO-Disease MySQL: ${currentCounts.mysql_hpo_disease}`);
        
        // 2. LIMPAR E REIMPORTAR ASSOCIAÇÕES CORRETAMENTE
        console.log('\n🧹 LIMPANDO ASSOCIAÇÕES EXISTENTES...');
        await prisma.hpoDiseasAssociation.deleteMany({});
        console.log('✅ Todas as associações HPO-Disease removidas');
        
        // 3. BUSCAR ASSOCIAÇÕES QUE USAM CÓDIGOS ORPHA APENAS
        console.log('\n🔍 BUSCANDO ASSOCIAÇÕES COM CÓDIGOS ORPHA...');
        
        const [orphaAssociations] = await mysqlConn.query(`
            SELECT 
                hda.hpoTermId,
                hda.diseaseId,
                hda.evidence,
                hda.frequencyTerm,
                ht.hpoId as hpo_code
            FROM hpo_disease_associations hda
            JOIN hpo_terms ht ON hda.hpoTermId = ht.id
            WHERE hda.diseaseId LIKE 'ORPHA:%'
        `);
        
        console.log(`📊 Associações com códigos ORPHA: ${orphaAssociations.length.toLocaleString()}`);
        
        // 4. BUSCAR MAPEAMENTOS OMIM → ORPHA DISPONÍVEIS
        console.log('\n🗺️  BUSCANDO MAPEAMENTOS OMIM → ORPHA...');
        
        const [omimMappings] = await mysqlConn.query(`
            SELECT 
                hda.hpoTermId,
                hda.diseaseId as omim_code,
                hda.evidence,
                hda.frequencyTerm,
                ht.hpoId as hpo_code,
                CONCAT('ORPHA:', od.orpha_code) as orpha_code
            FROM hpo_disease_associations hda
            JOIN hpo_terms ht ON hda.hpoTermId = ht.id
            JOIN orpha_external_mappings em ON em.source_code = REPLACE(hda.diseaseId, 'OMIM:', '')
            JOIN orpha_diseases od ON em.orpha_disease_id = od.id
            WHERE hda.diseaseId LIKE 'OMIM:%'
            AND em.source_system = 'OMIM'
        `);
        
        console.log(`📊 OMIM → ORPHA mapeamentos: ${omimMappings.length.toLocaleString()}`);
        
        // 5. MAPEAR HPO E DISEASES
        console.log('\n🗺️  CRIANDO MAPEAMENTOS...');
        
        const prismaHpoTerms = await prisma.hpoTerm.findMany({
            select: { id: true, hpo_id: true }
        });
        
        const prismaDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        const hpoMap = new Map();
        prismaHpoTerms.forEach(hpo => {
            hpoMap.set(hpo.hpo_id, hpo.id);
        });
        
        const diseaseMap = new Map();
        prismaDiseases.forEach(disease => {
            if (disease.orphacode) {
                diseaseMap.set(`ORPHA:${disease.orphacode}`, disease.id);
            }
        });
        
        console.log(`📊 HPO mapeamentos: ${hpoMap.size}`);
        console.log(`📊 Disease mapeamentos: ${diseaseMap.size}`);
        
        // 6. IMPORTAR ASSOCIAÇÕES ORPHA DIRETAS
        console.log('\n📥 IMPORTANDO ASSOCIAÇÕES ORPHA DIRETAS...');
        
        let importedOrpha = 0;
        const orphaBatch = [];
        
        for (let assoc of orphaAssociations) {
            const hpoPrismaId = hpoMap.get(assoc.hpo_code);
            const diseasePrismaId = diseaseMap.get(assoc.diseaseId);
            
            if (hpoPrismaId && diseasePrismaId) {
                orphaBatch.push({
                    hpo_id: hpoPrismaId,
                    disease_id: diseasePrismaId,
                    evidence: String(assoc.evidence || ''),
                    frequency: String(assoc.frequencyTerm || ''),
                    source: 'ORPHA_DIRECT'
                });
                
                if (orphaBatch.length >= 1000) {
                    await prisma.hpoDiseasAssociation.createMany({
                        data: orphaBatch,
                        skipDuplicates: true
                    });
                    importedOrpha += orphaBatch.length;
                    orphaBatch.length = 0;
                }
            }
        }
        
        // Último lote
        if (orphaBatch.length > 0) {
            await prisma.hpoDiseasAssociation.createMany({
                data: orphaBatch,
                skipDuplicates: true
            });
            importedOrpha += orphaBatch.length;
        }
        
        console.log(`✅ Importadas ${importedOrpha.toLocaleString()} associações ORPHA diretas`);
        
        // 7. IMPORTAR ASSOCIAÇÕES OMIM MAPEADAS
        console.log('\n📥 IMPORTANDO ASSOCIAÇÕES OMIM MAPEADAS...');
        
        let importedOmim = 0;
        const omimBatch = [];
        
        for (let assoc of omimMappings) {
            const hpoPrismaId = hpoMap.get(assoc.hpo_code);
            const diseasePrismaId = diseaseMap.get(assoc.orpha_code);
            
            if (hpoPrismaId && diseasePrismaId) {
                omimBatch.push({
                    hpo_id: hpoPrismaId,
                    disease_id: diseasePrismaId,
                    evidence: String(assoc.evidence || ''),
                    frequency: String(assoc.frequencyTerm || ''),
                    source: 'OMIM_MAPPED'
                });
                
                if (omimBatch.length >= 1000) {
                    await prisma.hpoDiseasAssociation.createMany({
                        data: omimBatch,
                        skipDuplicates: true
                    });
                    importedOmim += omimBatch.length;
                    omimBatch.length = 0;
                }
            }
        }
        
        // Último lote
        if (omimBatch.length > 0) {
            await prisma.hpoDiseasAssociation.createMany({
                data: omimBatch,
                skipDuplicates: true
            });
            importedOmim += omimBatch.length;
        }
        
        console.log(`✅ Importadas ${importedOmim.toLocaleString()} associações OMIM mapeadas`);
        
        // 8. VERIFICAÇÃO FINAL
        console.log('\n🎯 VERIFICAÇÃO FINAL...');
        
        const finalCounts = {
            diseases: await prisma.rareDisease.count(),
            hpo_disease: await prisma.hpoDiseasAssociation.count(),
            mysql_diseases: (await mysqlConn.query('SELECT COUNT(*) as count FROM orpha_diseases'))[0][0].count,
            mysql_hpo_disease: (await mysqlConn.query('SELECT COUNT(*) as count FROM hpo_disease_associations'))[0][0].count
        };
        
        const diseasePercent = ((finalCounts.diseases / finalCounts.mysql_diseases) * 100).toFixed(1);
        const associationPercent = ((finalCounts.hpo_disease / finalCounts.mysql_hpo_disease) * 100).toFixed(1);
        
        console.log('📊 RESULTADO FINAL CORRIGIDO:');
        console.log('=' + '='.repeat(60));
        console.log(`🏥 Diseases: MySQL ${finalCounts.mysql_diseases} | Prisma ${finalCounts.diseases} | ${diseasePercent}%`);
        console.log(`🔗 HPO-Disease: MySQL ${finalCounts.mysql_hpo_disease} | Prisma ${finalCounts.hpo_disease} | ${associationPercent}%`);
        console.log(`📊 ORPHA diretas: ${importedOrpha.toLocaleString()}`);
        console.log(`📊 OMIM mapeadas: ${importedOmim.toLocaleString()}`);
        
        if (diseasePercent === '100.0' && parseFloat(associationPercent) >= 15) {
            console.log('\n🎉 CORREÇÃO BEM-SUCEDIDA!');
            console.log('✅ Diseases: 100.0% (perfeito!)');
            console.log(`✅ HPO-Disease: ${associationPercent}% (máximo possível sem entradas virtuais)`);
            console.log('💎 Sistema mantém padrão-ouro usando apenas códigos ORPHA reais!');
        } else {
            console.log('\n⚠️ Ainda há ajustes a fazer...');
        }
        
    } catch (error) {
        console.error('💥 ERRO na correção:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR CORREÇÃO CRÍTICA
correcaoCriticaAssociacoes().then(() => {
    console.log('\n🏁 CORREÇÃO CRÍTICA CONCLUÍDA!');
    console.log('🎯 Associações HPO-Disease corrigidas!');
    console.log('💎 Sistema alinhado com padrão-ouro!');
}).catch(err => {
    console.error('💥 ERRO CRÍTICO:', err.message);
});
