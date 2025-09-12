import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// 🔥 FUNÇÃO PARA LIMPAR SQL STRING E ESCAPAR CARACTERES
function cleanSQLString(str) {
    if (!str || str === 'NULL') return null;
    
    // Remove aspas simples no início e fim
    str = str.replace(/^'|'$/g, '');
    
    // Descape caracteres especiais
    str = str.replace(/\\'/g, "'")
           .replace(/\\"/g, '"')
           .replace(/\\\\/g, '\\');
    
    return str.trim();
}

// 🔥 FUNÇÃO PARA PARSEAR ARRAY JSON
function parseJSONArray(str) {
    try {
        if (!str || str === 'NULL' || str === '[]') return [];
        
        str = cleanSQLString(str);
        if (!str) return [];
        
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Erro ao parsear JSON:', str, error.message);
        return [];
    }
}

// 🔥 FUNÇÃO PARA PARSEAR INSERT STATEMENTS
function parseInsertStatement(line) {
    // Encontra os valores entre parênteses
    const valuesMatch = line.match(/\((.*)\)/);
    if (!valuesMatch) return null;
    
    const valuesStr = valuesMatch[1];
    const values = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;
    let parenLevel = 0;
    
    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        
        if (escapeNext) {
            current += char;
            escapeNext = false;
            continue;
        }
        
        if (char === '\\') {
            escapeNext = true;
            current += char;
            continue;
        }
        
        if (char === "'" && !escapeNext) {
            inQuotes = !inQuotes;
            current += char;
            continue;
        }
        
        if (!inQuotes) {
            if (char === '(') parenLevel++;
            else if (char === ')') parenLevel--;
            
            if (char === ',' && parenLevel === 0) {
                values.push(current.trim());
                current = '';
                continue;
            }
        }
        
        current += char;
    }
    
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

// 🔥 FUNÇÃO PRINCIPAL DE IMPORTAÇÃO
async function importRealData() {
    console.log('🔥 INICIANDO IMPORTAÇÃO DOS DADOS REAIS DO MYSQL...');
    
    try {
        // 1. IMPORTAR PAÍSES
        console.log('\n📍 IMPORTANDO PAÍSES...');
        const countriesFile = path.join(__dirname, '..', 'database', 'data20250903', 'cplp_raras_cplp_countries.sql');
        if (fs.existsSync(countriesFile)) {
            const countriesContent = fs.readFileSync(countriesFile, 'utf-8');
            const countryLines = countriesContent.split('\n').filter(line => line.includes('INSERT INTO'));
            
            for (const line of countryLines) {
                const values = parseInsertStatement(line);
                if (!values || values.length < 10) continue;
                
                try {
                    await prisma.cplpCountry.create({
                        data: {
                            id: cleanSQLString(values[0]),
                            name: cleanSQLString(values[1]),
                            namePortuguese: cleanSQLString(values[2]),
                            nameEnglish: cleanSQLString(values[3]),
                            code: cleanSQLString(values[4]),
                            flag: cleanSQLString(values[5]),
                            population: values[6] === 'NULL' ? null : parseInt(cleanSQLString(values[6])),
                            languages: parseJSONArray(values[7]),
                            capital: cleanSQLString(values[8]),
                            isActive: values[9] === '1',
                            createdAt: new Date(cleanSQLString(values[10])),
                            updatedAt: new Date(cleanSQLString(values[11]))
                        }
                    });
                    console.log(`✅ País importado: ${cleanSQLString(values[1])}`);
                } catch (error) {
                    console.error(`❌ Erro ao importar país:`, error.message);
                }
            }
        }
        
        // 2. IMPORTAR DOENÇAS ÓRFÃS
        console.log('\n🦠 IMPORTANDO DOENÇAS ÓRFÃS...');
        const diseasesFile = path.join(__dirname, '..', 'database', 'data20250903', 'cplp_raras_orpha_diseases.sql');
        if (fs.existsSync(diseasesFile)) {
            const diseasesContent = fs.readFileSync(diseasesFile, 'utf-8');
            const diseaseLines = diseasesContent.split('\n').filter(line => line.includes('INSERT INTO'));
            
            for (const line of diseaseLines) {
                const values = parseInsertStatement(line);
                if (!values || values.length < 20) continue;
                
                try {
                    const synonyms = parseJSONArray(values[5]);
                    
                    await prisma.rareDisease.create({
                        data: {
                            id: cleanSQLString(values[0]),
                            orphaNumber: cleanSQLString(values[1]),
                            orphaCode: cleanSQLString(values[2]),
                            name: cleanSQLString(values[3]),
                            namePortuguese: cleanSQLString(values[4]),
                            synonyms: synonyms,
                            description: cleanSQLString(values[6]),
                            descriptionPortuguese: cleanSQLString(values[7]),
                            symptoms: cleanSQLString(values[8]),
                            symptomsPortuguese: cleanSQLString(values[9]),
                            category: cleanSQLString(values[10]),
                            isActive: values[11] === '1',
                            createdAt: new Date(cleanSQLString(values[12])),
                            updatedAt: new Date(cleanSQLString(values[13])),
                            orphaUrl: cleanSQLString(values[14]),
                            prevalence: values[15] === 'NULL' ? null : parseInt(cleanSQLString(values[15])),
                            severity: values[16] === 'NULL' ? null : parseInt(cleanSQLString(values[16])),
                            geneticInheritance: cleanSQLString(values[17]),
                            ageOfOnset: cleanSQLString(values[18]),
                            typeOfInheritance: cleanSQLString(values[19])
                        }
                    });
                    console.log(`✅ Doença importada: ${cleanSQLString(values[3])}`);
                } catch (error) {
                    console.error(`❌ Erro ao importar doença:`, error.message);
                }
            }
        }
        
        // 3. IMPORTAR TERMOS HPO
        console.log('\n🧬 IMPORTANDO TERMOS HPO...');
        const hpoFile = path.join(__dirname, '..', 'database', 'data20250903', 'cplp_raras_hpo_terms.sql');
        if (fs.existsSync(hpoFile)) {
            const hpoContent = fs.readFileSync(hpoFile, 'utf-8');
            const hpoLines = hpoContent.split('\n').filter(line => line.includes('INSERT INTO'));
            
            for (const line of hpoLines) {
                const values = parseInsertStatement(line);
                if (!values || values.length < 10) continue;
                
                try {
                    await prisma.hpoTerm.create({
                        data: {
                            id: cleanSQLString(values[0]),
                            hpoId: cleanSQLString(values[1]),
                            name: cleanSQLString(values[2]),
                            namePortuguese: cleanSQLString(values[3]),
                            definition: cleanSQLString(values[4]),
                            definitionPortuguese: cleanSQLString(values[5]),
                            synonyms: parseJSONArray(values[6]),
                            isActive: values[7] === '1',
                            createdAt: new Date(cleanSQLString(values[8])),
                            updatedAt: new Date(cleanSQLString(values[9]))
                        }
                    });
                    console.log(`✅ Termo HPO importado: ${cleanSQLString(values[2])}`);
                } catch (error) {
                    console.error(`❌ Erro ao importar termo HPO:`, error.message);
                }
            }
        }
        
        // 4. IMPORTAR MEDICAMENTOS DRUGBANK
        console.log('\n💊 IMPORTANDO MEDICAMENTOS DRUGBANK...');
        const drugsFile = path.join(__dirname, '..', 'database', 'data20250903', 'cplp_raras_drugbank_drugs.sql');
        if (fs.existsSync(drugsFile)) {
            const drugsContent = fs.readFileSync(drugsFile, 'utf-8');
            const drugLines = drugsContent.split('\n').filter(line => line.includes('INSERT INTO'));
            
            for (const line of drugLines) {
                const values = parseInsertStatement(line);
                if (!values || values.length < 15) continue;
                
                try {
                    await prisma.drugbankDrug.create({
                        data: {
                            id: cleanSQLString(values[0]),
                            drugbankId: cleanSQLString(values[1]),
                            name: cleanSQLString(values[2]),
                            namePortuguese: cleanSQLString(values[3]),
                            description: cleanSQLString(values[4]),
                            descriptionPortuguese: cleanSQLString(values[5]),
                            indication: cleanSQLString(values[6]),
                            indicationPortuguese: cleanSQLString(values[7]),
                            pharmacology: cleanSQLString(values[8]),
                            pharmacologyPortuguese: cleanSQLString(values[9]),
                            synonyms: parseJSONArray(values[10]),
                            categories: parseJSONArray(values[11]),
                            isActive: values[12] === '1',
                            createdAt: new Date(cleanSQLString(values[13])),
                            updatedAt: new Date(cleanSQLString(values[14]))
                        }
                    });
                    console.log(`✅ Medicamento importado: ${cleanSQLString(values[2])}`);
                } catch (error) {
                    console.error(`❌ Erro ao importar medicamento:`, error.message);
                }
            }
        }
        
        // 5. VERIFICAR DADOS IMPORTADOS
        console.log('\n📊 VERIFICANDO DADOS IMPORTADOS...');
        const countryCount = await prisma.cplpCountry.count();
        const diseaseCount = await prisma.rareDisease.count();
        const hpoCount = await prisma.hpoTerm.count();
        const drugCount = await prisma.drugbankDrug.count();
        
        console.log(`✅ IMPORTAÇÃO CONCLUÍDA:
        - Países: ${countryCount}
        - Doenças: ${diseaseCount}  
        - Termos HPO: ${hpoCount}
        - Medicamentos: ${drugCount}`);
        
    } catch (error) {
        console.error('❌ ERRO NA IMPORTAÇÃO:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar importação
if (import.meta.url === `file://${process.argv[1]}`) {
    importRealData().catch(console.error);
}

export default importRealData;
