/**
 * 🔧 FASE 0 - TAREFA 0.1: Corrigir associações HPO-doença no SQLite
 * 🎯 OBJETIVO: Importar as 50.024 associações que estão zeradas no SQLite
 * 📊 META: MySQL 50.024 = SQLite 50.024 (100% sincronização)
 * 🛡️ ESTRATÉGIA: Manter MySQL como fonte verdade, sincronizar SQLite
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function tarefa01_corrigirAssociacoesHpoDoenca() {
    console.log('🔧 FASE 0 - TAREFA 0.1: CORRIGIR ASSOCIAÇÕES HPO-DOENÇA NO SQLITE');
    console.log('=' + '='.repeat(80));
    console.log('🎯 OBJETIVO: Importar 50.024 associações zeradas no SQLite');
    console.log('📊 META: MySQL 50.024 = SQLite 50.024 (100% sincronização)');
    console.log('🛡️ ESTRATÉGIA: MySQL como fonte verdade → sincronizar SQLite');
    
    let mysqlConn;
    
    try {
        // 1. CONECTAR AO MYSQL
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexão MySQL estabelecida');
        
        // 2. VERIFICAR ESTADO ATUAL
        console.log('\n📊 VERIFICANDO ESTADO ATUAL...');
        
        const [mysqlCount] = await mysqlConn.query('SELECT COUNT(*) as count FROM hpo_disease_associations');
        const sqliteCount = await prisma.hpoDiseasAssociation.count();
        
        console.log(`📋 MySQL hpo_disease_associations: ${mysqlCount[0].count.toLocaleString()}`);
        console.log(`📋 SQLite hpoDiseasAssociation: ${sqliteCount.toLocaleString()}`);
        
        const deficit = mysqlCount[0].count - sqliteCount;
        console.log(`❌ Déficit SQLite: ${deficit.toLocaleString()} associações`);
        
        if (deficit === 0) {
            console.log('✅ TAREFA JÁ CONCLUÍDA: Associações já sincronizadas!');
            return;
        }
        
        // 3. LIMPAR ASSOCIAÇÕES EXISTENTES NO SQLITE
        console.log('\n🧹 LIMPANDO ASSOCIAÇÕES EXISTENTES NO SQLITE...');
        await prisma.hpoDiseasAssociation.deleteMany({});
        console.log('✅ Associações SQLite removidas');
        
        // 4. MAPEAR HPO TERMS
        console.log('\n🗺️  MAPEANDO HPO TERMS...');
        
        const [mysqlHpoTerms] = await mysqlConn.query(`
            SELECT id as mysql_id, hpoId as hpo_code 
            FROM hpo_terms 
            WHERE hpoId IS NOT NULL
        `);
        
        const sqliteHpoTerms = await prisma.hpoTerm.findMany({
            select: { id: true, hpo_id: true }
        });
        
        const mysqlHpoMap = new Map();
        mysqlHpoTerms.forEach(hpo => {
            mysqlHpoMap.set(hpo.mysql_id, hpo.hpo_code);
        });
        
        const sqliteHpoMap = new Map();
        sqliteHpoTerms.forEach(hpo => {
            sqliteHpoMap.set(hpo.hpo_id, hpo.id);
        });
        
        console.log(`📊 MySQL HPO Terms: ${mysqlHpoMap.size.toLocaleString()}`);
        console.log(`📊 SQLite HPO Terms: ${sqliteHpoMap.size.toLocaleString()}`);
        
        // 5. MAPEAR DISEASES
        console.log('\n🗺️  MAPEANDO DISEASES...');
        
        const sqliteDiseases = await prisma.rareDisease.findMany({
            select: { id: true, orphacode: true }
        });
        
        const diseaseMap = new Map();
        sqliteDiseases.forEach(disease => {
            if (disease.orphacode) {
                diseaseMap.set(`ORPHA:${disease.orphacode}`, disease.id);
            }
        });
        
        console.log(`📊 SQLite Diseases mapeadas: ${diseaseMap.size.toLocaleString()}`);
        
        // 6. BUSCAR MAPEAMENTOS OMIM → ORPHA
        console.log('\n🔍 BUSCANDO MAPEAMENTOS OMIM → ORPHA...');
        
        const [omimMappings] = await mysqlConn.query(`
            SELECT 
                em.source_code,
                od.orpha_code
            FROM orpha_external_mappings em
            JOIN orpha_diseases od ON em.orpha_disease_id = od.id
            WHERE em.source_system = 'OMIM'
        `);
        
        const omimToOrphaMap = new Map();
        omimMappings.forEach(mapping => {
            omimToOrphaMap.set(`OMIM:${mapping.source_code}`, `ORPHA:${mapping.orpha_code}`);
        });
        
        console.log(`📊 Mapeamentos OMIM → ORPHA: ${omimToOrphaMap.size.toLocaleString()}`);
        
        // 7. PROCESSAR TODAS AS ASSOCIAÇÕES DO MYSQL
        console.log('\n🔄 PROCESSANDO TODAS AS ASSOCIAÇÕES DO MYSQL...');
        
        const [allAssociations] = await mysqlConn.query(`
            SELECT 
                hpoTermId as mysql_hpo_id,
                diseaseId as disease_code,
                evidence,
                frequencyTerm as frequency
            FROM hpo_disease_associations
            ORDER BY id
        `);
        
        console.log(`📊 Total associações MySQL: ${allAssociations.length.toLocaleString()}`);
        
        let processadas = 0;
        let importadas = 0;
        let puladasHpo = 0;
        let puladasDisease = 0;
        const batchSize = 2000;
        const associationBatch = [];
        
        for (let assoc of allAssociations) {
            processadas++;
            
            try {
                // Mapear HPO
                const hpoCode = mysqlHpoMap.get(assoc.mysql_hpo_id);
                const sqliteHpoId = hpoCode ? sqliteHpoMap.get(hpoCode) : null;
                
                if (!sqliteHpoId) {
                    puladasHpo++;
                    continue;
                }
                
                // Mapear Disease
                let diseaseCode = assoc.disease_code;
                let sqliteDiseaseId = null;
                
                // Tentar mapeamento direto ORPHA
                if (diseaseCode.startsWith('ORPHA:')) {
                    sqliteDiseaseId = diseaseMap.get(diseaseCode);
                }
                // Tentar mapeamento OMIM → ORPHA
                else if (diseaseCode.startsWith('OMIM:')) {
                    const orphaCode = omimToOrphaMap.get(diseaseCode);
                    if (orphaCode) {
                        sqliteDiseaseId = diseaseMap.get(orphaCode);
                    }
                }
                
                if (!sqliteDiseaseId) {
                    puladasDisease++;
                    continue;
                }
                
                // Adicionar ao batch
                associationBatch.push({
                    hpo_id: sqliteHpoId,
                    disease_id: sqliteDiseaseId,
                    evidence: String(assoc.evidence || ''),
                    frequency: String(assoc.frequency || ''),
                    source: diseaseCode.startsWith('ORPHA:') ? 'ORPHA_DIRECT' : 'OMIM_MAPPED'
                });
                
                // Processar batch
                if (associationBatch.length >= batchSize) {
                    await prisma.hpoDiseasAssociation.createMany({
                        data: associationBatch,
                        skipDuplicates: true
                    });
                    
                    importadas += associationBatch.length;
                    associationBatch.length = 0;
                    
                    if (importadas % 10000 === 0) {
                        const percent = ((processadas / allAssociations.length) * 100).toFixed(1);
                        console.log(`      🔄 Processadas: ${processadas.toLocaleString()} (${percent}%) | Importadas: ${importadas.toLocaleString()}`);
                    }
                }
                
            } catch (error) {
                console.log(`   ⚠️  Erro processando associação: ${error.message.substring(0, 50)}...`);
            }
        }
        
        // Processar último batch
        if (associationBatch.length > 0) {
            await prisma.hpoDiseasAssociation.createMany({
                data: associationBatch,
                skipDuplicates: true
            });
            importadas += associationBatch.length;
        }
        
        // 8. VERIFICAÇÃO FINAL
        console.log('\n📊 RESULTADO FINAL DA TAREFA 0.1:');
        console.log('=' + '='.repeat(60));
        
        const finalSqliteCount = await prisma.hpoDiseasAssociation.count();
        const finalMysqlCount = (await mysqlConn.query('SELECT COUNT(*) as count FROM hpo_disease_associations'))[0][0].count;
        
        console.log(`📊 ESTATÍSTICAS DE PROCESSAMENTO:`);
        console.log(`   🔄 Total processadas: ${processadas.toLocaleString()}`);
        console.log(`   ✅ Importadas: ${importadas.toLocaleString()}`);
        console.log(`   ❌ Puladas (HPO): ${puladasHpo.toLocaleString()}`);
        console.log(`   ❌ Puladas (Disease): ${puladasDisease.toLocaleString()}`);
        
        console.log(`\n📊 CONTAGENS FINAIS:`);
        console.log(`   🗄️  MySQL: ${finalMysqlCount.toLocaleString()}`);
        console.log(`   🗄️  SQLite: ${finalSqliteCount.toLocaleString()}`);
        
        const syncPercent = ((finalSqliteCount / finalMysqlCount) * 100).toFixed(1);
        console.log(`   📈 Sincronização: ${syncPercent}%`);
        
        // 9. AVALIAÇÃO DE SUCESSO
        console.log('\n🎯 AVALIAÇÃO DE SUCESSO DA TAREFA 0.1:');
        console.log('=' + '='.repeat(60));
        
        if (syncPercent >= 99.0) {
            console.log('🎉🎉🎉 TAREFA 0.1 CONCLUÍDA COM SUCESSO! 🎉🎉🎉');
            console.log('✅ Sincronização ≥ 99% alcançada');
            console.log('✅ Associações HPO-doença restauradas no SQLite');
            console.log('✅ Pronto para TAREFA 0.2');
        } else if (syncPercent >= 90.0) {
            console.log('✅ TAREFA 0.1 PARCIALMENTE CONCLUÍDA');
            console.log('⚠️  Sincronização 90-99% - Investigar lacunas');
            console.log('💡 Considerar ajustes antes da TAREFA 0.2');
        } else {
            console.log('❌ TAREFA 0.1 PRECISA DE ATENÇÃO');
            console.log('🔧 Sincronização < 90% - Revisar mapeamentos');
            console.log('⚠️  NÃO prosseguir para TAREFA 0.2 sem corrigir');
        }
        
        console.log('\n📋 RESUMO DA TAREFA 0.1:');
        console.log(`✅ Estado inicial: SQLite 0 associações`);
        console.log(`✅ Meta: ${finalMysqlCount.toLocaleString()} associações`);
        console.log(`✅ Resultado: ${finalSqliteCount.toLocaleString()} associações (${syncPercent}%)`);
        console.log(`✅ Status: ${syncPercent >= 99 ? 'CONCLUÍDA' : syncPercent >= 90 ? 'PARCIAL' : 'PENDENTE'}`);
        
    } catch (error) {
        console.error('💥 ERRO CRÍTICO na TAREFA 0.1:', error.message);
        console.error('📋 Stack trace:', error.stack);
        console.log('\n❌ TAREFA 0.1 FALHOU - Não prosseguir para próxima tarefa');
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR TAREFA 0.1
tarefa01_corrigirAssociacoesHpoDoenca().then(() => {
    console.log('\n🏁 TAREFA 0.1 FINALIZADA!');
    console.log('📋 Verifique o status antes de prosseguir para TAREFA 0.2');
}).catch(err => {
    console.error('💥 ERRO FINAL TAREFA 0.1:', err.message);
});
