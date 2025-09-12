console.log('💥 EXTRAÇÃO MASSIVA: Backup → Prisma (TODOS OS DADOS)');
console.log('═'.repeat(60));

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();
const backupPath = './database/backup_cplp_raras_20250908.sql';

async function extrairTudoDoBakup() {
    try {
        console.log('\n🎯 OBJETIVO: EXTRAIR E INSERIR TODOS OS DADOS!');
        console.log('═'.repeat(50));
        
        if (!fs.existsSync(backupPath)) {
            console.error(`❌ Backup não encontrado: ${backupPath}`);
            return;
        }

        const stats = fs.statSync(backupPath);
        console.log(`📂 Backup: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

        await prisma.$connect();
        console.log('✅ Prisma conectado');

        // Limpar base atual
        console.log('\n🗑️  Limpando dados antigos...');
        await prisma.cplpCountry.deleteMany();
        await prisma.hpoTerm.deleteMany();
        await prisma.rareDisease.deleteMany();
        console.log('✅ Base limpa');

        // Contadores
        let totalLinhas = 0;
        let paisesInseridos = 0;
        let hpoInseridos = 0;
        let doencasInseridas = 0;

        console.log('\n📖 PROCESSANDO LINHA POR LINHA...');
        console.log('─'.repeat(40));

        const fileStream = fs.createReadStream(backupPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let currentMultiLineInsert = '';
        let isInMultiLineInsert = false;

        rl.on('line', async (line) => {
            totalLinhas++;
            
            if (totalLinhas % 5000 === 0) {
                console.log(`📈 Processadas: ${totalLinhas.toLocaleString()} linhas`);
            }

            const trimmedLine = line.trim();
            
            // Handle multi-line INSERTs
            if (trimmedLine.toUpperCase().startsWith('INSERT INTO')) {
                if (trimmedLine.endsWith(';')) {
                    // Single line INSERT
                    await processarInsert(trimmedLine);
                } else {
                    // Start of multi-line INSERT
                    isInMultiLineInsert = true;
                    currentMultiLineInsert = trimmedLine;
                }
            } else if (isInMultiLineInsert) {
                currentMultiLineInsert += ' ' + trimmedLine;
                
                if (trimmedLine.endsWith(';')) {
                    // End of multi-line INSERT
                    isInMultiLineInsert = false;
                    await processarInsert(currentMultiLineInsert);
                    currentMultiLineInsert = '';
                }
            }
        });

        rl.on('close', async () => {
            console.log('\n📊 PROCESSAMENTO CONCLUÍDO!');
            console.log('─'.repeat(35));
            console.log(`📄 Total de linhas: ${totalLinhas.toLocaleString()}`);
            
            // Verificar o que foi inserido
            const finalPaises = await prisma.cplpCountry.count();
            const finalHPO = await prisma.hpoTerm.count();
            const finalDoencas = await prisma.rareDisease.count();
            
            console.log('\n🎉 RESULTADO FINAL:');
            console.log('─'.repeat(25));
            console.log(`🌍 Países CPLP: ${finalPaises}`);
            console.log(`🧬 HPO Terms: ${finalHPO}`);
            console.log(`🔬 Doenças Raras: ${finalDoencas}`);
            console.log(`📊 Total: ${finalPaises + finalHPO + finalDoencas} registros`);

            if (finalPaises > 0) {
                console.log('\n🌍 PAÍSES IMPORTADOS:');
                const paises = await prisma.cplpCountry.findMany({
                    orderBy: { population: 'desc' }
                });
                
                let populacaoTotal = 0;
                paises.forEach((pais, index) => {
                    const pop = parseInt(pais.population || 0);
                    populacaoTotal += pop;
                    console.log(`   ${index + 1}. ${pais.flag_emoji} ${pais.name}: ${pop.toLocaleString()} hab`);
                });
                console.log(`\n🌐 População total CPLP: ${populacaoTotal.toLocaleString()} habitantes`);
            }

            console.log('\n🚀 PRÓXIMOS PASSOS:');
            console.log('─'.repeat(20));
            console.log('1️⃣  npx prisma studio  # Ver dados');
            console.log('2️⃣  npm start          # Iniciar APIs');
            console.log('3️⃣  Configurar MySQL local (opcional)');

            await prisma.$disconnect();
            console.log('\n✅ IMPORTAÇÃO MASSIVA CONCLUÍDA!');
        });

        async function processarInsert(insertSQL) {
            try {
                const upperSQL = insertSQL.toUpperCase();
                
                // CPLP Countries
                if (upperSQL.includes('INSERT INTO CPLP_COUNTRIES') || upperSQL.includes('INSERT INTO `CPLP_COUNTRIES`')) {
                    const dados = extrairDadosPais(insertSQL);
                    if (dados) {
                        await prisma.cplpCountry.create({ data: dados });
                        paisesInseridos++;
                        if (paisesInseridos <= 10) {
                            console.log(`✅ País: ${dados.flag_emoji} ${dados.name}`);
                        }
                    }
                }
                
                // HPO Terms
                else if (upperSQL.includes('INSERT INTO HPO_TERMS') || upperSQL.includes('INSERT INTO `HPO_TERMS`')) {
                    const dados = extrairDadosHPO(insertSQL);
                    if (dados) {
                        await prisma.hpoTerm.create({ data: dados });
                        hpoInseridos++;
                        if (hpoInseridos <= 10) {
                            console.log(`✅ HPO: ${dados.hpo_id} - ${dados.name.substring(0, 30)}...`);
                        }
                    }
                }
                
                // Orpha Diseases
                else if (upperSQL.includes('INSERT INTO ORPHA_DISEASES') || upperSQL.includes('INSERT INTO `ORPHA_DISEASES`')) {
                    const dados = extrairDadosOrpha(insertSQL);
                    if (dados) {
                        await prisma.rareDisease.create({ data: dados });
                        doencasInseridas++;
                        if (doencasInseridas <= 10) {
                            console.log(`✅ Doença: ${dados.external_id} - ${dados.name.substring(0, 30)}...`);
                        }
                    }
                }
                
            } catch (error) {
                // Silently continue on errors to keep processing
            }
        }

        function extrairDadosPais(insertSQL) {
            try {
                // Extract VALUES portion
                const valuesMatch = insertSQL.match(/VALUES\s*\((.*)\)/i);
                if (!valuesMatch) return null;

                // Split by comma but handle quoted strings
                const values = splitValuesRespectingQuotes(valuesMatch[1]);
                
                if (values.length >= 8) {
                    return {
                        code: cleanValue(values[1]) || 'UNK',
                        name: cleanValue(values[2]) || 'Unknown',
                        name_pt: cleanValue(values[3]) || cleanValue(values[2]) || 'Unknown',
                        flag_emoji: cleanValue(values[4]) || '🏳️',
                        population: cleanValue(values[5]) || '0',
                        language: cleanValue(values[6]) || 'pt',
                        health_system: cleanValue(values[7]) || 'Sistema Nacional de Saúde',
                        rare_disease_policy: cleanValue(values[8]) || 'Em desenvolvimento',
                        orphan_drugs_program: cleanValue(values[9]) || null
                    };
                }
            } catch (error) {
                return null;
            }
            return null;
        }

        function extrairDadosHPO(insertSQL) {
            try {
                const valuesMatch = insertSQL.match(/VALUES\s*\((.*)\)/i);
                if (!valuesMatch) return null;

                const values = splitValuesRespectingQuotes(valuesMatch[1]);
                
                if (values.length >= 3) {
                    return {
                        hpo_id: cleanValue(values[1]) || `HP:${Date.now()}`,
                        name: cleanValue(values[2]) || 'Unknown Term',
                        definition: cleanValue(values[3]) || null,
                        name_pt: cleanValue(values[4]) || null,
                        definition_pt: cleanValue(values[5]) || null,
                        synonyms: cleanValue(values[6]) || null
                    };
                }
            } catch (error) {
                return null;
            }
            return null;
        }

        function extrairDadosOrpha(insertSQL) {
            try {
                const valuesMatch = insertSQL.match(/VALUES\s*\((.*)\)/i);
                if (!valuesMatch) return null;

                const values = splitValuesRespectingQuotes(valuesMatch[1]);
                
                if (values.length >= 3) {
                    return {
                        external_id: cleanValue(values[1]) || `ORPHA:${Date.now()}`,
                        name: cleanValue(values[2]) || 'Unknown Disease',
                        name_pt: cleanValue(values[3]) || null,
                        definition: cleanValue(values[4]) || null,
                        definition_pt: cleanValue(values[5]) || null,
                        prevalence: cleanValue(values[6]) || 'Unknown',
                        inheritance_pattern: cleanValue(values[7]) || null,
                        age_of_onset: cleanValue(values[8]) || null,
                        data_source: 'orphanet_backup'
                    };
                }
            } catch (error) {
                return null;
            }
            return null;
        }

        function splitValuesRespectingQuotes(valuesStr) {
            const values = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < valuesStr.length; i++) {
                const char = valuesStr[i];
                
                if (!inQuotes && (char === "'" || char === '"')) {
                    inQuotes = true;
                    quoteChar = char;
                    current += char;
                } else if (inQuotes && char === quoteChar) {
                    inQuotes = false;
                    current += char;
                } else if (!inQuotes && char === ',') {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            if (current.trim()) {
                values.push(current.trim());
            }
            
            return values;
        }

        function cleanValue(value) {
            if (!value) return null;
            let clean = value.trim();
            
            // Remove quotes
            if ((clean.startsWith("'") && clean.endsWith("'")) || 
                (clean.startsWith('"') && clean.endsWith('"'))) {
                clean = clean.slice(1, -1);
            }
            
            // Handle NULL
            if (clean.toUpperCase() === 'NULL') return null;
            
            // Unescape quotes
            clean = clean.replace(/\\'/g, "'").replace(/\\"/g, '"');
            
            return clean || null;
        }

    } catch (error) {
        console.error('❌ Erro na extração massiva:', error.message);
        await prisma.$disconnect();
    }
}

extrairTudoDoBakup();
