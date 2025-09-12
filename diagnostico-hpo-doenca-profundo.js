/**
 * 🔧 DIAGNÓSTICO PROFUNDO: Por que só 200 de 50.024 associações HPO-doença?
 * Vamos descobrir o problema real e resolvê-lo definitivamente
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function diagnosticoHpoDoencaProfundo() {
    console.log('🔧 DIAGNÓSTICO PROFUNDO: HPO-DOENÇA');
    console.log('=' + '='.repeat(50));
    console.log('🎯 META: Descobrir por que só 200 de 50.024 foram importadas');
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexões estabelecidas');
        
        // 1. ANÁLISE DETALHADA DOS CÓDIGOS NO MYSQL
        console.log('\n🔍 ANALISANDO CÓDIGOS NO MYSQL...');
        
        const [sampleHpoDisease] = await mysqlConn.query(`
            SELECT 
                hda.diseaseId,
                hda.hpoTermId,
                ht.hpoId as hpo_code,
                od.orpha_code,
                od.name as disease_name
            FROM hpo_disease_associations hda
            LEFT JOIN hpo_terms ht ON hda.hpoTermId = ht.id
            LEFT JOIN orpha_diseases od ON hda.diseaseId = od.orpha_code
            LIMIT 20
        `);
        
        console.log('📊 Amostra de associações HPO-doença do MySQL:');
        sampleHpoDisease.forEach((assoc, i) => {
            console.log(`   [${i+1}] Disease: ${assoc.diseaseId} | HPO: ${assoc.hpo_code} | Match: ${assoc.orpha_code || 'NULL'}`);
        });
        
        // 2. ANÁLISE DOS CÓDIGOS ÚNICOS
        console.log('\n📊 ANÁLISE DOS CÓDIGOS ÚNICOS...');
        
        const [uniqueDiseaseIds] = await mysqlConn.query(`
            SELECT DISTINCT diseaseId, COUNT(*) as count
            FROM hpo_disease_associations 
            GROUP BY diseaseId 
            ORDER BY count DESC 
            LIMIT 10
        `);
        
        console.log('🏥 Top 10 códigos de doença mais frequentes:');
        uniqueDiseaseIds.forEach(d => {
            console.log(`   ${d.diseaseId}: ${d.count} associações`);
        });
        
        // 3. VERIFICAR FORMATOS NO PRISMA
        console.log('\n🔍 VERIFICANDO FORMATOS NO PRISMA...');
        
        const prismaDiseaseSample = await prisma.rareDisease.findMany({
            take: 20,
            select: { 
                id: true, 
                orphacode: true, 
                name: true 
            },
            orderBy: { id: 'asc' }
        });
        
        console.log('🏥 Amostra de doenças no Prisma:');
        prismaDiseaseSample.forEach((d, i) => {
            console.log(`   [${i+1}] ID: ${d.id} | ORPHA: ${d.orphacode} | ${d.name?.substring(0, 40)}`);
        });
        
        // 4. TESTE DE MAPEAMENTO DIRETO
        console.log('\n🧪 TESTE DE MAPEAMENTO DIRETO...');
        
        // Pegar alguns códigos específicos do MySQL
        const testCodes = ['ORPHA:207110', 'ORPHA:896', 'ORPHA:93262', 'OMIM:144750'];
        
        for (let code of testCodes) {
            // Buscar no Prisma
            const prismaMatch1 = await prisma.rareDisease.findFirst({
                where: { orphacode: code },
                select: { id: true, orphacode: true }
            });
            
            const prismaMatch2 = await prisma.rareDisease.findFirst({
                where: { orphacode: code.replace('ORPHA:', '') },
                select: { id: true, orphacode: true }
            });
            
            const prismaMatch3 = await prisma.rareDisease.findFirst({
                where: { orphacode: parseInt(code.replace('ORPHA:', '')) },
                select: { id: true, orphacode: true }
            });
            
            console.log(`   🔍 ${code}:`);
            console.log(`      Com prefixo: ${prismaMatch1 ? `ID ${prismaMatch1.id}` : 'NÃO ENCONTRADO'}`);
            console.log(`      Sem prefixo: ${prismaMatch2 ? `ID ${prismaMatch2.id}` : 'NÃO ENCONTRADO'}`);
            console.log(`      Como número: ${prismaMatch3 ? `ID ${prismaMatch3.id}` : 'NÃO ENCONTRADO'}`);
        }
        
        // 5. VERIFICAR DISTRIBUIÇÃO DE CÓDIGOS
        console.log('\n📈 DISTRIBUIÇÃO DE CÓDIGOS...');
        
        const [codePatterns] = await mysqlConn.query(`
            SELECT 
                CASE 
                    WHEN diseaseId LIKE 'ORPHA:%' THEN 'ORPHA'
                    WHEN diseaseId LIKE 'OMIM:%' THEN 'OMIM'
                    WHEN diseaseId REGEXP '^[0-9]+$' THEN 'NUMERO'
                    ELSE 'OUTRO'
                END as pattern,
                COUNT(*) as count
            FROM hpo_disease_associations
            GROUP BY pattern
            ORDER BY count DESC
        `);
        
        console.log('📊 Padrões de códigos de doença:');
        codePatterns.forEach(p => {
            console.log(`   ${p.pattern}: ${p.count.toLocaleString()} associações`);
        });
        
        // 6. VERIFICAR SE É PROBLEMA DE CAMPO
        console.log('\n🔍 VERIFICANDO CAMPOS NO PRISMA...');
        
        // Listar todas as colunas da tabela rare_diseases
        const sampleDisease = await prisma.rareDisease.findFirst();
        if (sampleDisease) {
            console.log('📋 Campos disponíveis na tabela rare_diseases:');
            Object.keys(sampleDisease).forEach(key => {
                console.log(`   - ${key}: ${typeof sampleDisease[key]} = ${sampleDisease[key]}`);
            });
        }
        
        // 7. BUSCAR CÓDIGOS ORPHA EXATOS
        console.log('\n🎯 BUSCANDO CORRESPONDÊNCIAS EXATAS...');
        
        // Pegar 5 códigos ORPHA do MySQL
        const [orphaCodes] = await mysqlConn.query(`
            SELECT DISTINCT diseaseId 
            FROM hpo_disease_associations 
            WHERE diseaseId LIKE 'ORPHA:%' 
            LIMIT 5
        `);
        
        for (let codeRow of orphaCodes) {
            const code = codeRow.diseaseId;
            const numberOnly = code.replace('ORPHA:', '');
            
            // Buscar todas as variações no Prisma
            const matches = await prisma.rareDisease.findMany({
                where: {
                    OR: [
                        { orphacode: code },
                        { orphacode: numberOnly },
                        { orphacode: parseInt(numberOnly) }
                    ]
                },
                select: { id: true, orphacode: true, name: true }
            });
            
            console.log(`   🔍 ${code} (${numberOnly}):`);
            if (matches.length > 0) {
                matches.forEach(m => {
                    console.log(`      ✅ Match: ID ${m.id}, ORPHA: ${m.orphacode}`);
                });
            } else {
                console.log(`      ❌ Nenhuma correspondência encontrada`);
            }
        }
        
        // 8. SOLUÇÃO PROPOSTA
        console.log('\n💡 ANÁLISE E SOLUÇÃO:');
        console.log('=' + '='.repeat(50));
        
        const totalOrphaCodes = codePatterns.find(p => p.pattern === 'ORPHA')?.count || 0;
        const totalOmimCodes = codePatterns.find(p => p.pattern === 'OMIM')?.count || 0;
        
        console.log(`📊 ORPHA codes: ${totalOrphaCodes.toLocaleString()}`);
        console.log(`📊 OMIM codes: ${totalOmimCodes.toLocaleString()}`);
        
        if (totalOrphaCodes > 0) {
            console.log('\n🎯 PROBLEMA IDENTIFICADO:');
            console.log('   - MySQL tem códigos como "ORPHA:123456"');
            console.log('   - Prisma pode ter apenas números "123456"');
            console.log('   - Necessário mapeamento correto');
            
            console.log('\n🔧 SOLUÇÃO PROPOSTA:');
            console.log('   1. Extrair números dos códigos ORPHA');
            console.log('   2. Mapear para IDs do Prisma');
            console.log('   3. Importar com mapeamento correto');
            console.log('   4. Incluir códigos OMIM se necessário');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
        console.error(error.stack);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR DIAGNÓSTICO
diagnosticoHpoDoencaProfundo().then(() => {
    console.log('\n🏆 DIAGNÓSTICO PROFUNDO CONCLUÍDO!');
    console.log('💡 PROBLEMA IDENTIFICADO - SOLUÇÃO EM ANDAMENTO!');
}).catch(err => {
    console.error('💥 ERRO NO DIAGNÓSTICO:', err.message);
});
