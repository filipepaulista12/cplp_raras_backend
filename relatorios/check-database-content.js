// SCRIPT PARA VERIFICAR DADOS NO BANCO
// ====================================
// Verifica que dados estão efetivamente armazenados no banco SQLite

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseContent() {
    console.log('🔍 VERIFICANDO CONTEÚDO DO BANCO DE DADOS');
    console.log('=========================================\n');

    try {
        // Verificar todas as tabelas e contagens
        const tables = [
            'OrphaDisease',
            'DiseaseClassification', 
            'DiseaseSynonym',
            'DiseaseContent',
            'DiseaseGene',
            'DiseasePrevalence',
            'HPOTerm',
            'HPODisease',
            'ClinVarVariant',
            'DrugBankDrug',
            'OMIMEntry',
            'OrphanetSpecialty'
        ];

        console.log('📊 CONTAGEM DE REGISTROS POR TABELA:');
        console.log('=====================================');

        let totalRecords = 0;
        const tableStats = {};

        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                tableStats[table] = count;
                totalRecords += count;
                
                const status = count > 0 ? '✅' : '❌';
                console.log(`${status} ${table.padEnd(25)} ${count.toLocaleString().padStart(10)} registros`);
                
                // Mostrar alguns registros de exemplo para tabelas com dados
                if (count > 0 && count < 20) {
                    const samples = await prisma[table].findMany({ take: 3 });
                    samples.forEach((record, index) => {
                        const preview = JSON.stringify(record).substring(0, 100);
                        console.log(`    ${index + 1}. ${preview}...`);
                    });
                }
            } catch (error) {
                console.log(`⚠️  ${table.padEnd(25)} ERRO: ${error.message.substring(0, 50)}...`);
            }
        }

        console.log('\n📈 RESUMO GERAL:');
        console.log('================');
        console.log(`Total de registros: ${totalRecords.toLocaleString()}`);
        console.log(`Tabelas com dados: ${Object.values(tableStats).filter(count => count > 0).length}`);
        console.log(`Tabelas vazias: ${Object.values(tableStats).filter(count => count === 0).length}`);

        // Verificar tabelas principais com detalhes
        console.log('\n🔬 ANÁLISE DETALHADA DAS PRINCIPAIS TABELAS:');
        console.log('=============================================');

        // OrphaDisease - Doenças do Orphanet
        const orphaDiseases = await prisma.OrphaDisease.findMany({ take: 3 });
        if (orphaDiseases.length > 0) {
            console.log('\n🧬 SAMPLE - OrphaDisease (Doenças Orphanet):');
            orphaDiseases.forEach((disease, i) => {
                console.log(`   ${i+1}. ORPHA:${disease.orphaCode} - ${disease.preferredNameEn}`);
                console.log(`      PT: ${disease.preferredNamePt || 'N/A'}`);
            });
        }

        // DrugBank - Medicamentos
        try {
            const drugbankDrugs = await prisma.DrugBankDrug.findMany({ take: 3 });
            if (drugbankDrugs.length > 0) {
                console.log('\n💊 SAMPLE - DrugBankDrug (Medicamentos):');
                drugbankDrugs.forEach((drug, i) => {
                    console.log(`   ${i+1}. ${drug.name} (${drug.drugbank_id})`);
                    console.log(`      Categoria: ${drug.category || 'N/A'}`);
                });
            }
        } catch (error) {
            console.log('💊 DrugBankDrug: Tabela não existe ou vazia');
        }

        // HPO - Fenótipos
        try {
            const hpoTerms = await prisma.HPOTerm.findMany({ take: 3 });
            if (hpoTerms.length > 0) {
                console.log('\n🔬 SAMPLE - HPOTerm (Fenótipos):');
                hpoTerms.forEach((term, i) => {
                    console.log(`   ${i+1}. ${term.hpo_id} - ${term.name}`);
                });
            }
        } catch (error) {
            console.log('🔬 HPOTerm: Tabela não existe ou vazia');
        }

        // Verificar arquivos JSON importantes
        console.log('\n📁 ARQUIVOS JSON COM DADOS:');
        console.log('===========================');
        
        const fs = require('fs');
        const path = require('path');
        
        const jsonFiles = [
            './database/drugbank-massive/real_massive_orphan_drugs.json',
            './database/drugbank-real/orphan_drugs.json',
            './src/data/all-diseases-complete-official.json',
            './database/drugbank-massive/drug_interactions.json'
        ];

        for (const filePath of jsonFiles) {
            try {
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    console.log(`✅ ${path.basename(filePath)} - ${sizeMB} MB`);
                    
                    // Verificar conteúdo do arquivo
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (Array.isArray(content)) {
                        console.log(`   📊 ${content.length} registros`);
                        if (content.length > 0 && content[0].name) {
                            console.log(`   📝 Exemplo: ${content[0].name}`);
                        }
                    }
                } else {
                    console.log(`❌ ${path.basename(filePath)} - Não encontrado`);
                }
            } catch (error) {
                console.log(`⚠️  ${path.basename(filePath)} - Erro: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar verificação
checkDatabaseContent().then(() => {
    console.log('\n✅ Verificação completa!');
    console.log('🌐 Para visualizar dados: http://localhost:5555 (Prisma Studio)');
}).catch(console.error);
