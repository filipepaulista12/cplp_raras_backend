// POPULADOR COMPLETO DE CAMPOS PT - ORPHANET 
// ==========================================
// Preenche todos os campos PT usando arquivo JSON oficial
// CUIDADO: Não sobrescreve dados existentes, apenas adiciona onde está NULL

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function populateOrphanetPortuguese() {
    console.log('🇵🇹 POPULANDO CAMPOS PT - ORPHANET COMPLETO');
    console.log('==========================================\n');

    let stats = {
        processed: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        orphaUpdated: 0,
        hpoUpdated: 0,
        mappingUpdated: 0
    };

    try {
        // 1. Carregar arquivo JSON oficial
        console.log('📁 Carregando arquivo JSON oficial...');
        const jsonFile = path.join(__dirname, '../src/data/all-diseases-complete-official.json');
        
        if (!fs.existsSync(jsonFile)) {
            throw new Error('Arquivo JSON não encontrado: ' + jsonFile);
        }
        
        const diseasesData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        console.log(`✅ Carregado: ${diseasesData.length.toLocaleString()} doenças\n`);
        
        // 2. Processar doenças Orphanet
        console.log('🧬 PROCESSANDO DOENÇAS ORPHANET:');
        console.log('===============================');
        
        let batchSize = 100;
        let batchCount = 0;
        
        for (let i = 0; i < diseasesData.length; i += batchSize) {
            const batch = diseasesData.slice(i, i + batchSize);
            batchCount++;
            
            console.log(`📦 Lote ${batchCount}: processando ${batch.length} doenças...`);
            
            for (const diseaseJson of batch) {
                stats.processed++;
                
                try {
                    // Extrair código Orphanet
                    const orphaCode = diseaseJson.orpha_code?.replace('ORPHA:', '') || diseaseJson.id?.replace('orpha-', '');
                    
                    if (!orphaCode) {
                        stats.skipped++;
                        continue;
                    }
                    
                    // Buscar no banco
                    const existingDisease = await prisma.orphaDisease.findFirst({
                        where: {
                            OR: [
                                { orphaCode: orphaCode },
                                { orphaNumber: diseaseJson.orpha_code }
                            ]
                        }
                    });
                    
                    if (!existingDisease) {
                        stats.skipped++;
                        continue;
                    }
                    
                    // Preparar dados PT para atualização (apenas se NULL)
                    let updateData = {};
                    
                    // Nome PT - apenas se NULL no banco
                    if (!existingDisease.preferredNamePt && diseaseJson.name) {
                        updateData.preferredNamePt = diseaseJson.name;
                    } else if (!existingDisease.preferredNamePt && diseaseJson.namePt) {
                        updateData.preferredNamePt = diseaseJson.namePt;
                    }
                    
                    // Sinônimos PT - apenas se NULL
                    if (!existingDisease.synonymsPt && diseaseJson.synonyms && diseaseJson.synonyms.length > 0) {
                        updateData.synonymsPt = JSON.stringify(diseaseJson.synonyms);
                    }
                    
                    // Definições - apenas se NULL
                    if (!existingDisease.definitionEn && diseaseJson.descriptionEn) {
                        updateData.definitionEn = diseaseJson.descriptionEn;
                    } else if (!existingDisease.definitionEn && diseaseJson.description && diseaseJson.metadata?.language === 'en') {
                        updateData.definitionEn = diseaseJson.description;
                    }
                    
                    if (!existingDisease.definitionPt && diseaseJson.description) {
                        updateData.definitionPt = diseaseJson.description;
                    }
                    
                    // Open Data IDs - apenas se NULL
                    if (!existingDisease.uriRdf && diseaseJson.sourceUrl) {
                        updateData.uriRdf = diseaseJson.sourceUrl;
                    }
                    
                    if (!existingDisease.jsonldId) {
                        updateData.jsonldId = diseaseJson.id || `orpha-${orphaCode}`;
                    }
                    
                    if (!existingDisease.csvId) {
                        updateData.csvId = orphaCode;
                    }
                    
                    // Atualizar apenas se há dados novos
                    if (Object.keys(updateData).length > 0) {
                        await prisma.orphaDisease.update({
                            where: { id: existingDisease.id },
                            data: updateData
                        });
                        
                        stats.updated++;
                        stats.orphaUpdated++;
                        
                        if (stats.updated % 50 === 0) {
                            console.log(`   ✅ Atualizadas: ${stats.updated}`);
                        }
                    } else {
                        stats.skipped++;
                    }
                    
                } catch (error) {
                    stats.errors++;
                    console.log(`   ❌ Erro na doença ${diseaseJson.orpha_code}: ${error.message}`);
                }
            }
            
            // Pequena pausa entre lotes
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 3. Processar traduções de mapeamentos externos
        console.log('\n🔗 PROCESSANDO MAPEAMENTOS EXTERNOS:');
        console.log('===================================');
        
        const mappings = await prisma.orphaExternalMapping.findMany({
            where: { sourceNamePt: null },
            take: 100
        });
        
        for (const mapping of mappings) {
            try {
                let sourceNamePt = null;
                
                // Traduções básicas para sistemas conhecidos
                if (mapping.sourceSystem === 'ICD10') {
                    sourceNamePt = translateICD10Term(mapping.sourceName);
                } else if (mapping.sourceSystem === 'ICD11') {
                    sourceNamePt = translateICD11Term(mapping.sourceName);
                } else if (mapping.sourceSystem === 'OMIM') {
                    sourceNamePt = translateOMIMTerm(mapping.sourceName);
                }
                
                if (sourceNamePt) {
                    await prisma.orphaExternalMapping.update({
                        where: { id: mapping.id },
                        data: { sourceNamePt }
                    });
                    stats.mappingUpdated++;
                }
                
            } catch (error) {
                console.log(`   ❌ Erro no mapeamento ${mapping.id}: ${error.message}`);
            }
        }
        
        // 4. Processar classificações médicas
        console.log('\n🏥 PROCESSANDO CLASSIFICAÇÕES MÉDICAS:');
        console.log('====================================');
        
        const classifications = await prisma.orphaMedicalClassification.findMany({
            where: { medicalSpecialtyPt: null }
        });
        
        for (const classification of classifications) {
            try {
                const medicalSpecialtyPt = translateMedicalSpecialty(classification.medicalSpecialty);
                const classificationNamePt = translateClassificationName(classification.classificationName);
                
                let updateData = {};
                if (medicalSpecialtyPt) updateData.medicalSpecialtyPt = medicalSpecialtyPt;
                if (classificationNamePt) updateData.classificationNamePt = classificationNamePt;
                
                if (Object.keys(updateData).length > 0) {
                    await prisma.orphaMedicalClassification.update({
                        where: { id: classification.id },
                        data: updateData
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ Erro na classificação ${classification.id}: ${error.message}`);
            }
        }
        
        // 5. Relatório Final
        console.log('\n📊 RELATÓRIO FINAL:');
        console.log('==================');
        console.log(`📋 Total processado: ${stats.processed.toLocaleString()}`);
        console.log(`✅ Total atualizado: ${stats.updated.toLocaleString()}`);
        console.log(`⏭️ Total ignorado: ${stats.skipped.toLocaleString()}`);
        console.log(`❌ Total erros: ${stats.errors}`);
        console.log(`🧬 OrphaDisease atualizada: ${stats.orphaUpdated.toLocaleString()}`);
        console.log(`🔗 Mapeamentos atualizados: ${stats.mappingUpdated}`);
        
        // Verificação pós-atualização
        console.log('\n🔍 VERIFICAÇÃO PÓS-ATUALIZAÇÃO:');
        console.log('==============================');
        
        const totalAfter = await prisma.orphaDisease.count();
        const withPtAfter = await prisma.orphaDisease.count({
            where: { preferredNamePt: { not: null } }
        });
        const withDefinitionPtAfter = await prisma.orphaDisease.count({
            where: { definitionPt: { not: null } }
        });
        
        console.log(`📊 Total doenças: ${totalAfter.toLocaleString()}`);
        console.log(`✅ Com nome PT: ${withPtAfter.toLocaleString()} (${((withPtAfter/totalAfter)*100).toFixed(1)}%)`);
        console.log(`✅ Com definição PT: ${withDefinitionPtAfter.toLocaleString()} (${((withDefinitionPtAfter/totalAfter)*100).toFixed(1)}%)`);
        
        console.log('\n🎉 POPULAÇÂO DE CAMPOS PT CONCLUÍDA!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Funções auxiliares de tradução
function translateICD10Term(term) {
    const translations = {
        'Mental and behavioural disorders': 'Transtornos mentais e comportamentais',
        'Diseases of the nervous system': 'Doenças do sistema nervoso',
        'Diseases of the eye and adnexa': 'Doenças do olho e anexos',
        'Diseases of the circulatory system': 'Doenças do aparelho circulatório',
        'Diseases of the respiratory system': 'Doenças do aparelho respiratório',
        'Diseases of the digestive system': 'Doenças do aparelho digestivo',
        'Diseases of the skin and subcutaneous tissue': 'Doenças da pele e do tecido subcutâneo',
        'Diseases of the musculoskeletal system': 'Doenças do sistema osteomuscular',
        'Diseases of the genitourinary system': 'Doenças do aparelho geniturinário',
        'Congenital malformations': 'Malformações congênitas',
        'Neoplasms': 'Neoplasias'
    };
    
    return translations[term] || null;
}

function translateICD11Term(term) {
    // Similar ao ICD10, mas com termos específicos do ICD11
    return translateICD10Term(term);
}

function translateOMIMTerm(term) {
    // Geralmente são nomes de doenças, pode tentar traduzir termos básicos
    const basicTranslations = {
        'syndrome': 'síndrome',
        'disease': 'doença',
        'disorder': 'distúrbio',
        'deficiency': 'deficiência'
    };
    
    let translated = term;
    Object.entries(basicTranslations).forEach(([en, pt]) => {
        translated = translated.replace(new RegExp(en, 'gi'), pt);
    });
    
    return translated !== term ? translated : null;
}

function translateMedicalSpecialty(specialty) {
    const specialties = {
        'Neurology': 'Neurologia',
        'Cardiology': 'Cardiologia',
        'Ophthalmology': 'Oftalmologia',
        'Dermatology': 'Dermatologia',
        'Endocrinology': 'Endocrinologia',
        'Gastroenterology': 'Gastroenterologia',
        'Hematology': 'Hematologia',
        'Nephrology': 'Nefrologia',
        'Oncology': 'Oncologia',
        'Orthopedics': 'Ortopedia',
        'Pediatrics': 'Pediatria',
        'Psychiatry': 'Psiquiatria',
        'Pulmonology': 'Pneumologia',
        'Rheumatology': 'Reumatologia',
        'Urology': 'Urologia',
        'Genetics': 'Genética',
        'Immunology': 'Imunologia'
    };
    
    return specialties[specialty] || null;
}

function translateClassificationName(name) {
    const classifications = {
        'Rare disease': 'Doença rara',
        'Genetic disease': 'Doença genética',
        'Malformation syndrome': 'Síndrome malformativa',
        'Metabolic disorder': 'Distúrbio metabólico',
        'Neurological disorder': 'Distúrbio neurológico',
        'Autoimmune disease': 'Doença autoimune',
        'Cancer': 'Câncer',
        'Tumor': 'Tumor'
    };
    
    return classifications[name] || null;
}

// Executar
populateOrphanetPortuguese();
