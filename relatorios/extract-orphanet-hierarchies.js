// EXTRATOR DE HIERARQUIAS ORPHANET - VERSÃO 2
// ==========================================
// Processa DisorderGroups e associações para criar linearisations

const fs = require('fs').promises;
const xml2js = require('xml2js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function extractOrphanetHierarchies() {
    console.log('🏗️ EXTRATOR DE HIERARQUIAS ORPHANET V2');
    console.log('====================================\n');

    try {
        // Processar nomenclature_en.xml para extrair grupos e hierarquias
        const xmlDir = './database/orphanet-real';
        const nomenclatureFile = `${xmlDir}/nomenclature_en.xml`;
        
        console.log('📋 Carregando nomenclature_en.xml...');
        const xmlContent = await fs.readFile(nomenclatureFile, 'utf8');
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(xmlContent);
        
        if (!result.JDBOR || !result.JDBOR.DisorderList || !result.JDBOR.DisorderList[0].Disorder) {
            throw new Error('Estrutura XML inválida');
        }
        
        const disorders = result.JDBOR.DisorderList[0].Disorder;
        console.log(`✅ ${disorders.length} disorders carregados`);
        
        // 1. MAPEAR TODOS OS GRUPOS
        console.log('\n🔍 MAPEANDO GRUPOS DE DOENÇAS:');
        console.log('=============================');
        
        const groupMap = new Map();
        const diseaseGroupRelations = [];
        
        for (const disorder of disorders) {
            const orphaCode = disorder.OrphaCode[0]._;
            const disorderName = disorder.Name[0]._;
            const disorderType = disorder.DisorderType ? disorder.DisorderType[0]._ : 'Disease';
            
            // Mapear grupos
            if (disorder.DisorderGroup && disorder.DisorderGroup.length > 0) {
                for (const group of disorder.DisorderGroup) {
                    const groupId = group.$.id;
                    const groupName = group.Name[0]._;
                    
                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, {
                            id: groupId,
                            name: groupName,
                            diseases: []
                        });
                    }
                    
                    groupMap.get(groupId).diseases.push({
                        orphaCode,
                        disorderName,
                        disorderType
                    });
                    
                    diseaseGroupRelations.push({
                        orphaCode,
                        groupId,
                        groupName,
                        disorderName,
                        disorderType
                    });
                }
            }
        }
        
        console.log(`📊 Total de grupos únicos: ${groupMap.size}`);
        console.log(`📊 Total de relações doença-grupo: ${diseaseGroupRelations.length}`);
        
        // Mostrar os 10 maiores grupos
        const sortedGroups = Array.from(groupMap.values()).sort((a, b) => b.diseases.length - a.diseases.length);
        
        console.log('\n🏆 TOP 10 GRUPOS (por número de doenças):');
        console.log('=========================================');
        sortedGroups.slice(0, 10).forEach((group, index) => {
            console.log(`${index + 1}. ${group.name} (${group.diseases.length} doenças)`);
        });
        
        // 2. MAPEAR ASSOCIAÇÕES ENTRE DOENÇAS
        console.log('\n🔗 MAPEANDO ASSOCIAÇÕES ENTRE DOENÇAS:');
        console.log('=====================================');
        
        const associations = [];
        let associationCount = 0;
        
        for (const disorder of disorders.slice(0, 1000)) { // Analisar primeiro 1000
            try {
                if (disorder.DisorderDisorderAssociationList && 
                    disorder.DisorderDisorderAssociationList[0] &&
                    disorder.DisorderDisorderAssociationList[0].DisorderDisorderAssociation) {
                    
                    const orphaCode = disorder.OrphaCode[0]._;
                    const disorderName = disorder.Name[0]._;
                    
                    for (const assoc of disorder.DisorderDisorderAssociationList[0].DisorderDisorderAssociation) {
                        try {
                            const targetOrpha = assoc.TargetDisorder && assoc.TargetDisorder[0] && assoc.TargetDisorder[0].OrphaCode ? 
                                              assoc.TargetDisorder[0].OrphaCode[0]._ : 'unknown';
                            const targetName = assoc.TargetDisorder && assoc.TargetDisorder[0] && assoc.TargetDisorder[0].Name ? 
                                             assoc.TargetDisorder[0].Name[0]._ : 'unknown';
                            const associationType = assoc.DisorderDisorderAssociationType && assoc.DisorderDisorderAssociationType[0] && assoc.DisorderDisorderAssociationType[0].Name ? 
                                                   assoc.DisorderDisorderAssociationType[0].Name[0]._ : 'unknown';
                            
                            associations.push({
                                sourceOrpha: orphaCode,
                                sourceName: disorderName,
                                targetOrpha,
                                targetName,
                                associationType
                            });
                            associationCount++;
                        } catch (assocError) {
                            // Continuar processamento mesmo com erros em associações individuais
                        }
                    }
                }
            } catch (disorderError) {
                // Continuar processamento mesmo com erros em disorders individuais
            }
        }
        
        console.log(`📊 Total de associações encontradas: ${associationCount}`);
        
        // Tipos de associação mais comuns
        const assocTypes = {};
        associations.forEach(assoc => {
            assocTypes[assoc.associationType] = (assocTypes[assoc.associationType] || 0) + 1;
        });
        
        console.log('\n📋 TIPOS DE ASSOCIAÇÃO MAIS COMUNS:');
        console.log('===================================');
        Object.entries(assocTypes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .forEach(([type, count]) => {
                console.log(`   ${type}: ${count} associações`);
            });
        
        // 3. CRIAR LINEARISATIONS BASEADAS NOS GRUPOS
        console.log('\n🏗️ CRIANDO LINEARISATIONS DOS GRUPOS:');
        console.log('===================================');
        
        let linearisationsCreated = 0;
        
        for (const [groupId, group] of groupMap) {
            try {
                // Criar linearisation para o grupo
                const groupLinearisation = await prisma.orphaLinearisation.create({
                    data: {
                        orphaDiseaseId: `group-${groupId}`,
                        linearisationId: `orpha-group-${groupId}`,
                        linearisationCode: `GROUP_${groupId}`,
                        preferredNameEn: group.name,
                        preferredNamePt: group.name, // Por enquanto igual ao inglês
                        classificationLevel: 1,
                        classificationType: 'Group',
                        uriRdf: `https://www.orpha.net/ORDO/Orphanet_${groupId}`,
                        jsonldId: `orpha:group:${groupId}`,
                        csvId: `GROUP_${groupId}`
                    }
                });
                
                linearisationsCreated++;
                
                // Criar linearisations para as doenças do grupo
                for (const disease of group.diseases.slice(0, 10)) { // Limitar para teste
                    try {
                        await prisma.orphaLinearisation.create({
                            data: {
                                orphaDiseaseId: `orphanet-${disease.orphaCode}`,
                                linearisationId: `orpha-disease-${disease.orphaCode}`,
                                linearisationCode: `DISEASE_${disease.orphaCode}`,
                                preferredNameEn: disease.disorderName,
                                preferredNamePt: disease.disorderName, // Por enquanto igual ao inglês
                                parentLinearisationId: `orpha-group-${groupId}`,
                                classificationLevel: 2,
                                classificationType: disease.disorderType || 'Disease',
                                uriRdf: `https://www.orpha.net/ORDO/Orphanet_${disease.orphaCode}`,
                                jsonldId: `orpha:disease:${disease.orphaCode}`,
                                csvId: `DISEASE_${disease.orphaCode}`
                            }
                        });
                        
                        linearisationsCreated++;
                        
                    } catch (error) {
                        // Continuar mesmo com erros (podem ser duplicatas)
                    }
                }
                
            } catch (error) {
                console.log(`❌ Erro criando grupo ${groupId}: ${error.message}`);
            }
            
            // Processar apenas os 20 primeiros grupos para teste
            if (linearisationsCreated > 100) break;
        }
        
        console.log(`✅ ${linearisationsCreated} linearisations criadas com sucesso!`);
        
        // 4. VERIFICAR RESULTADO
        console.log('\n📊 VERIFICANDO RESULTADO:');
        console.log('========================');
        
        const totalLinearisations = await prisma.orphaLinearisation.count();
        const groupHeaders = await prisma.orphaLinearisation.count({
            where: { classificationLevel: 1 }
        });
        const diseases = await prisma.orphaLinearisation.count({
            where: { classificationLevel: 2 }
        });
        
        console.log(`📊 Total de linearisations: ${totalLinearisations}`);
        console.log(`📂 Cabeçalhos de grupos: ${groupHeaders}`);
        console.log(`🧬 Doenças individuais: ${diseases}`);
        
        // Mostrar algumas linearisations criadas
        const sampleLinearisations = await prisma.orphaLinearisation.findMany({
            take: 5,
            include: {
                orphaDisease: {
                    select: { nameEn: true, namePt: true }
                }
            }
        });
        
        console.log('\n📋 EXEMPLOS DE LINEARISATIONS CRIADAS:');
        console.log('=====================================');
        sampleLinearisations.forEach((lin, index) => {
            console.log(`${index + 1}. ${lin.preferredNameEn}`);
            console.log(`   Código: ${lin.linearisationCode}`);
            console.log(`   Tipo: ${lin.classificationType}`);
            console.log(`   Nível: ${lin.classificationLevel}`);
            console.log(`   Parent: ${lin.parentLinearisationId || 'Raiz'}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
extractOrphanetHierarchies();
