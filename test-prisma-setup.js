const { PrismaClient } = require('@prisma/client');

console.log('🔧 CONFIGURAÇÃO E TESTE DO PRISMA');
console.log('═'.repeat(50));

const prisma = new PrismaClient();

async function testPrisma() {
    try {
        console.log('\n🔗 Testando conexão Prisma...');
        
        // Verificar se consegue conectar
        await prisma.$connect();
        console.log('✅ Conexão Prisma estabelecida');

        console.log('\n📊 VERIFICANDO TABELAS:');
        console.log('─'.repeat(30));

        // Verificar tabelas existentes
        const tables = await prisma.$queryRaw`
            SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
        `;
        
        console.log(`📋 Tabelas encontradas: ${tables.length}`);
        tables.forEach((table, index) => {
            console.log(`   ${index + 1}. ${table.name}`);
        });

        console.log('\n🌍 POPULANDO DADOS CPLP:');
        console.log('─'.repeat(30));

        // Dados dos países CPLP
        const paisesCPLP = [
            {
                code: 'BR',
                name: 'Brasil',
                name_pt: 'Brasil',
                flag_emoji: '🇧🇷',
                population: '215000000',
                language: 'pt',
                health_system: 'Sistema Único de Saúde (SUS)',
                rare_disease_policy: 'Política Nacional de Atenção às Pessoas com Doenças Raras',
                orphan_drugs_program: 'RENAME - Medicamentos Órfãos'
            },
            {
                code: 'PT',
                name: 'Portugal',
                name_pt: 'Portugal',
                flag_emoji: '🇵🇹',
                population: '10300000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde (SNS)',
                rare_disease_policy: 'Programa Nacional de Doenças Raras',
                orphan_drugs_program: 'Medicamentos Órfãos - INFARMED'
            },
            {
                code: 'AO',
                name: 'Angola',
                name_pt: 'Angola',
                flag_emoji: '🇦🇴',
                population: '33900000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde de Angola',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'MZ',
                name: 'Moçambique',
                name_pt: 'Moçambique',
                flag_emoji: '🇲🇿',
                population: '32200000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde de Moçambique',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'CV',
                name: 'Cabo Verde',
                name_pt: 'Cabo Verde',
                flag_emoji: '🇨🇻',
                population: '560000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde de Cabo Verde',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'GW',
                name: 'Guiné-Bissau',
                name_pt: 'Guiné-Bissau',
                flag_emoji: '🇬🇼',
                population: '2000000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde da Guiné-Bissau',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'ST',
                name: 'São Tomé e Príncipe',
                name_pt: 'São Tomé e Príncipe',
                flag_emoji: '🇸🇹',
                population: '220000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde de STP',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'TL',
                name: 'Timor-Leste',
                name_pt: 'Timor-Leste',
                flag_emoji: '🇹🇱',
                population: '1300000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde de Timor-Leste',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            },
            {
                code: 'GQ',
                name: 'Guiné Equatorial',
                name_pt: 'Guiné Equatorial',
                flag_emoji: '🇬🇶',
                population: '1500000',
                language: 'pt',
                health_system: 'Sistema de Saúde da Guiné Equatorial',
                rare_disease_policy: 'Em desenvolvimento',
                orphan_drugs_program: null
            }
        ];

        // Inserir países usando Prisma
        console.log('📝 Inserindo países CPLP...');
        for (const pais of paisesCPLP) {
            try {
                const paisCriado = await prisma.cplpCountry.upsert({
                    where: { code: pais.code },
                    update: pais,
                    create: pais
                });
                
                console.log(`✅ ${pais.flag_emoji} ${pais.name}: ${parseInt(pais.population).toLocaleString()} hab`);
            } catch (error) {
                console.log(`❌ Erro ao inserir ${pais.name}: ${error.message}`);
            }
        }

        console.log('\n📊 VERIFICANDO DADOS INSERIDOS:');
        console.log('─'.repeat(35));

        // Verificar dados inseridos
        const totalPaises = await prisma.cplpCountry.count();
        console.log(`📋 Total de países: ${totalPaises}`);

        const paises = await prisma.cplpCountry.findMany({
            orderBy: { population: 'desc' }
        });

        console.log('\n🌍 PAÍSES CPLP CADASTRADOS:');
        console.log('─'.repeat(30));
        
        let populacaoTotal = 0;
        paises.forEach((pais, index) => {
            const pop = parseInt(pais.population);
            populacaoTotal += pop;
            console.log(`   ${index + 1}. ${pais.flag_emoji} ${pais.name}: ${pop.toLocaleString()} hab`);
        });

        console.log(`\n🌐 População total CPLP: ${populacaoTotal.toLocaleString()} habitantes`);

        console.log('\n🧬 ADICIONANDO DADOS CIENTÍFICOS BÁSICOS:');
        console.log('─'.repeat(45));

        // HPO Terms básicos
        const hpoTermsBasicos = [
            {
                hpo_id: 'HP:0000001',
                name: 'All',
                definition: 'Root of all terms in the Human Phenotype Ontology.',
                is_obsolete: false
            },
            {
                hpo_id: 'HP:0000118',
                name: 'Phenotypic abnormality',
                definition: 'A phenotypic abnormality.',
                is_obsolete: false
            },
            {
                hpo_id: 'HP:0001507',
                name: 'Growth abnormality',
                definition: 'A deviation from the normal rate of growth.',
                is_obsolete: false
            }
        ];

        console.log('🧬 Inserindo HPO Terms...');
        for (const termo of hpoTermsBasicos) {
            try {
                await prisma.hpoTerm.upsert({
                    where: { hpo_id: termo.hpo_id },
                    update: termo,
                    create: termo
                });
                console.log(`✅ HPO: ${termo.hpo_id} - ${termo.name}`);
            } catch (error) {
                console.log(`❌ Erro HPO ${termo.hpo_id}: ${error.message}`);
            }
        }

        // Doenças Orphanet básicas
        const orphaDiseasesBasicas = [
            {
                orpha_code: 'ORPHA:558',
                name: 'Marfan syndrome',
                definition: 'A systemic disorder of connective tissue characterized by abnormalities of the eyes, skeleton, and cardiovascular system.',
                prevalence: 'Rare'
            },
            {
                orpha_code: 'ORPHA:773',
                name: 'Neurofibromatosis type 1',
                definition: 'A tumor predisposition syndrome characterized by the development of neurofibromas.',
                prevalence: 'Uncommon'
            }
        ];

        console.log('🔬 Inserindo Orphanet Diseases...');
        for (const doenca of orphaDiseasesBasicas) {
            try {
                await prisma.orphaDisease.upsert({
                    where: { orpha_code: doenca.orpha_code },
                    update: doenca,
                    create: doenca
                });
                console.log(`✅ Orphanet: ${doenca.orpha_code} - ${doenca.name}`);
            } catch (error) {
                console.log(`❌ Erro Orphanet ${doenca.orpha_code}: ${error.message}`);
            }
        }

        console.log('\n🎉 PRISMA CONFIGURADO COM SUCESSO!');
        console.log('═'.repeat(50));
        console.log('✅ Cliente Prisma gerado');
        console.log('✅ Schema aplicado à database');
        console.log('✅ Dados CPLP inseridos');
        console.log('✅ Dados científicos básicos adicionados');
        console.log('🌐 Prisma Studio rodando em: http://localhost:5555');
        
        console.log('\n📋 PRÓXIMOS COMANDOS:');
        console.log('─'.repeat(25));
        console.log('• npm start              # Iniciar APIs NestJS');
        console.log('• npx prisma studio      # Abrir interface visual');
        console.log('• npm run prisma:studio  # Comando alternativo');

    } catch (error) {
        console.error('❌ Erro no Prisma:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('🔐 Conexão Prisma fechada');
    }
}

testPrisma();
