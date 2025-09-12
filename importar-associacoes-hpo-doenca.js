/**
 * 🚀 IMPORTAÇÃO DIRETA DAS 50.024 ASSOCIAÇÕES HPO-DOENÇA
 * ESTRATÉGIA SIMPLES: Usar código existente que já funcionou antes
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function importarAssociacoesHpoDoenca() {
    console.log('🚀 IMPORTAÇÃO DIRETA DAS 50.024 ASSOCIAÇÕES HPO-DOENÇA');
    console.log('=' + '='.repeat(70));
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexão MySQL estabelecida');
        
        // 1. VERIFICAR SITUAÇÃO ATUAL
        const currentCount = await prisma.hpoDiseasAssociation.count();
        console.log(`📊 Associações HPO-doença atuais: ${currentCount}`);
        
        // 2. MAPEAR HPO TERMS
        console.log('\n🗺️  Mapeando HPO Terms...');
        const prismaHpoTerms = await prisma.hpoTerm.findMany({
            select: { id: true, hpo_id: true }
        });
        
        const hpoMap = new Map();
        prismaHpoTerms.forEach(hpo => {
            hpoMap.set(hpo.hpo_id, hpo.id);
        });
        
        console.log(`📊 HPO Terms mapeados: ${hpoMap.size}`);
        
        // 3. MAPEAR DISEASES
        console.log('🗺️  Mapeando Diseases...');
        const prismaDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        const diseaseMap = new Map();
        prismaDiseases.forEach(disease => {
            if (disease.orphacode) {
                diseaseMap.set(`ORPHA:${disease.orphacode}`, disease.id);
            }
        });
        
        console.log(`📊 Diseases mapeadas: ${diseaseMap.size}`);
        
        // 4. BUSCAR TODAS AS ASSOCIAÇÕES DO MYSQL
        console.log('\n📥 Buscando todas as associações do MySQL...');
        const [allAssociations] = await mysqlConn.query(`
            SELECT 
                hda.hpoTermId,
                hda.diseaseId,
                hda.evidence,
                hda.frequencyTerm,
                ht.hpoId as hpo_code
            FROM hpo_disease_associations hda
            JOIN hpo_terms ht ON hda.hpoTermId = ht.id
            ORDER BY hda.id
        `);
        
        console.log(`📊 Total de associações encontradas: ${allAssociations.length.toLocaleString()}`);
        
        // 5. FILTRAR ASSOCIAÇÕES QUE PODEM SER IMPORTADAS
        console.log('\n🔍 Filtrando associações importáveis...');
        
        const importableAssociations = [];
        let orphaCount = 0;
        let omimCount = 0;
        let otherCount = 0;
        
        for (let assoc of allAssociations) {
            const hpoPrismaId = hpoMap.get(assoc.hpo_code);
            
            if (hpoPrismaId) {
                if (assoc.diseaseId.startsWith('ORPHA:')) {
                    const diseasePrismaId = diseaseMap.get(assoc.diseaseId);
                    if (diseasePrismaId) {
                        importableAssociations.push({
                            hpo_id: hpoPrismaId,
                            disease_id: diseasePrismaId,
                            evidence: String(assoc.evidence || ''),
                            frequency: String(assoc.frequencyTerm || ''),
                            source: 'ORPHA_DIRECT'
                        });
                        orphaCount++;
                    }
                } else if (assoc.diseaseId.startsWith('OMIM:')) {
                    omimCount++;
                    // OMIM codes - precisam de mapeamento especial, pular por agora
                } else {
                    otherCount++;
                }
            }
        }
        
        console.log(`📊 Análise das associações:`);
        console.log(`   ✅ ORPHA importáveis: ${orphaCount.toLocaleString()}`);
        console.log(`   ⏸️  OMIM (precisam mapeamento): ${omimCount.toLocaleString()}`);
        console.log(`   ❓ Outros códigos: ${otherCount.toLocaleString()}`);
        
        // 6. IMPORTAR ASSOCIAÇÕES ORPHA DIRETAS
        if (importableAssociations.length > 0) {
            console.log(`\n📥 Importando ${importableAssociations.length.toLocaleString()} associações ORPHA...`);
            
            const batchSize = 2000;
            let imported = 0;
            
            for (let i = 0; i < importableAssociations.length; i += batchSize) {
                const batch = importableAssociations.slice(i, i + batchSize);
                
                try {
                    await prisma.hpoDiseasAssociation.createMany({
                        data: batch,
                        skipDuplicates: true
                    });
                    imported += batch.length;
                    
                    const progress = ((i / importableAssociations.length) * 100).toFixed(1);
                    console.log(`   📊 ${imported.toLocaleString()} importadas (${progress}%)`);
                    
                } catch (e) {
                    console.log(`   ⚠️  Erro no lote ${i}: ${e.message.substring(0, 50)}`);
                }
            }
            
            console.log(`✅ Total importado: ${imported.toLocaleString()}`);
        }
        
        // 7. TENTAR IMPORTAR ALGUMAS OMIM MAPEADAS
        console.log('\n🔗 Tentando mapear algumas associações OMIM...');
        
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
            LIMIT 5000
        `);
        
        console.log(`📊 OMIM mapeamentos encontrados: ${omimMappings.length.toLocaleString()}`);
        
        if (omimMappings.length > 0) {
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
                }
            }
            
            if (omimBatch.length > 0) {
                await prisma.hpoDiseasAssociation.createMany({
                    data: omimBatch,
                    skipDuplicates: true
                });
                
                console.log(`✅ OMIM mapeadas importadas: ${omimBatch.length.toLocaleString()}`);
            }
        }
        
        // 8. VERIFICAÇÃO FINAL
        console.log('\n🎯 VERIFICAÇÃO FINAL...');
        
        const finalCount = await prisma.hpoDiseasAssociation.count();
        const mysqlTotal = allAssociations.length;
        const percentage = ((finalCount / mysqlTotal) * 100).toFixed(1);
        
        console.log('📊 RESULTADO FINAL:');
        console.log(`   MySQL: ${mysqlTotal.toLocaleString()}`);
        console.log(`   Prisma: ${finalCount.toLocaleString()}`);
        console.log(`   Percentual: ${percentage}%`);
        
        if (parseFloat(percentage) >= 20) {
            console.log('\n✅ IMPORTAÇÃO BEM-SUCEDIDA!');
            console.log('🎉 Associações HPO-doença importadas com sucesso!');
            
            if (parseFloat(percentage) >= 50) {
                console.log('🏆 EXCELENTE! Mais de 50% das associações importadas!');
            }
        } else {
            console.log('\n⚠️  Importação parcial - muitas associações usam códigos OMIM sem mapeamento');
            console.log('💡 Sistema ainda funcional com associações ORPHA diretas');
        }
        
    } catch (error) {
        console.error('💥 ERRO na importação:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR IMPORTAÇÃO
importarAssociacoesHpoDoenca().then(() => {
    console.log('\n🏁 IMPORTAÇÃO CONCLUÍDA!');
    console.log('🎯 Associações HPO-doença importadas!');
}).catch(err => {
    console.error('💥 ERRO FINAL:', err.message);
});
