// AUDITORIA DE DADOS - VERIFICAR INTEGRIDADE LINEARISATIONS
// =========================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditLinearisations() {
    console.log('🔍 AUDITORIA - INTEGRIDADE DOS DADOS LINEARISATIONS');
    console.log('===================================================\n');

    try {
        // 1. VERIFICAR TOTAL DE LINEARISATIONS
        console.log('📊 VERIFICAÇÃO BÁSICA:');
        console.log('======================');
        
        const totalLinearisations = await prisma.orphaLinearisation.count();
        console.log(`📈 Total de linearisations: ${totalLinearisations}`);
        
        // 2. VERIFICAR INTEGRIDADE DAS CHAVES ESTRANGEIRAS
        console.log('\n🔑 VERIFICAÇÃO DE CHAVES ESTRANGEIRAS:');
        console.log('=====================================');
        
        // Verificar se todos os orphaDiseaseId referenciam doenças reais
        const linearisations = await prisma.orphaLinearisation.findMany({
            select: {
                id: true,
                orphaDiseaseId: true,
                linearisationCode: true,
                preferredNameEn: true,
                classificationType: true
            }
        });
        
        console.log(`📋 Verificando ${linearisations.length} linearisations...`);
        
        let validReferences = 0;
        let invalidReferences = 0;
        let problematicRecords = [];
        
        for (const linearisation of linearisations) {
            try {
                // Tentar encontrar a doença referenciada
                const disease = await prisma.orphaDisease.findUnique({
                    where: { id: linearisation.orphaDiseaseId },
                    select: { id: true, orphaCode: true, preferredNameEn: true }
                });
                
                if (disease) {
                    validReferences++;
                } else {
                    invalidReferences++;
                    problematicRecords.push({
                        linearisationId: linearisation.id,
                        orphaDiseaseId: linearisation.orphaDiseaseId,
                        linearisationCode: linearisation.linearisationCode,
                        preferredNameEn: linearisation.preferredNameEn,
                        reason: 'Referência orphaDiseaseId inválida'
                    });
                }
            } catch (error) {
                invalidReferences++;
                problematicRecords.push({
                    linearisationId: linearisation.id,
                    orphaDiseaseId: linearisation.orphaDiseaseId,
                    reason: `Erro na verificação: ${error.message}`
                });
            }
        }
        
        console.log(`✅ Referências válidas: ${validReferences}`);
        console.log(`❌ Referências inválidas: ${invalidReferences}`);
        
        // 3. MOSTRAR REGISTROS PROBLEMÁTICOS
        if (problematicRecords.length > 0) {
            console.log('\n🚨 REGISTROS PROBLEMÁTICOS ENCONTRADOS:');
            console.log('======================================');
            
            problematicRecords.slice(0, 10).forEach((record, index) => {
                console.log(`\n${index + 1}. Linearisation: ${record.linearisationCode}`);
                console.log(`   Nome: ${record.preferredNameEn}`);
                console.log(`   orphaDiseaseId: ${record.orphaDiseaseId}`);
                console.log(`   Problema: ${record.reason}`);
            });
            
            if (problematicRecords.length > 10) {
                console.log(`\n... e mais ${problematicRecords.length - 10} registros problemáticos`);
            }
        }
        
        // 4. VERIFICAR ORIGEM DOS DADOS
        console.log('\n📁 VERIFICAÇÃO DA ORIGEM DOS DADOS:');
        console.log('===================================');
        
        // Verificar se são dados reais vs. sintéticos
        const sampleLinearisations = await prisma.orphaLinearisation.findMany({
            take: 10,
            include: {
                disease: {
                    select: { orphaCode: true, preferredNameEn: true }
                }
            }
        });
        
        console.log('📋 AMOSTRA DE LINEARISATIONS:');
        console.log('-----------------------------');
        
        sampleLinearisations.forEach((lin, index) => {
            const diseaseInfo = lin.disease ? `ORPHA:${lin.disease.orphaCode}` : 'DOENÇA NÃO ENCONTRADA';
            const isRealData = lin.disease && lin.disease.orphaCode;
            
            console.log(`${index + 1}. ${lin.linearisationCode}`);
            console.log(`   Nome: ${lin.preferredNameEn}`);
            console.log(`   Doença: ${diseaseInfo}`);
            console.log(`   Status: ${isRealData ? '✅ DADO REAL' : '❌ DADO SINTÉTICO/INVÁLIDO'}`);
            console.log('');
        });
        
        // 5. CONTAGEM POR TIPO
        console.log('📊 DISTRIBUIÇÃO POR TIPO:');
        console.log('=========================');
        
        const typeStats = await prisma.orphaLinearisation.groupBy({
            by: ['classificationType'],
            _count: {
                _all: true
            }
        });
        
        typeStats.forEach(stat => {
            console.log(`${stat.classificationType}: ${stat._count._all} registros`);
        });
        
        // 6. RECOMENDAÇÕES
        console.log('\n🎯 DIAGNÓSTICO E RECOMENDAÇÕES:');
        console.log('===============================');
        
        if (invalidReferences > 0) {
            console.log('🚨 PROBLEMA CRÍTICO DETECTADO:');
            console.log(`   ${invalidReferences} linearisations têm chaves estrangeiras inválidas`);
            console.log('   Isso pode causar erros em consultas e comprometer a integridade');
            console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
            console.log('   1. Limpar registros com chaves inválidas');
            console.log('   2. Recriar linearisations apenas com dados reais do Orphanet');
            console.log('   3. Usar apenas IDs de doenças existentes na tabela OrphaDisease');
        } else {
            console.log('✅ DADOS ÍNTEGROS: Todas as referências são válidas');
        }
        
        // 7. CONTAGEM REAL DE DADOS DISPONÍVEIS
        console.log('\n🔍 VERIFICAÇÃO DO POTENCIAL REAL:');
        console.log('=================================');
        
        const totalDiseases = await prisma.orphaDisease.count();
        console.log(`📊 Total de doenças disponíveis: ${totalDiseases.toLocaleString()}`);
        console.log(`📊 Linearisations criadas: ${totalLinearisations}`);
        
        const coverage = ((totalLinearisations / totalDiseases) * 100).toFixed(2);
        console.log(`📈 Cobertura atual: ${coverage}%`);
        
        if (totalLinearisations < totalDiseases * 0.5) {
            console.log('\n⚠️ COBERTURA BAIXA DETECTADA!');
            console.log(`   Apenas ${coverage}% das doenças têm classificações`);
            console.log('   Recomendado criar linearisations para todas as 11.340 doenças');
        }
        
    } catch (error) {
        console.error('❌ Erro na auditoria:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
auditLinearisations();
