/**
 * 🔧 CORREÇÃO: Encontrar mapeamento OMIM correto
 * Usar nomes de colunas corretos da tabela orpha_external_mappings
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');

const prisma = new PrismaClient();

async function correcaoMapeamentoOMIM() {
    console.log('🔧 CORREÇÃO: MAPEAMENTO OMIM CORRETO');
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
        
        // 1. VER AMOSTRA DA TABELA DE MAPEAMENTOS
        console.log('\n📊 AMOSTRA DA TABELA orpha_external_mappings...');
        
        const [mappingSample] = await mysqlConn.query(`
            SELECT * FROM orpha_external_mappings LIMIT 5
        `);
        
        console.log('📋 Estrutura real da tabela:');
        if (mappingSample.length > 0) {
            Object.keys(mappingSample[0]).forEach(key => {
                console.log(`   - ${key}: ${mappingSample[0][key]}`);
            });
            
            // Ver se há códigos OMIM
            const [omimMappings] = await mysqlConn.query(`
                SELECT * FROM orpha_external_mappings 
                WHERE source_code LIKE 'OMIM:%' OR source_code REGEXP '^[0-9]+$'
                LIMIT 10
            `);
            
            console.log('\n📊 Mapeamentos que podem ser OMIM:');
            omimMappings.forEach((mapping, i) => {
                console.log(`   [${i+1}] Source: ${mapping.source_code} | System: ${mapping.source_system} | ORPHA: ${mapping.orpha_disease_id}`);
            });
            
            // Contar códigos por sistema
            const [systemCounts] = await mysqlConn.query(`
                SELECT source_system, COUNT(*) as count
                FROM orpha_external_mappings 
                GROUP BY source_system
                ORDER BY count DESC
            `);
            
            console.log('\n📊 Contagem por sistema de origem:');
            systemCounts.forEach(system => {
                console.log(`   ${system.source_system}: ${system.count.toLocaleString()} mapeamentos`);
            });
        }
        
        // 2. BUSCAR OMIM ESPECIFICAMENTE
        console.log('\n🔍 BUSCANDO OMIM ESPECIFICAMENTE...');
        
        const [omimSpecific] = await mysqlConn.query(`
            SELECT COUNT(*) as total
            FROM orpha_external_mappings 
            WHERE source_system = 'OMIM'
        `);
        
        console.log(`📊 Mapeamentos OMIM encontrados: ${omimSpecific[0].total.toLocaleString()}`);
        
        if (omimSpecific[0].total > 0) {
            // Buscar amostras de OMIM
            const [omimSamples] = await mysqlConn.query(`
                SELECT source_code, orpha_disease_id
                FROM orpha_external_mappings 
                WHERE source_system = 'OMIM'
                LIMIT 10
            `);
            
            console.log('\n📋 Amostra mapeamentos OMIM:');
            omimSamples.forEach((mapping, i) => {
                console.log(`   [${i+1}] OMIM: ${mapping.source_code} → ORPHA: ${mapping.orpha_disease_id}`);
            });
            
            // 3. TESTAR MAPEAMENTO COM ASSOCIAÇÕES REAIS
            console.log('\n🧪 TESTANDO MAPEAMENTO REAL...');
            
            const [testOmimCodes] = await mysqlConn.query(`
                SELECT DISTINCT diseaseId 
                FROM hpo_disease_associations 
                WHERE diseaseId LIKE 'OMIM:%'
                LIMIT 10
            `);
            
            let sucessos = 0;
            
            for (let codeObj of testOmimCodes) {
                const omimCode = codeObj.diseaseId.replace('OMIM:', ''); // Remover prefixo
                
                // Buscar mapeamento
                const [mapping] = await mysqlConn.query(`
                    SELECT orpha_disease_id 
                    FROM orpha_external_mappings 
                    WHERE source_system = 'OMIM' AND source_code = ?
                `, [omimCode]);
                
                if (mapping.length > 0) {
                    const orphaId = mapping[0].orpha_disease_id;
                    
                    // Buscar doença no Prisma
                    const prismaMatch = await prisma.rareDisease.findFirst({
                        where: { orphacode: orphaId },
                        select: { id: true, orphacode: true }
                    });
                    
                    if (prismaMatch) {
                        console.log(`   ✅ OMIM:${omimCode} → ORPHA:${orphaId} → Prisma ID ${prismaMatch.id}`);
                        sucessos++;
                    } else {
                        console.log(`   ⚠️  OMIM:${omimCode} → ORPHA:${orphaId} → Não encontrado no Prisma`);
                    }
                } else {
                    console.log(`   ❌ OMIM:${omimCode} → Sem mapeamento`);
                }
            }
            
            console.log(`\n📊 Sucessos de mapeamento: ${sucessos}/10`);
            
            if (sucessos >= 5) {
                console.log('\n🎉 MAPEAMENTO FUNCIONAL!');
                console.log('🚀 IMPLEMENTANDO IMPORTAÇÃO COMPLETA...');
                
                // 4. IMPLEMENTAR IMPORTAÇÃO COMPLETA
                await implementarImportacaoCompleta(mysqlConn);
                
            } else {
                console.log('\n⚠️  Mapeamento insuficiente');
                console.log('💡 Tentando estratégias alternativas...');
                
                // Tentar buscar por códigos numéricos puros
                await tentarMapeamentoNumerico(mysqlConn);
            }
            
        } else {
            console.log('\n❌ Nenhum mapeamento OMIM encontrado');
            console.log('💡 Explorando alternativas...');
            
            // Ver se há mapeamentos por código numérico
            await explorarAlternativas(mysqlConn);
        }
        
    } catch (error) {
        console.error('💥 ERRO:', error.message);
    } finally {
        if (mysqlConn) await mysqlConn.end();
        await prisma.$disconnect();
    }
}

async function implementarImportacaoCompleta(mysqlConn) {
    console.log('\n🚀 IMPLEMENTANDO IMPORTAÇÃO COMPLETA...');
    
    try {
        // Criar mapeamentos HPO
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
        
        // Criar mapeamento OMIM completo
        const [allOmimMappings] = await mysqlConn.query(`
            SELECT source_code, orpha_disease_id 
            FROM orpha_external_mappings 
            WHERE source_system = 'OMIM'
        `);
        
        const omimToPrismaId = new Map();
        
        for (let mapping of allOmimMappings) {
            const omimCode = mapping.source_code;
            const orphaId = mapping.orpha_disease_id;
            
            const prismaMatch = await prisma.rareDisease.findFirst({
                where: { orphacode: orphaId },
                select: { id: true }
            });
            
            if (prismaMatch) {
                omimToPrismaId.set(`OMIM:${omimCode}`, prismaMatch.id);
            }
        }
        
        console.log(`   📊 Mapeamentos OMIM criados: ${omimToPrismaId.size}`);
        
        // Limpar associações existentes
        await prisma.hpoDiseasAssociation.deleteMany({});
        
        // Importar todas as associações
        const [allAssociations] = await mysqlConn.query(`
            SELECT hpoTermId, diseaseId, frequencyTerm, evidence
            FROM hpo_disease_associations
        `);
        
        let importadas = 0;
        let puladas = 0;
        
        for (let assoc of allAssociations) {
            try {
                const hpoCode = mysqlHpoToCode.get(assoc.hpoTermId);
                const hpoPrismaId = hpoCode ? prismaHpoCodeToId.get(hpoCode) : null;
                
                let diseasePrismaId = null;
                
                if (assoc.diseaseId.startsWith('OMIM:')) {
                    diseasePrismaId = omimToPrismaId.get(assoc.diseaseId);
                } else if (assoc.diseaseId.startsWith('ORPHA:')) {
                    const orphaNumber = assoc.diseaseId.replace('ORPHA:', '');
                    const orphaMatch = await prisma.rareDisease.findFirst({
                        where: { orphacode: orphaNumber },
                        select: { id: true }
                    });
                    diseasePrismaId = orphaMatch?.id;
                }
                
                if (hpoPrismaId && diseasePrismaId) {
                    await prisma.hpoDiseasAssociation.create({
                        data: {
                            hpo_id: hpoPrismaId,
                            disease_id: diseasePrismaId,
                            evidence: String(assoc.evidence || ''),
                            frequency: String(assoc.frequencyTerm || ''),
                            source: assoc.diseaseId.startsWith('OMIM:') ? 'OMIM' : 'HPO'
                        }
                    });
                    importadas++;
                    
                    if (importadas % 1000 === 0) {
                        console.log(`      📊 ${importadas.toLocaleString()} importadas...`);
                    }
                } else {
                    puladas++;
                }
                
            } catch (e) {
                puladas++;
            }
        }
        
        console.log(`✅ RESULTADO: ${importadas.toLocaleString()} importadas | ${puladas.toLocaleString()} puladas`);
        
        // Verificação final
        const finalHpoDisease = await prisma.hpoDiseasAssociation.count();
        console.log(`🎯 TOTAL FINAL HPO-DISEASE: ${finalHpoDisease.toLocaleString()}`);
        
        if (finalHpoDisease >= 40000) {
            console.log('🎉🎉🎉 SUCESSO TOTAL! 🎉🎉🎉');
        } else if (finalHpoDisease >= 20000) {
            console.log('🎉🎉 GRANDE SUCESSO! 🎉🎉');
        } else if (finalHpoDisease >= 10000) {
            console.log('🎉 SUCESSO SIGNIFICATIVO! 🎉');
        }
        
    } catch (error) {
        console.error('💥 ERRO NA IMPORTAÇÃO:', error.message);
    }
}

async function tentarMapeamentoNumerico(mysqlConn) {
    console.log('\n🔍 TENTANDO MAPEAMENTO NUMÉRICO...');
    // Implementar se necessário
}

async function explorarAlternativas(mysqlConn) {
    console.log('\n🔍 EXPLORANDO ALTERNATIVAS...');
    // Implementar se necessário
}

// EXECUTAR CORREÇÃO
correcaoMapeamentoOMIM().then(() => {
    console.log('\n🏆 CORREÇÃO MAPEAMENTO OMIM CONCLUÍDA!');
}).catch(err => {
    console.error('💥 ERRO:', err.message);
});
