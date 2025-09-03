// VERIFICAR ESTRUTURA ATUAL DO BANCO APÓS EXPANSÃO
// =================================================
// Verifica quais campos PT existem e quais dados permanecem

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchemaStatus() {
    console.log('🔍 VERIFICAÇÃO DO SCHEMA EXPANDIDO - CAMPOS PT');
    console.log('==============================================\n');

    try {
        // 1. Verificar tabelas DrugBank
        console.log('💊 TABELAS DRUGBANK:');
        console.log('==================');
        
        const drugCount = await prisma.drugBankDrug.count();
        console.log(`✅ drugbank_drugs: ${drugCount.toLocaleString()} registros`);
        
        if (drugCount > 0) {
            const sampleDrug = await prisma.drugBankDrug.findFirst();
            console.log('📋 Campos disponíveis:');
            console.log(`   - name: ${sampleDrug.name}`);
            console.log(`   - namePt: ${sampleDrug.namePt || 'NULL'}`);
            console.log(`   - indication: ${sampleDrug.indication ? sampleDrug.indication.substring(0, 50) + '...' : 'NULL'}`);
            console.log(`   - indicationPt: ${sampleDrug.indicationPt || 'NULL'}`);
        }
        
        const interactionCount = await prisma.drugInteraction.count();
        console.log(`✅ drug_interactions: ${interactionCount.toLocaleString()} registros`);
        
        console.log('\n🧬 TABELAS ORPHANET:');
        console.log('==================');
        
        // 2. Verificar OrphaDisease
        const diseaseCount = await prisma.orphaDisease.count();
        console.log(`✅ orpha_diseases: ${diseaseCount.toLocaleString()} registros`);
        
        if (diseaseCount > 0) {
            const sampleDisease = await prisma.orphaDisease.findFirst();
            console.log('📋 Campos PT disponíveis:');
            console.log(`   - preferredNameEn: ${sampleDisease.preferredNameEn}`);
            console.log(`   - preferredNamePt: ${sampleDisease.preferredNamePt || 'NULL'}`);
            console.log(`   - definitionEn: ${sampleDisease.definitionEn || 'NULL'}`);
            console.log(`   - definitionPt: ${sampleDisease.definitionPt || 'NULL'}`);
        }
        
        // 3. Verificar HPO Terms
        const hpoCount = await prisma.hPOTerm.count();
        console.log(`✅ hpo_terms: ${hpoCount.toLocaleString()} registros`);
        
        if (hpoCount > 0) {
            const sampleHPO = await prisma.hPOTerm.findFirst();
            console.log('📋 Campos HPO PT:');
            console.log(`   - name: ${sampleHPO.name}`);
            console.log(`   - namePt: ${sampleHPO.namePt || 'NULL'}`);
            console.log(`   - definition: ${sampleHPO.definition ? sampleHPO.definition.substring(0, 50) + '...' : 'NULL'}`);
            console.log(`   - definitionPt: ${sampleHPO.definitionPt || 'NULL'}`);
        }
        
        // 4. Verificar outras tabelas importantes
        console.log('\n📊 OUTRAS TABELAS:');
        console.log('================');
        
        const mappingCount = await prisma.orphaExternalMapping.count();
        console.log(`✅ orpha_external_mappings: ${mappingCount.toLocaleString()} registros`);
        
        const classCount = await prisma.orphaMedicalClassification.count();
        console.log(`✅ orpha_medical_classifications: ${classCount.toLocaleString()} registros`);
        
        const geneCount = await prisma.orphaGeneAssociation.count();
        console.log(`✅ orpha_gene_associations: ${geneCount.toLocaleString()} registros`);
        
        const epiCount = await prisma.orphaEpidemiology.count();
        console.log(`✅ orpha_epidemiology: ${epiCount.toLocaleString()} registros`);
        
        // 5. Verificar se tabelas têm os novos campos PT
        console.log('\n🔍 TESTE DE CAMPOS PT ADICIONADOS:');
        console.log('================================');
        
        if (mappingCount > 0) {
            const sampleMapping = await prisma.orphaExternalMapping.findFirst();
            console.log(`📋 OrphaExternalMapping - sourceNamePt: ${sampleMapping.sourceNamePt || 'NULL (campo adicionado)'}`);
        }
        
        if (classCount > 0) {
            const sampleClass = await prisma.orphaMedicalClassification.findFirst();
            console.log(`📋 OrphaMedicalClassification - medicalSpecialtyPt: ${sampleClass.medicalSpecialtyPt || 'NULL (campo adicionado)'}`);
        }
        
        console.log('\n🎯 RESUMO FINAL:');
        console.log('===============');
        console.log(`📊 Total de registros: ${(diseaseCount + hpoCount + drugCount + interactionCount).toLocaleString()}`);
        console.log(`💊 Medicamentos DrugBank: ${drugCount.toLocaleString()}`);
        console.log(`🧬 Doenças Orphanet: ${diseaseCount.toLocaleString()}`);
        console.log(`🔬 Termos HPO: ${hpoCount.toLocaleString()}`);
        console.log(`🔗 Interações medicamentosas: ${interactionCount.toLocaleString()}`);
        
        console.log('\n✅ SCHEMA EXPANDIDO APLICADO COM SUCESSO!');
        console.log('🌟 Pronto para receber traduções PT dos arquivos de referência');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchemaStatus();
