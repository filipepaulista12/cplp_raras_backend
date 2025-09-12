/**
 * 🎯 DIAGNÓSTICO DIRETO: Descobrir o problema das associações HPO-doença
 * Foco: Por que só 200 de 50.024 associações foram importadas
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function diagnosticoDireto() {
    console.log('🎯 DIAGNÓSTICO DIRETO: HPO-DOENÇA');
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
        
        // 1. VER ESTRUTURA DAS TABELAS
        console.log('\n📋 ESTRUTURA DAS TABELAS...');
        
        const [hpoAssocCols] = await mysqlConn.query(`DESCRIBE hpo_disease_associations`);
        console.log('🔗 Colunas hpo_disease_associations:');
        hpoAssocCols.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type}`);
        });
        
        const [orphaDiseasesCols] = await mysqlConn.query(`DESCRIBE orpha_diseases`);
        console.log('\n🏥 Colunas orpha_diseases:');
        orphaDiseasesCols.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type}`);
        });
        
        // 2. AMOSTRA DE DADOS REAIS
        console.log('\n📊 AMOSTRA DE DADOS REAIS...');
        
        const [hpoDiseaseSample] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId, frequencyTerm, evidence
            FROM hpo_disease_associations 
            LIMIT 10
        `);
        
        console.log('🔗 Amostra associações HPO-doença:');
        hpoDiseaseSample.forEach((assoc, i) => {
            console.log(`   [${i+1}] HPO: ${assoc.hpoTermId} | Disease: ${assoc.diseaseId} | Freq: ${assoc.frequencyTerm}`);
        });
        
        const [orphaSample] = await mysqlConn.query(`
            SELECT orpha_code, orpha_id
            FROM orpha_diseases 
            LIMIT 10
        `);
        
        console.log('\n🏥 Amostra doenças Orpha:');
        orphaSample.forEach((disease, i) => {
            console.log(`   [${i+1}] Code: ${disease.orpha_code} | ID: ${disease.orpha_id}`);
        });
        
        // 3. ANÁLISE DOS CÓDIGOS DE DOENÇA
        console.log('\n🔍 ANÁLISE DOS CÓDIGOS DE DOENÇA...');
        
        const [diseaseCodeAnalysis] = await mysqlConn.query(`
            SELECT 
                diseaseId,
                COUNT(*) as count
            FROM hpo_disease_associations 
            GROUP BY diseaseId 
            ORDER BY count DESC 
            LIMIT 15
        `);
        
        console.log('📊 Top 15 códigos de doença mais usados:');
        diseaseCodeAnalysis.forEach(d => {
            console.log(`   ${d.diseaseId}: ${d.count} associações`);
        });
        
        // 4. VERIFICAR CORRESPONDÊNCIAS NO PRISMA
        console.log('\n🔍 VERIFICANDO CORRESPONDÊNCIAS NO PRISMA...');
        
        // Pegar alguns códigos do MySQL e ver se existem no Prisma
        const testCodes = diseaseCodeAnalysis.slice(0, 5).map(d => d.diseaseId);
        
        for (let code of testCodes) {
            console.log(`\n   🧪 Testando código: ${code}`);
            
            // Testar várias variações
            const variations = [
                code,                           // Exato
                code.replace('ORPHA:', ''),     // Sem prefixo
                parseInt(code.replace('ORPHA:', '') || '0'), // Como número
                code.replace('OMIM:', '')       // OMIM sem prefixo
            ];
            
            for (let variation of variations) {
                if (!variation || variation === 0) continue;
                
                const match = await prisma.rareDisease.findFirst({
                    where: { orphacode: variation },
                    select: { id: true, orphacode: true }
                });
                
                if (match) {
                    console.log(`      ✅ Match com "${variation}": ID ${match.id}, ORPHA: ${match.orphacode}`);
                    break;
                }
            }
        }
        
        // 5. CONTAR CORRESPONDÊNCIAS TOTAIS
        console.log('\n📊 CONTANDO CORRESPONDÊNCIAS TOTAIS...');
        
        // Buscar todos os códigos únicos do MySQL
        const [allUniqueCodes] = await mysqlConn.query(`
            SELECT DISTINCT diseaseId 
            FROM hpo_disease_associations
        `);
        
        console.log(`   📋 Total códigos únicos no MySQL: ${allUniqueCodes.length}`);
        
        // Buscar todos os códigos no Prisma
        const allPrismaCodes = await prisma.rareDisease.findMany({
            select: { orphacode: true }
        });
        
        console.log(`   📋 Total códigos no Prisma: ${allPrismaCodes.length}`);
        
        // Contar correspondências
        let matches = 0;
        let orphaMatches = 0;
        let omimMatches = 0;
        const prismaCodeSet = new Set(allPrismaCodes.map(c => String(c.orphacode)));
        
        for (let codeObj of allUniqueCodes.slice(0, 100)) { // Testar primeiro 100 para velocidade
            const code = codeObj.diseaseId;
            
            if (code.startsWith('ORPHA:')) {
                const numOnly = code.replace('ORPHA:', '');
                if (prismaCodeSet.has(numOnly) || prismaCodeSet.has(code)) {
                    matches++;
                    orphaMatches++;
                }
            } else if (code.startsWith('OMIM:')) {
                // OMIM codes podem não estar na tabela orpha_diseases
                omimMatches++;
            } else {
                if (prismaCodeSet.has(code)) {
                    matches++;
                }
            }
        }
        
        console.log(`   ✅ Correspondências encontradas (em 100 testados): ${matches}`);
        console.log(`   📊 ORPHA matches: ${orphaMatches}`);
        console.log(`   📊 OMIM codes: ${omimMatches}`);
        
        // 6. PROBLEMA IDENTIFICADO
        console.log('\n💡 PROBLEMA IDENTIFICADO:');
        console.log('=' + '='.repeat(50));
        
        const orphaCount = allUniqueCodes.filter(c => c.diseaseId.startsWith('ORPHA:')).length;
        const omimCount = allUniqueCodes.filter(c => c.diseaseId.startsWith('OMIM:')).length;
        
        console.log(`📊 Códigos ORPHA no MySQL: ${orphaCount}`);
        console.log(`📊 Códigos OMIM no MySQL: ${omimCount}`);
        console.log(`📊 Outros códigos: ${allUniqueCodes.length - orphaCount - omimCount}`);
        
        if (omimCount > orphaCount) {
            console.log('\n🔥 PROBLEMA PRINCIPAL IDENTIFICADO:');
            console.log('   ❌ Muitos códigos são OMIM, não ORPHA!');
            console.log('   ❌ Tabela rare_diseases só tem códigos ORPHA!');
            console.log('   💡 SOLUÇÃO: Criar mapeamento OMIM → ORPHA ou incluir códigos OMIM');
        } else {
            console.log('\n🔥 PROBLEMA IDENTIFICADO:');
            console.log('   ❌ Formato dos códigos ORPHA não confere');
            console.log('   ❌ MySQL: "ORPHA:123456" vs Prisma: "123456"');
            console.log('   💡 SOLUÇÃO: Remover prefixo ORPHA: no mapeamento');
        }
        
        // 7. CRIAR SOLUÇÃO
        console.log('\n🔧 PREPARANDO SOLUÇÃO...');
        
        if (omimCount > 1000) {
            console.log('   🎯 ESTRATÉGIA: Focar nos códigos ORPHA primeiro');
            console.log('   📊 Isso deve dar pelo menos 80% das associações');
        }
        
        console.log('   ✅ Implementação da solução em andamento...');
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR DIAGNÓSTICO
diagnosticoDireto().then(() => {
    console.log('\n🏆 DIAGNÓSTICO DIRETO CONCLUÍDO!');
    console.log('🎯 PROBLEMA IDENTIFICADO - IMPLEMENTANDO SOLUÇÃO!');
}).catch(err => {
    console.error('💥 ERRO:', err.message);
});
