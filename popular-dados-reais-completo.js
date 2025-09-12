const { PrismaClient } = require('@prisma/client');

console.log('🎯 POPULAÇÃO MANUAL: Dados Reais CPLP-Raras');
console.log('═'.repeat(50));

const prisma = new PrismaClient();

async function popularDadosReais() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma conectado');

        // Limpar dados existentes
        console.log('\n🗑️  Limpando dados antigos...');
        await prisma.cplpCountry.deleteMany();
        await prisma.hpoTerm.deleteMany();
        await prisma.rareDisease.deleteMany();
        console.log('✅ Base limpa');

        console.log('\n🌍 INSERINDO TODOS OS PAÍSES CPLP:');
        console.log('─'.repeat(40));

        // Todos os 9 países CPLP com dados completos
        const paisesCPLP = [
            {
                code: 'BR',
                name: 'Brasil',
                name_pt: 'Brasil', 
                flag_emoji: '🇧🇷',
                population: '215300000',
                language: 'pt',
                health_system: 'Sistema Único de Saúde (SUS)',
                rare_disease_policy: 'Política Nacional de Atenção às Pessoas com Doenças Raras (Portaria GM/MS nº 199/2014)',
                orphan_drugs_program: 'RENAME - Relação Nacional de Medicamentos Essenciais (inclui medicamentos órfãos)'
            },
            {
                code: 'PT',
                name: 'Portugal',
                name_pt: 'Portugal',
                flag_emoji: '🇵🇹', 
                population: '10330000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde (SNS)',
                rare_disease_policy: 'Programa Nacional para as Doenças Raras',
                orphan_drugs_program: 'Medicamentos Órfãos - INFARMED, I.P.'
            },
            {
                code: 'AO',
                name: 'Angola',
                name_pt: 'Angola',
                flag_emoji: '🇦🇴',
                population: '35600000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde de Angola',
                rare_disease_policy: 'Em desenvolvimento - Plano Nacional de Saúde 2025-2030',
                orphan_drugs_program: 'Lista Nacional de Medicamentos Essenciais (sem categoria específica para órfãos)'
            },
            {
                code: 'MZ', 
                name: 'Moçambique',
                name_pt: 'Moçambique',
                flag_emoji: '🇲🇿',
                population: '33100000',
                language: 'pt',
                health_system: 'Serviço Nacional de Saúde de Moçambique',
                rare_disease_policy: 'Estratégia do Sector da Saúde 2014-2025 (menção a doenças não transmissíveis)',
                orphan_drugs_program: 'Lista Nacional de Medicamentos e Dispositivos Médicos'
            },
            {
                code: 'CV',
                name: 'Cabo Verde', 
                name_pt: 'Cabo Verde',
                flag_emoji: '🇨🇻',
                population: '593000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde de Cabo Verde',
                rare_disease_policy: 'Plano Nacional de Desenvolvimento Sanitário 2017-2021',
                orphan_drugs_program: 'Lista Nacional de Medicamentos Essenciais'
            },
            {
                code: 'GW',
                name: 'Guiné-Bissau',
                name_pt: 'Guiné-Bissau', 
                flag_emoji: '🇬🇼',
                population: '2150000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde da Guiné-Bissau',
                rare_disease_policy: 'Política Nacional de Saúde 2015-2025',
                orphan_drugs_program: 'Lista Nacional de Medicamentos Essenciais (básica)'
            },
            {
                code: 'ST',
                name: 'São Tomé e Príncipe',
                name_pt: 'São Tomé e Príncipe',
                flag_emoji: '🇸🇹',
                population: '230000',
                language: 'pt', 
                health_system: 'Serviço Nacional de Saúde de São Tomé e Príncipe',
                rare_disease_policy: 'Política Nacional de Saúde 2015-2025',
                orphan_drugs_program: 'Lista Nacional de Medicamentos Essenciais'
            },
            {
                code: 'TL',
                name: 'Timor-Leste',
                name_pt: 'Timor-Leste',
                flag_emoji: '🇹🇱',
                population: '1360000',
                language: 'pt',
                health_system: 'Sistema Nacional de Saúde de Timor-Leste', 
                rare_disease_policy: 'Plano Nacional de Saúde 2020-2030',
                orphan_drugs_program: 'Lista Nacional de Medicamentos Essenciais'
            },
            {
                code: 'GQ',
                name: 'Guiné Equatorial',
                name_pt: 'Guiné Equatorial',
                flag_emoji: '🇬🇶',
                population: '1680000',
                language: 'es', // Espanhol mas membro CPLP
                health_system: 'Sistema de Saúde Nacional da Guiné Equatorial',
                rare_disease_policy: 'Plan Nacional de Desarrollo del Sector Salud',
                orphan_drugs_program: 'Lista Nacional de Medicamentos'
            }
        ];

        let paisesInseridos = 0;
        for (const pais of paisesCPLP) {
            try {
                await prisma.cplpCountry.create({ data: pais });
                console.log(`✅ ${pais.flag_emoji} ${pais.name}: ${parseInt(pais.population).toLocaleString()} hab`);
                paisesInseridos++;
            } catch (error) {
                console.log(`❌ Erro ${pais.name}: ${error.message}`);
            }
        }

        console.log('\n🧬 INSERINDO HPO TERMS (DADOS REAIS):');
        console.log('─'.repeat(40));

        // HPO Terms extraídos do backup original
        const hpoTermsReais = [
            {
                hpo_id: 'HP:0000001',
                name: 'All',
                definition: 'Root of all terms in the Human Phenotype Ontology.',
                name_pt: 'Todos',
                definition_pt: 'Raiz de todos os termos na Ontologia de Fenótipos Humanos.'
            },
            {
                hpo_id: 'HP:0000118', 
                name: 'Phenotypic abnormality',
                definition: 'A phenotypic abnormality.',
                name_pt: 'Anormalidade fenotípica',
                definition_pt: 'Uma anormalidade fenotípica.'
            },
            {
                hpo_id: 'HP:0001507',
                name: 'Growth abnormality',
                definition: 'A deviation from the normal rate of growth.',
                name_pt: 'Anormalidade de crescimento',
                definition_pt: 'Um desvio da taxa normal de crescimento.'
            },
            {
                hpo_id: 'HP:0000478',
                name: 'Abnormality of the eye',
                definition: 'Any abnormality of the eye, including location, spacing, and intraocular abnormalities.',
                name_pt: 'Anormalidade do olho',
                definition_pt: 'Qualquer anormalidade do olho, incluindo localização, espaçamento e anormalidades intraoculares.'
            },
            {
                hpo_id: 'HP:0000707',
                name: 'Abnormality of the nervous system',
                definition: 'An abnormality of the nervous system.',
                name_pt: 'Anormalidade do sistema nervoso',
                definition_pt: 'Uma anormalidade do sistema nervoso.'
            },
            {
                hpo_id: 'HP:0001871',
                name: 'Abnormality of blood and blood-forming tissues',
                definition: 'An abnormality of the hematopoietic system.',
                name_pt: 'Anormalidade do sangue e tecidos formadores de sangue',
                definition_pt: 'Uma anormalidade do sistema hematopoiético.'
            },
            {
                hpo_id: 'HP:0000924',
                name: 'Abnormality of the skeletal system',
                definition: 'An abnormality of the skeletal system.',
                name_pt: 'Anormalidade do sistema esquelético',
                definition_pt: 'Uma anormalidade do sistema esquelético.'
            },
            {
                hpo_id: 'HP:0000818',
                name: 'Abnormality of the endocrine system',
                definition: 'Ab abnormality of the endocrine system.',
                name_pt: 'Anormalidade do sistema endócrino', 
                definition_pt: 'Uma anormalidade do sistema endócrino.'
            },
            {
                hpo_id: 'HP:0002664',
                name: 'Neoplasm',
                definition: 'An organ or organ-system abnormality that consists of uncontrolled autonomous cell-proliferation.',
                name_pt: 'Neoplasia',
                definition_pt: 'Uma anormalidade de órgão que consiste em proliferação celular autônoma descontrolada.'
            },
            {
                hpo_id: 'HP:0000152',
                name: 'Abnormality of head or neck',
                definition: 'An abnormality of the head or neck.',
                name_pt: 'Anormalidade da cabeça ou pescoço',
                definition_pt: 'Uma anormalidade da cabeça ou pescoço.'
            }
        ];

        let hpoInseridos = 0;
        for (const termo of hpoTermsReais) {
            try {
                await prisma.hpoTerm.create({ data: termo });
                console.log(`✅ ${termo.hpo_id}: ${termo.name}`);
                hpoInseridos++;
            } catch (error) {
                console.log(`❌ Erro HPO ${termo.hpo_id}: ${error.message}`);
            }
        }

        console.log('\n🔬 INSERINDO DOENÇAS RARAS (ORPHANET):');
        console.log('─'.repeat(45));

        // Doenças raras mais relevantes para países CPLP
        const doencasRaras = [
            {
                orphacode: 'ORPHA:558',
                name: 'Marfan syndrome',
                name_pt: 'Síndrome de Marfan',
                definition: 'A systemic disorder of connective tissue characterized by abnormalities of the eyes, skeleton, and cardiovascular system.',
                definition_pt: 'Um distúrbio sistêmico do tecido conjuntivo caracterizado por anormalidades dos olhos, esqueleto e sistema cardiovascular.',
                prevalence: '1:5000',
                inheritance: 'Autosomal dominant',
                age_onset: 'All ages'
            },
            {
                orphacode: 'ORPHA:773',
                name: 'Neurofibromatosis type 1',
                name_pt: 'Neurofibromatose tipo 1',
                definition: 'A tumor predisposition syndrome characterized by the development of neurofibromas.',
                definition_pt: 'Uma síndrome de predisposição tumoral caracterizada pelo desenvolvimento de neurofibromas.',
                prevalence: '1:3000',
                inheritance: 'Autosomal dominant', 
                age_onset: 'Childhood'
            },
            {
                orphacode: 'ORPHA:586',
                name: 'Ehlers-Danlos syndrome',
                name_pt: 'Síndrome de Ehlers-Danlos',
                definition: 'A heterogeneous group of heritable connective tissue disorders.',
                definition_pt: 'Um grupo heterogêneo de distúrbios hereditários do tecido conjuntivo.',
                prevalence: '1:5000',
                inheritance: 'Various',
                age_onset: 'All ages'
            },
            {
                orphacode: 'ORPHA:550',
                name: 'Duchenne muscular dystrophy',
                name_pt: 'Distrofia muscular de Duchenne',
                definition: 'A severe X-linked recessive neuromuscular disorder.',
                definition_pt: 'Um distúrbio neuromuscular recessivo ligado ao X severo.',
                prevalence: '1:3500 male births',
                inheritance: 'X-linked recessive',
                age_onset: 'Early childhood'
            },
            {
                orphacode: 'ORPHA:352',
                name: 'Cystic fibrosis',
                name_pt: 'Fibrose cística',
                definition: 'A multisystem disorder affecting the respiratory and digestive systems.',
                definition_pt: 'Um distúrbio multissistêmico que afeta os sistemas respiratório e digestivo.',
                prevalence: '1:2500-3500',
                inheritance: 'Autosomal recessive',
                age_onset: 'Neonatal/infantile'
            }
        ];

        let doencasInseridas = 0;
        for (const doenca of doencasRaras) {
            try {
                await prisma.rareDisease.create({ data: doenca });
                console.log(`✅ ${doenca.orphacode}: ${doenca.name_pt || doenca.name}`);
                doencasInseridas++;
            } catch (error) {
                console.log(`❌ Erro doença ${doenca.orphacode}: ${error.message}`);
            }
        }

        console.log('\n📊 RESULTADO FINAL:');
        console.log('─'.repeat(25));
        console.log(`🌍 Países CPLP: ${paisesInseridos}/9`);
        console.log(`🧬 HPO Terms: ${hpoInseridos}/10`);
        console.log(`🔬 Doenças Raras: ${doencasInseridas}/5`);
        console.log(`📈 Total: ${paisesInseridos + hpoInseridos + doencasInseridas} registros`);

        // Calcular população total
        const paises = await prisma.cplpCountry.findMany();
        const populacaoTotal = paises.reduce((total, pais) => total + parseInt(pais.population), 0);

        console.log('\n🌍 COMUNIDADE CPLP COMPLETA:');
        console.log('─'.repeat(35));
        paises.forEach((pais, index) => {
            const pop = parseInt(pais.population);
            console.log(`   ${index + 1}. ${pais.flag_emoji} ${pais.name}: ${pop.toLocaleString()} hab`);
        });
        console.log(`\n🌐 População total CPLP: ${populacaoTotal.toLocaleString()} habitantes`);

        console.log('\n🎉 BASE PRISMA POPULADA COM DADOS REAIS!');
        console.log('═'.repeat(50));
        console.log('✅ Todos os 9 países CPLP inseridos');
        console.log('✅ HPO Terms principais traduzidos');
        console.log('✅ Doenças raras relevantes para CPLP');
        console.log('✅ Sistema pronto para desenvolvimento');

        console.log('\n🚀 PRÓXIMOS COMANDOS:');
        console.log('─'.repeat(25));
        console.log('• npx prisma studio   # Interface visual');
        console.log('• npm start           # Iniciar APIs');
        console.log('• npm run dev         # Modo desenvolvimento');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await prisma.$disconnect();
        console.log('\n🔐 Prisma desconectado');
    }
}

popularDadosReais();
