// ANÁLISE COMPLETA DAS TABELAS ORPHANET RELACIONADAS
// ==================================================
// Verifica todas as tabelas relacionadas ao Orphanet e seus dados

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function analyzeOrphanetTables() {
    console.log('🔍 ANÁLISE COMPLETA - TABELAS ORPHANET RELACIONADAS');
    console.log('=================================================\n');

    try {
        // 1. Verificar todas as tabelas relacionadas
        console.log('📊 CONTAGEM DE REGISTROS POR TABELA:');
        console.log('===================================');
        
        const tables = [
            { name: 'OrphaDisease', table: 'orphaDisease' },
            { name: 'OrphaLinearisation', table: 'orphaLinearisation' },
            { name: 'OrphaExternalMapping', table: 'orphaExternalMapping' },
            { name: 'OrphaMedicalClassification', table: 'orphaMedicalClassification' },
            { name: 'OrphaPhenotype', table: 'orphaPhenotype' },
            { name: 'OrphaClinicalSign', table: 'orphaClinicalSign' },
            { name: 'OrphaGeneAssociation', table: 'orphaGeneAssociation' },
            { name: 'OrphaNaturalHistory', table: 'orphaNaturalHistory' },
            { name: 'OrphaEpidemiology', table: 'orphaEpidemiology' },
            { name: 'OrphaTextualInformation', table: 'orphaTextualInformation' },
            { name: 'HPOPhenotypeAssociation', table: 'hPOPhenotypeAssociation' }
        ];

        for (const { name, table } of tables) {
            try {
                const count = await prisma[table].count();
                console.log(`${count > 0 ? '✅' : '❌'} ${name}: ${count.toLocaleString()} registros`);
                
                // Se tem dados, mostrar alguns exemplos
                if (count > 0 && count < 20) {
                    const samples = await prisma[table].findMany({ take: 3 });
                    console.log(`   📋 Exemplos:`);
                    samples.forEach(item => {
                        // Mostrar campos principais de cada tipo
                        if (table === 'orphaExternalMapping') {
                            console.log(`      - ${item.sourceSystem}: ${item.sourceName}`);
                        } else if (table === 'orphaMedicalClassification') {
                            console.log(`      - ${item.medicalSpecialty}: ${item.classificationName}`);
                        } else if (table === 'orphaGeneAssociation') {
                            console.log(`      - Gene ${item.geneSymbol}: ${item.associationType}`);
                        } else if (table === 'orphaEpidemiology') {
                            console.log(`      - ${item.prevalenceClass || 'N/A'}: ${item.populationType || 'N/A'}`);
                        } else if (table === 'orphaTextualInformation') {
                            console.log(`      - ${item.textSection}: ${item.textEn?.substring(0, 50) || 'N/A'}...`);
                        }
                    });
                }
            } catch (error) {
                console.log(`❌ ${name}: ERRO - ${error.message}`);
            }
        }

        // 2. Verificar arquivos de origem disponíveis
        console.log('\n📁 ARQUIVOS DE ORIGEM ORPHANET:');
        console.log('==============================');
        
        const potentialFiles = [
            './src/data/all-diseases-complete-official.json',
            './database/orphanet-2025/',
            './database/orphanet-import/',
            './scripts/import-orphanet-official.js',
            './scripts/import-orphanet-complete.ts',
            './scripts/import-orphanet-full.js'
        ];

        for (const filePath of potentialFiles) {
            if (fs.existsSync(filePath)) {
                if (filePath.endsWith('.json')) {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    console.log(`✅ ${filePath}: ${data.length?.toLocaleString() || 'N/A'} registros`);
                    
                    // Analisar estrutura do JSON
                    if (data.length > 0) {
                        const sample = data[0];
                        console.log(`   📋 Estrutura disponível:`);
                        Object.keys(sample).forEach(key => {
                            if (key.includes('linear') || key.includes('classification') || key.includes('phenotype')) {
                                console.log(`      - ${key}: ${typeof sample[key]} ${Array.isArray(sample[key]) ? `(${sample[key].length} itens)` : ''}`);
                            }
                        });
                    }
                } else if (fs.statSync(filePath).isDirectory()) {
                    const files = fs.readdirSync(filePath);
                    console.log(`📁 ${filePath}: ${files.length} arquivos`);
                    files.forEach(file => console.log(`      - ${file}`));
                } else {
                    console.log(`✅ ${filePath}: Arquivo encontrado`);
                }
            } else {
                console.log(`❌ ${filePath}: Não encontrado`);
            }
        }

        // 3. Verificar scripts de importação disponíveis
        console.log('\n🔧 SCRIPTS DE IMPORTAÇÃO DISPONÍVEIS:');
        console.log('====================================');
        
        const importScripts = await prisma.$queryRaw`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE '%orpha%';
        `;
        
        console.log('📊 Tabelas Orphanet no banco:');
        importScripts.forEach(table => {
            console.log(`   - ${table.name}`);
        });

        // 4. Analisar dados do JSON principal para ver que informações existem
        console.log('\n📋 ANÁLISE DO JSON PRINCIPAL:');
        console.log('============================');
        
        const jsonFile = './src/data/all-diseases-complete-official.json';
        if (fs.existsSync(jsonFile)) {
            const diseases = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            const sample = diseases[0];
            
            console.log('🔍 Campos disponíveis no JSON que poderiam popular outras tabelas:');
            Object.entries(sample).forEach(([key, value]) => {
                console.log(`   - ${key}: ${typeof value} ${Array.isArray(value) ? `(${value.length} itens)` : ''}`);
                if (typeof value === 'string' && value.length > 100) {
                    console.log(`     └─ "${value.substring(0, 60)}..."`);
                }
            });
            
            // Procurar por dados estruturados dentro do JSON
            console.log('\n🔍 Procurando dados estruturados:');
            const keys = Object.keys(sample);
            const potentialStructured = keys.filter(key => 
                key.includes('classification') || 
                key.includes('phenotype') || 
                key.includes('gene') || 
                key.includes('symptom') ||
                key.includes('epidemiology') ||
                key.includes('mapping')
            );
            
            if (potentialStructured.length > 0) {
                console.log('✅ Campos estruturados encontrados:');
                potentialStructured.forEach(key => {
                    console.log(`   - ${key}: ${sample[key]}`);
                });
            } else {
                console.log('❌ Não encontrados dados estruturados para outras tabelas');
            }
        }

        // 5. Recomendações baseadas na análise
        console.log('\n🎯 DIAGNÓSTICO E RECOMENDAÇÕES:');
        console.log('==============================');
        
        const linearisationCount = await prisma.orphaLinearisation.count();
        const phenotypeCount = await prisma.orphaPhenotype.count();
        const externalMappingCount = await prisma.orphaExternalMapping.count();
        
        if (linearisationCount === 0) {
            console.log('❌ OrphaLinearisation vazia: Precisa dados de classificação hierárquica');
        }
        
        if (phenotypeCount === 0) {
            console.log('❌ OrphaPhenotype vazia: Precisa dados de fenótipos/sintomas');
        }
        
        if (externalMappingCount < 100) {
            console.log('⚠️ OrphaExternalMapping com poucos dados: Precisa mais mapeamentos ICD/OMIM');
        }

        console.log('\n💡 FONTES OFICIAIS RECOMENDADAS:');
        console.log('================================');
        console.log('1. 🏗️ Orphanet XML Linearisation: Classifications hierarchy');
        console.log('2. 🔬 Orphanet XML Phenotypes: HPO phenotype associations'); 
        console.log('3. 🔗 Orphanet XML Cross-references: External mappings');
        console.log('4. 🧬 Orphanet XML Genes: Gene associations');
        console.log('5. 📊 Orphanet XML Epidemiology: Prevalence data');

        console.log('\n🚀 PRECISA DE ARQUIVOS ADICIONAIS DO ORPHANET OFICIAL?');
        console.log('====================================================');
        console.log('📁 Arquivo atual: all-diseases-complete-official.json (básico)');
        console.log('🎯 Necessário: XMLs completos do Orphanet com dados relacionais');

    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeOrphanetTables();
