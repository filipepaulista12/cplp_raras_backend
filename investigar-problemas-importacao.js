/**
 * 🔍 INVESTIGAÇÃO: Problemas de importação HPO, Medicamentos e Interações
 * Analisar estruturas e corrigir problemas específicos
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function investigarProblemasImportacao() {
    console.log('🔍 INVESTIGAÇÃO: Problemas de importação');
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
        
        // 1. INVESTIGAR HPO TERMS
        console.log('\n🧬 INVESTIGANDO HPO TERMS...');
        const [hpoSample] = await mysqlConn.query('SELECT * FROM hpo_terms LIMIT 3');
        console.log('📊 Estrutura HPO Terms (amostra):');
        if (hpoSample.length > 0) {
            console.log('   Campos disponíveis:', Object.keys(hpoSample[0]));
            hpoSample.forEach((hpo, i) => {
                console.log(`   [${i+1}] ID: ${hpo.hpoId || hpo.hpo_id || hpo.id}`);
                console.log(`       Nome: ${hpo.name || hpo.term_name || 'N/A'}`);
                console.log(`       Definição: ${(hpo.definition || '').substring(0, 100)}...`);
            });
        }
        
        // 2. INVESTIGAR DRUGBANK DRUGS
        console.log('\n💊 INVESTIGANDO DRUGBANK DRUGS...');
        const [drugSample] = await mysqlConn.query('SELECT * FROM drugbank_drugs LIMIT 3');
        console.log('📊 Estrutura Drugbank Drugs (amostra):');
        if (drugSample.length > 0) {
            console.log('   Campos disponíveis:', Object.keys(drugSample[0]));
            drugSample.forEach((drug, i) => {
                console.log(`   [${i+1}] ID: ${drug.drugbank_id || drug.id}`);
                console.log(`       Nome: ${drug.name || drug.drug_name || 'N/A'}`);
                console.log(`       Tipo: ${drug.type || 'N/A'}`);
            });
        }
        
        // 3. INVESTIGAR DRUG INTERACTIONS
        console.log('\n🔄 INVESTIGANDO DRUG INTERACTIONS...');
        const [interactionSample] = await mysqlConn.query('SELECT * FROM drug_interactions LIMIT 3');
        console.log('📊 Estrutura Drug Interactions (amostra):');
        if (interactionSample.length > 0) {
            console.log('   Campos disponíveis:', Object.keys(interactionSample[0]));
            interactionSample.forEach((interaction, i) => {
                console.log(`   [${i+1}] Drug 1: ${interaction.drug_1_id || interaction.drugId1}`);
                console.log(`       Drug 2: ${interaction.drug_2_id || interaction.drugId2}`);
                console.log(`       Descrição: ${(interaction.description || '').substring(0, 80)}...`);
            });
        }
        
        // 4. VERIFICAR SCHEMA PRISMA
        console.log('\n💎 VERIFICANDO COMPATIBILIDADE PRISMA...');
        
        // Testar criação HPO Term
        console.log('\n🧬 TESTANDO CRIAÇÃO HPO TERM...');
        try {
            if (hpoSample.length > 0) {
                const testHpo = hpoSample[0];
                const hpoId = String(testHpo.hpoId || testHpo.hpo_id || testHpo.id || 'HP:TEST001');
                const name = String(testHpo.name || testHpo.term_name || 'Test HPO Term');
                
                console.log(`   Tentando criar: ID=${hpoId}, Nome=${name}`);
                
                await prisma.hpoTerm.create({
                    data: {
                        hpo_id: hpoId,
                        name: name,
                        name_pt: String(testHpo.name_pt || name),
                        definition: String(testHpo.definition || ''),
                        definition_pt: String(testHpo.definition_pt || testHpo.definition || ''),
                        synonyms: String(testHpo.exactSynonyms || testHpo.synonyms || ''),
                        category: 'Phenotype',
                        is_active: Boolean(!testHpo.isObsolete)
                    }
                });
                console.log('   ✅ HPO Term criado com sucesso!');
                
                // Limpar teste
                await prisma.hpoTerm.deleteMany({ where: { hpo_id: hpoId } });
            }
        } catch (e) {
            console.log('   ❌ Erro HPO Term:', e.message);
        }
        
        // Testar criação Drug
        console.log('\n💊 TESTANDO CRIAÇÃO DRUGBANK DRUG...');
        try {
            if (drugSample.length > 0) {
                const testDrug = drugSample[0];
                const drugbankId = String(testDrug.drugbank_id || testDrug.id || 'DB_TEST001');
                const name = String(testDrug.name || testDrug.drug_name || 'Test Drug');
                
                console.log(`   Tentando criar: ID=${drugbankId}, Nome=${name}`);
                
                await prisma.drugbankDrug.create({
                    data: {
                        drugbank_id: drugbankId,
                        name: name,
                        name_pt: String(testDrug.name_pt || name),
                        type: String(testDrug.type || 'Drug'),
                        description: String(testDrug.description || ''),
                        description_pt: String(testDrug.description_pt || testDrug.description || ''),
                        indication: String(testDrug.indication || ''),
                        indication_pt: String(testDrug.indication_pt || testDrug.indication || ''),
                        pharmacodynamics: String(testDrug.pharmacodynamics || ''),
                        mechanism_of_action: String(testDrug.mechanism_of_action || ''),
                        toxicity: String(testDrug.toxicity || ''),
                        metabolism: String(testDrug.metabolism || ''),
                        absorption: String(testDrug.absorption || ''),
                        half_life: String(testDrug.half_life || ''),
                        protein_binding: String(testDrug.protein_binding || ''),
                        route_of_elimination: String(testDrug.route_of_elimination || ''),
                        volume_of_distribution: String(testDrug.volume_of_distribution || ''),
                        clearance: String(testDrug.clearance || ''),
                        is_active: true
                    }
                });
                console.log('   ✅ Drugbank Drug criado com sucesso!');
                
                // Limpar teste
                await prisma.drugbankDrug.deleteMany({ where: { drugbank_id: drugbankId } });
            }
        } catch (e) {
            console.log('   ❌ Erro Drugbank Drug:', e.message);
        }
        
        // Testar criação Drug Interaction
        console.log('\n🔄 TESTANDO CRIAÇÃO DRUG INTERACTION...');
        try {
            if (interactionSample.length > 0) {
                const testInteraction = interactionSample[0];
                const drug1 = String(testInteraction.drug_1_id || testInteraction.drugId1 || 'DRUG1_TEST');
                const drug2 = String(testInteraction.drug_2_id || testInteraction.drugId2 || 'DRUG2_TEST');
                
                console.log(`   Tentando criar: Drug1=${drug1}, Drug2=${drug2}`);
                
                await prisma.drugInteraction.create({
                    data: {
                        drug_1_id: drug1,
                        drug_2_id: drug2,
                        description: String(testInteraction.description || testInteraction.interaction_description || ''),
                        severity: String(testInteraction.severity || 'Unknown'),
                        mechanism: String(testInteraction.mechanism || ''),
                        management: String(testInteraction.management || ''),
                        evidence: String(testInteraction.evidence || ''),
                        is_active: true
                    }
                });
                console.log('   ✅ Drug Interaction criada com sucesso!');
                
                // Limpar teste
                await prisma.drugInteraction.deleteMany({ 
                    where: { 
                        drug_1_id: drug1,
                        drug_2_id: drug2
                    } 
                });
            }
        } catch (e) {
            console.log('   ❌ Erro Drug Interaction:', e.message);
        }
        
        // 5. ANÁLISE DE PROBLEMAS
        console.log('\n🔍 ANÁLISE DE PROBLEMAS IDENTIFICADOS:');
        console.log('=' + '='.repeat(50));
        
        // Verificar se existem dados nulos/problemáticos
        const [hpoNullCheck] = await mysqlConn.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN hpoId IS NULL OR hpoId = '' THEN 1 END) as null_id,
                COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as null_name
            FROM hpo_terms
        `);
        
        console.log('📊 HPO Terms - Dados problemáticos:');
        console.log(`   Total: ${hpoNullCheck[0].total}`);
        console.log(`   IDs nulos/vazios: ${hpoNullCheck[0].null_id}`);
        console.log(`   Nomes nulos/vazios: ${hpoNullCheck[0].null_name}`);
        
        const [drugNullCheck] = await mysqlConn.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN drugbank_id IS NULL OR drugbank_id = '' THEN 1 END) as null_id,
                COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as null_name
            FROM drugbank_drugs
        `);
        
        console.log('\n📊 Drugbank Drugs - Dados problemáticos:');
        console.log(`   Total: ${drugNullCheck[0].total}`);
        console.log(`   IDs nulos/vazios: ${drugNullCheck[0].null_id}`);
        console.log(`   Nomes nulos/vazios: ${drugNullCheck[0].null_name}`);
        
        const [interactionNullCheck] = await mysqlConn.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN drug_1_id IS NULL OR drug_1_id = '' THEN 1 END) as null_drug1,
                COUNT(CASE WHEN drug_2_id IS NULL OR drug_2_id = '' THEN 1 END) as null_drug2
            FROM drug_interactions
        `);
        
        console.log('\n📊 Drug Interactions - Dados problemáticos:');
        console.log(`   Total: ${interactionNullCheck[0].total}`);
        console.log(`   Drug 1 nulos/vazios: ${interactionNullCheck[0].null_drug1}`);
        console.log(`   Drug 2 nulos/vazios: ${interactionNullCheck[0].null_drug2}`);
        
        // 6. RECOMENDAÇÕES
        console.log('\n💡 RECOMENDAÇÕES PARA CORREÇÃO:');
        console.log('=' + '='.repeat(50));
        
        console.log('🧬 HPO Terms:');
        if (hpoNullCheck[0].null_id > 0) {
            console.log('   ⚠️  Filtrar registros com IDs válidos');
        }
        if (hpoNullCheck[0].null_name > 0) {
            console.log('   ⚠️  Filtrar registros com nomes válidos');
        }
        console.log('   ✅ Usar tratamento robusto de strings');
        
        console.log('\n💊 Drugbank Drugs:');
        if (drugNullCheck[0].null_id > 0) {
            console.log('   ⚠️  Filtrar registros com IDs válidos');
        }
        if (drugNullCheck[0].null_name > 0) {
            console.log('   ⚠️  Filtrar registros com nomes válidos');
        }
        console.log('   ✅ Usar tratamento robusto de strings');
        
        console.log('\n🔄 Drug Interactions:');
        if (interactionNullCheck[0].null_drug1 > 0 || interactionNullCheck[0].null_drug2 > 0) {
            console.log('   ⚠️  Filtrar registros com IDs de drogas válidos');
        }
        console.log('   ✅ Usar tratamento robusto de strings');
        
        console.log('\n🚀 PRÓXIMO PASSO:');
        console.log('   Implementar importação corrigida com filtros robustos');
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR INVESTIGAÇÃO
investigarProblemasImportacao().then(() => {
    console.log('\n🏆 INVESTIGAÇÃO CONCLUÍDA!');
    console.log('💡 Problemas identificados e soluções prontas');
}).catch(err => {
    console.error('💥 ERRO NA INVESTIGAÇÃO:', err.message);
});
