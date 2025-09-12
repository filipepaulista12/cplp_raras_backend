import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

console.log('🚀 INICIANDO IMPORTAÇÃO COMPLETA DE TODOS OS DADOS MYSQL!');

async function importCompleteData() {
    try {
        // 1. Verificar dados existentes
        console.log('\n📊 VERIFICANDO DADOS EXISTENTES:');
        const existingCountries = await prisma.cplpCountry.count();
        const existingDiseases = await prisma.rareDisease.count();
        console.log(`- Países: ${existingCountries}`);
        console.log(`- Doenças: ${existingDiseases}`);

        // 2. Importar do arquivo Dump20250903.sql principal
        console.log('\n🔄 IMPORTANDO DADOS DO DUMP PRINCIPAL...');
        const mainDumpPath = path.join(__dirname, '../database/Dump20250903.sql');
        
        if (fs.existsSync(mainDumpPath)) {
            const content = fs.readFileSync(mainDumpPath, 'utf8');
            
            // Encontrar e processar INSERTs de doenças
            const diseaseInserts = content.match(/INSERT INTO[^;]*orpha_diseases[^;]+;/gi);
            
            if (diseaseInserts) {
                console.log(`📋 Encontradas ${diseaseInserts.length} linhas de doenças para importar`);
                
                for (const insertStmt of diseaseInserts) {
                    try {
                        // Parse simples dos valores
                        const valuesMatch = insertStmt.match(/VALUES\s*(.+);?$/);
                        if (!valuesMatch) continue;
                        
                        let valuesSection = valuesMatch[1];
                        
                        // Extrair registros individuais
                        const records = [];
                        let currentRecord = '';
                        let parenLevel = 0;
                        let inQuotes = false;
                        
                        for (let i = 0; i < valuesSection.length; i++) {
                            const char = valuesSection[i];
                            const prevChar = valuesSection[i - 1];
                            
                            if (char === "'" && prevChar !== '\\') {
                                inQuotes = !inQuotes;
                            }
                            
                            if (!inQuotes) {
                                if (char === '(') parenLevel++;
                                else if (char === ')') parenLevel--;
                            }
                            
                            currentRecord += char;
                            
                            if (parenLevel === 0 && char === ')') {
                                if (currentRecord.trim().startsWith('(')) {
                                    records.push(currentRecord.trim());
                                }
                                currentRecord = '';
                            }
                        }
                        
                        console.log(`💾 Processando ${records.length} registros de doenças...`);
                        
                        for (const record of records) {
                            try {
                                // Extrair valores do registro
                                const valuesPart = record.slice(1, -1); // Remove ( )
                                const values = [];
                                let current = '';
                                let inQuotes = false;
                                let parenLevel = 0;
                                
                                for (let j = 0; j < valuesPart.length; j++) {
                                    const char = valuesPart[j];
                                    const prevChar = valuesPart[j - 1];
                                    
                                    if (char === "'" && prevChar !== '\\') {
                                        inQuotes = !inQuotes;
                                    }
                                    
                                    if (!inQuotes) {
                                        if (char === '(') parenLevel++;
                                        else if (char === ')') parenLevel--;
                                    }
                                    
                                    if (char === ',' && !inQuotes && parenLevel === 0) {
                                        values.push(current.trim());
                                        current = '';
                                    } else {
                                        current += char;
                                    }
                                }
                                
                                if (current.trim()) {
                                    values.push(current.trim());
                                }
                                
                                if (values.length >= 6) {
                                    // Limpar valores
                                    const cleanValue = (val) => {
                                        if (!val || val === 'NULL') return null;
                                        if (val.startsWith("'") && val.endsWith("'")) {
                                            return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                                        }
                                        return val;
                                    };
                                    
                                    const diseaseData = {
                                        orphacode: cleanValue(values[1]),
                                        name: cleanValue(values[3]),
                                        synonyms: cleanValue(values[5]) || '[]',
                                        definition: cleanValue(values[6]),
                                        is_active: true
                                    };
                                    
                                    // Verificar se já existe
                                    const existing = await prisma.rareDisease.findFirst({
                                        where: { orphacode: diseaseData.orphacode }
                                    });
                                    
                                    if (!existing) {
                                        await prisma.rareDisease.create({
                                            data: diseaseData
                                        });
                                        console.log(`✅ Doença importada: ${diseaseData.name}`);
                                    } else {
                                        console.log(`⏭️ Doença já existe: ${diseaseData.name}`);
                                    }
                                }
                            } catch (error) {
                                console.log(`❌ Erro ao processar registro: ${error.message}`);
                            }
                        }
                        
                    } catch (error) {
                        console.log(`❌ Erro ao processar INSERT: ${error.message}`);
                    }
                }
            }
        }

        // 3. Verificar dados após importação
        console.log('\n📊 DADOS APÓS IMPORTAÇÃO:');
        const finalCountries = await prisma.cplpCountry.count();
        const finalDiseases = await prisma.rareDisease.count();
        console.log(`- Países: ${finalCountries}`);
        console.log(`- Doenças: ${finalDiseases}`);
        
        console.log('\n🎉 IMPORTAÇÃO COMPLETA FINALIZADA!');
        
    } catch (error) {
        console.error('❌ Erro na importação:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importCompleteData().catch(console.error);
