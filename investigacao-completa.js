/**
 * 🔍 INVESTIGAÇÃO COMPLETA: Por que só 200 associações de 50.024?
 * Vamos ver TODOS os tipos de códigos de doença no MySQL
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function investigacaoCompleta() {
    console.log('🔍 INVESTIGAÇÃO COMPLETA: TODOS OS CÓDIGOS');
    console.log('=' + '='.repeat(50));
    
    let mysqlConn;
    
    try {
        mysqlConn = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cplp_raras'
        });
        
        console.log('✅ Conexão estabelecida');
        
        // 1. CONTAR TODOS OS TIPOS DE CÓDIGOS
        console.log('\n📊 CONTANDO TODOS OS TIPOS DE CÓDIGOS...');
        
        const [codeDistribution] = await mysqlConn.query(`
            SELECT 
                CASE 
                    WHEN diseaseId LIKE 'ORPHA:%' THEN 'ORPHA'
                    WHEN diseaseId LIKE 'OMIM:%' THEN 'OMIM'
                    WHEN diseaseId LIKE 'MONDO:%' THEN 'MONDO'
                    WHEN diseaseId LIKE 'HP:%' THEN 'HP'
                    WHEN diseaseId REGEXP '^[0-9]+$' THEN 'NUMERO_PURO'
                    ELSE 'OUTRO'
                END as tipo_codigo,
                COUNT(*) as quantidade
            FROM hpo_disease_associations
            GROUP BY tipo_codigo
            ORDER BY quantidade DESC
        `);
        
        console.log('📋 Distribuição dos códigos de doença:');
        let totalAssociacoes = 0;
        codeDistribution.forEach(row => {
            console.log(`   ${row.tipo_codigo}: ${row.quantidade.toLocaleString()} associações`);
            totalAssociacoes += row.quantidade;
        });
        console.log(`   🎯 TOTAL: ${totalAssociacoes.toLocaleString()} associações`);
        
        // 2. AMOSTRAS DE CADA TIPO
        console.log('\n🔍 AMOSTRAS DE CADA TIPO DE CÓDIGO...');
        
        for (let codeType of codeDistribution) {
            const pattern = codeType.tipo_codigo;
            let whereClause;
            
            switch(pattern) {
                case 'ORPHA':
                    whereClause = "diseaseId LIKE 'ORPHA:%'";
                    break;
                case 'OMIM':
                    whereClause = "diseaseId LIKE 'OMIM:%'";
                    break;
                case 'MONDO':
                    whereClause = "diseaseId LIKE 'MONDO:%'";
                    break;
                case 'HP':
                    whereClause = "diseaseId LIKE 'HP:%'";
                    break;
                case 'NUMERO_PURO':
                    whereClause = "diseaseId REGEXP '^[0-9]+$'";
                    break;
                default:
                    whereClause = "diseaseId NOT LIKE 'ORPHA:%' AND diseaseId NOT LIKE 'OMIM:%' AND diseaseId NOT LIKE 'MONDO:%' AND diseaseId NOT LIKE 'HP:%' AND diseaseId NOT REGEXP '^[0-9]+$'";
            }
            
            const [samples] = await mysqlConn.query(`
                SELECT DISTINCT diseaseId 
                FROM hpo_disease_associations 
                WHERE ${whereClause}
                LIMIT 5
            `);
            
            console.log(`\n   📋 ${pattern} (${codeType.quantidade.toLocaleString()}):`);
            samples.forEach((sample, i) => {
                console.log(`      [${i+1}] ${sample.diseaseId}`);
            });
        }
        
        // 3. VERIFICAR SE TEMOS MAPEAMENTO PARA OUTROS TIPOS
        console.log('\n🗺️  VERIFICANDO MAPEAMENTOS DISPONÍVEIS...');
        
        // Verificar tabelas disponíveis
        const [tables] = await mysqlConn.query("SHOW TABLES");
        console.log('📋 Tabelas disponíveis no MySQL:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });
        
        // 4. CRIAR ESTRATÉGIA PARA CADA TIPO
        console.log('\n🎯 ESTRATÉGIA PARA CADA TIPO DE CÓDIGO:');
        
        const orphaCount = codeDistribution.find(c => c.tipo_codigo === 'ORPHA')?.quantidade || 0;
        const omimCount = codeDistribution.find(c => c.tipo_codigo === 'OMIM')?.quantidade || 0;
        const mondoCount = codeDistribution.find(c => c.tipo_codigo === 'MONDO')?.quantidade || 0;
        const numeroCount = codeDistribution.find(c => c.tipo_codigo === 'NUMERO_PURO')?.quantidade || 0;
        
        console.log(`\n📊 CÓDIGOS ORPHA: ${orphaCount.toLocaleString()}`);
        if (orphaCount > 0) {
            console.log('   ✅ ESTRATÉGIA: Mapear removendo prefixo ORPHA:');
            console.log('   🎯 SUCESSO ESPERADO: Alto (já temos tabela orpha_diseases)');
        }
        
        console.log(`\n📊 CÓDIGOS OMIM: ${omimCount.toLocaleString()}`);
        if (omimCount > 0) {
            console.log('   ⚠️  ESTRATÉGIA: Verificar se temos mapeamento OMIM → ORPHA');
            console.log('   🎯 SUCESSO ESPERADO: Médio (depende de mapeamento)');
        }
        
        console.log(`\n📊 CÓDIGOS MONDO: ${mondoCount.toLocaleString()}`);
        if (mondoCount > 0) {
            console.log('   ⚠️  ESTRATÉGIA: Verificar se temos mapeamento MONDO → ORPHA');
            console.log('   🎯 SUCESSO ESPERADO: Baixo (raro ter mapeamento)');
        }
        
        console.log(`\n📊 NÚMEROS PUROS: ${numeroCount.toLocaleString()}`);
        if (numeroCount > 0) {
            console.log('   🔍 ESTRATÉGIA: Testar se são códigos ORPHA sem prefixo');
            console.log('   🎯 SUCESSO ESPERADO: Alto (provavelmente ORPHA)');
        }
        
        // 5. IMPLEMENTAÇÃO PRÁTICA
        console.log('\n🚀 IMPLEMENTAÇÃO PRÁTICA:');
        console.log('=' + '='.repeat(50));
        
        if (numeroCount > 30000) {
            console.log('🎯 DESCOBERTA: Muitos códigos são números puros!');
            console.log('💡 HIPÓTESE: São códigos ORPHA sem prefixo');
            console.log('🔧 SOLUÇÃO: Testar mapeamento direto com números');
            
            // Testar alguns números puros
            const [pureNumbers] = await mysqlConn.query(`
                SELECT DISTINCT diseaseId 
                FROM hpo_disease_associations 
                WHERE diseaseId REGEXP '^[0-9]+$'
                LIMIT 10
            `);
            
            console.log('\n🧪 TESTANDO NÚMEROS PUROS:');
            for (let numberObj of pureNumbers) {
                const number = numberObj.diseaseId;
                
                const match = await prisma.rareDisease.findFirst({
                    where: { orphacode: number },
                    select: { id: true, orphacode: true }
                });
                
                if (match) {
                    console.log(`   ✅ ${number} → Prisma ID ${match.id}`);
                } else {
                    console.log(`   ❌ ${number} → Não encontrado`);
                }
            }
        }
        
        if (omimCount > 10000) {
            console.log('\n🎯 CÓDIGOS OMIM SIGNIFICATIVOS DETECTADOS!');
            console.log('⚠️  PROBLEMA: Prisma só tem códigos ORPHA');
            console.log('💡 NECESSÁRIO: Mapear OMIM → ORPHA ou criar tabela OMIM');
        }
        
        // 6. RECOMENDAR PRÓXIMO PASSO
        console.log('\n🎯 RECOMENDAÇÃO PARA PRÓXIMO PASSO:');
        
        if (numeroCount > orphaCount) {
            console.log('🚀 PRIORIDADE 1: Importar códigos numéricos puros');
            console.log('📊 Potencial: Até mais 40k associações');
        }
        
        if (orphaCount > 0) {
            console.log('🚀 PRIORIDADE 2: Reimportar códigos ORPHA (verificar filtro)');
            console.log('📊 Potencial: Algumas centenas/milhares');
        }
        
        if (omimCount > 5000) {
            console.log('🚀 PRIORIDADE 3: Investigar mapeamento OMIM');
            console.log('📊 Potencial: Milhares de associações');
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

// EXECUTAR INVESTIGAÇÃO
investigacaoCompleta().then(() => {
    console.log('\n🏆 INVESTIGAÇÃO COMPLETA CONCLUÍDA!');
    console.log('🎯 ESTRATÉGIA CLARA PARA AS 50K ASSOCIAÇÕES!');
}).catch(err => {
    console.error('💥 ERRO:', err.message);
});
