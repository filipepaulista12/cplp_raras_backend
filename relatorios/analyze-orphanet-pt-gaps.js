// ANÁLISE COMPLETA DO BANCO ORPHANET - CAMPOS PT VAZIOS
// =====================================================
// Identifica exatamente quais campos PT estão null e precisa popular

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function analyzeOrphanetData() {
    console.log('🔍 ANÁLISE COMPLETA - CAMPOS PT VAZIOS NO ORPHANET');
    console.log('================================================\n');

    try {
        // 1. Análise da tabela principal OrphaDisease
        console.log('🧬 TABELA ORPHA_DISEASES:');
        console.log('=======================');
        
        const totalDiseases = await prisma.orphaDisease.count();
        console.log(`📊 Total de doenças: ${totalDiseases.toLocaleString()}`);
        
        // Contar campos PT vazios
        const nullPreferredNamePt = await prisma.orphaDisease.count({
            where: { preferredNamePt: null }
        });
        
        const nullSynonymsPt = await prisma.orphaDisease.count({
            where: { synonymsPt: null }
        });
        
        const nullDefinitionEn = await prisma.orphaDisease.count({
            where: { definitionEn: null }
        });
        
        const nullDefinitionPt = await prisma.orphaDisease.count({
            where: { definitionPt: null }
        });
        
        console.log(`❌ preferredNamePt NULL: ${nullPreferredNamePt.toLocaleString()} (${((nullPreferredNamePt/totalDiseases)*100).toFixed(1)}%)`);
        console.log(`❌ synonymsPt NULL: ${nullSynonymsPt.toLocaleString()} (${((nullSynonymsPt/totalDiseases)*100).toFixed(1)}%)`);
        console.log(`❌ definitionEn NULL: ${nullDefinitionEn.toLocaleString()} (${((nullDefinitionEn/totalDiseases)*100).toFixed(1)}%)`);
        console.log(`❌ definitionPt NULL: ${nullDefinitionPt.toLocaleString()} (${((nullDefinitionPt/totalDiseases)*100).toFixed(1)}%)`);
        
        // Exemplos com dados PT
        const withPtData = await prisma.orphaDisease.findMany({
            where: { 
                preferredNamePt: { not: null }
            },
            take: 5
        });
        
        console.log('\n✅ EXEMPLOS COM DADOS PT:');
        withPtData.forEach(d => {
            console.log(`   - ${d.orphaNumber}: ${d.preferredNameEn} → ${d.preferredNamePt}`);
        });
        
        // Exemplos sem dados PT
        const withoutPtData = await prisma.orphaDisease.findMany({
            where: { 
                preferredNamePt: null
            },
            take: 5
        });
        
        console.log('\n❌ EXEMPLOS SEM DADOS PT:');
        withoutPtData.forEach(d => {
            console.log(`   - ${d.orphaNumber}: ${d.preferredNameEn} → NULL`);
        });
        
        // 2. Análise HPO Terms
        console.log('\n🔬 TABELA HPO_TERMS:');
        console.log('==================');
        
        const totalHpo = await prisma.hPOTerm.count();
        console.log(`📊 Total de termos HPO: ${totalHpo.toLocaleString()}`);
        
        const nullHpoNamePt = await prisma.hPOTerm.count({
            where: { namePt: null }
        });
        
        const nullHpoDefinitionPt = await prisma.hPOTerm.count({
            where: { definitionPt: null }
        });
        
        console.log(`❌ namePt NULL: ${nullHpoNamePt.toLocaleString()} (${((nullHpoNamePt/totalHpo)*100).toFixed(1)}%)`);
        console.log(`❌ definitionPt NULL: ${nullHpoDefinitionPt.toLocaleString()} (${((nullHpoDefinitionPt/totalHpo)*100).toFixed(1)}%)`);
        
        // 3. Análise tabelas relacionadas
        console.log('\n📋 TABELAS RELACIONADAS:');
        console.log('======================');
        
        const mappingsCount = await prisma.orphaExternalMapping.count();
        const nullSourceNamePt = await prisma.orphaExternalMapping.count({
            where: { sourceNamePt: null }
        });
        console.log(`🔗 ExternalMappings: ${mappingsCount} total, ${nullSourceNamePt} sem sourceNamePt`);
        
        const classificationsCount = await prisma.orphaMedicalClassification.count();
        const nullMedSpecialtyPt = await prisma.orphaMedicalClassification.count({
            where: { medicalSpecialtyPt: null }
        });
        console.log(`🏥 MedicalClassifications: ${classificationsCount} total, ${nullMedSpecialtyPt} sem medicalSpecialtyPt`);
        
        const genesCount = await prisma.orphaGeneAssociation.count();
        const nullGeneNamePt = await prisma.orphaGeneAssociation.count({
            where: { geneNamePt: null }
        });
        console.log(`🧬 GeneAssociations: ${genesCount} total, ${nullGeneNamePt} sem geneNamePt`);
        
        const naturalHistoryCount = await prisma.orphaNaturalHistory.count();
        const nullPrognosisPt = await prisma.orphaNaturalHistory.count({
            where: { prognosisPt: null }
        });
        console.log(`📈 NaturalHistory: ${naturalHistoryCount} total, ${nullPrognosisPt} sem prognosisPt`);
        
        const epidemiologyCount = await prisma.orphaEpidemiology.count();
        const nullPopDescPt = await prisma.orphaEpidemiology.count({
            where: { populationDescriptionPt: null }
        });
        console.log(`📊 Epidemiology: ${epidemiologyCount} total, ${nullPopDescPt} sem populationDescriptionPt`);
        
        const textualInfoCount = await prisma.orphaTextualInformation.count();
        const nullTextPt = await prisma.orphaTextualInformation.count({
            where: { textPt: null }
        });
        console.log(`📝 TextualInformation: ${textualInfoCount} total, ${nullTextPt} sem textPt`);
        
        // 4. Verificar arquivo JSON de referência
        console.log('\n📁 ARQUIVO JSON DE REFERÊNCIA:');
        console.log('=============================');
        
        const jsonFile = './src/data/all-diseases-complete-official.json';
        if (fs.existsSync(jsonFile)) {
            const jsonData = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            console.log(`✅ Arquivo encontrado: ${jsonData.length.toLocaleString()} doenças`);
            
            // Amostra do JSON
            const sample = jsonData[0];
            console.log('📋 Estrutura do JSON:');
            console.log(`   - orpha_code: ${sample.orpha_code}`);
            console.log(`   - name (PT): ${sample.name}`);
            console.log(`   - nameEn: ${sample.nameEn}`);
            console.log(`   - synonyms: ${sample.synonyms?.length || 0} itens`);
            console.log(`   - description: ${sample.description?.substring(0, 50)}...`);
            
            // Verificar correspondência com banco
            const orphaCodeSample = sample.orpha_code.replace('ORPHA:', '');
            const dbMatch = await prisma.orphaDisease.findFirst({
                where: { orphaCode: orphaCodeSample }
            });
            
            if (dbMatch) {
                console.log(`✅ Correspondência encontrada no banco:`);
                console.log(`   - DB: ${dbMatch.preferredNameEn} → ${dbMatch.preferredNamePt}`);
                console.log(`   - JSON: ${sample.nameEn} → ${sample.name}`);
            } else {
                console.log(`❌ Não encontrou correspondência para ${sample.orpha_code}`);
            }
        } else {
            console.log('❌ Arquivo JSON não encontrado');
        }
        
        console.log('\n🎯 RESUMO DA ANÁLISE:');
        console.log('==================');
        console.log(`📊 Total de registros analisados: ${(totalDiseases + totalHpo).toLocaleString()}`);
        console.log(`✅ Temos arquivo JSON com ${jsonData.length.toLocaleString()} doenças PT`);
        console.log(`🔧 Precisa popular campos PT em OrphaDisease, HPO e tabelas relacionadas`);
        console.log(`📁 Arquivo JSON de referência disponível e compatível`);
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeOrphanetData();
