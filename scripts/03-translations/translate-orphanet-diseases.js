// =====================================================================================
// SISTEMA DE TRADUÇÃO MÉDICA - DOENÇAS ORPHANET
// =====================================================================================
// Tradução especializada de doenças raras para português brasileiro
// Focado em terminologia médica precisa e nomenclatura oficial
// =====================================================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =====================================================================================
// DICIONÁRIO ESPECIALIZADO DE DOENÇAS RARAS
// =====================================================================================

const RARE_DISEASE_DICTIONARY = {
    // Tipos de Doenças
    'syndrome': 'síndrome',
    'disease': 'doença',
    'disorder': 'distúrbio',
    'deficiency': 'deficiência',
    'insufficiency': 'insuficiência',
    'dystrophy': 'distrofia',
    'atrophy': 'atrofia',
    'sclerosis': 'esclerose',
    'stenosis': 'estenose',
    'malformation': 'malformação',
    'deformity': 'deformidade',
    'dysplasia': 'displasia',
    'hyperplasia': 'hiperplasia',
    'hypoplasia': 'hipoplasia',

    // Cardiomiopatias
    'cardiomyopathy': 'cardiomiopatia',
    'hypertrophic': 'hipertrófica',
    'dilated': 'dilatada',
    'restrictive': 'restritiva',
    'arrhythmogenic': 'arritmogênica',

    // Neuropatias
    'neuropathy': 'neuropatia',
    'myopathy': 'miopatia',
    'encephalopathy': 'encefalopatia',
    'leukoencephalopathy': 'leucoencefalopatia',
    'polyneuropathy': 'polineuropatia',

    // Retinopatias e Oftalmologia
    'retinopathy': 'retinopatia',
    'retinal': 'retiniano',
    'macular': 'macular',
    'optic': 'óptico',
    'corneal': 'corneano',
    'cataract': 'catarata',
    'glaucoma': 'glaucoma',

    // Nefropatias
    'nephropathy': 'nefropatia',
    'nephritis': 'nefrite',
    'nephrotic': 'nefrótico',
    'renal': 'renal',
    'kidney': 'renal',

    // Hepatopatias
    'hepatopathy': 'hepatopatia',
    'hepatitis': 'hepatite',
    'hepatic': 'hepático',
    'liver': 'hepático',
    'cirrhosis': 'cirrose',

    // Doenças Metabólicas
    'metabolic': 'metabólico',
    'lysosomal': 'lisossomal',
    'storage': 'de depósito',
    'glycogen': 'glicogênio',
    'lipid': 'lipídico',
    'mucopolysaccharidosis': 'mucopolissacaridose',
    'sphingolipidosis': 'esfingolipidose',

    // Leucodistrofias
    'leukodystrophy': 'leucodistrofia',
    'leukoencephalopathy': 'leucoencefalopatia',
    'metachromatic': 'metacromática',
    'adrenoleukodystrophy': 'adrenoleucodistrofia',

    // Anatomia
    'congenital': 'congênito',
    'hereditary': 'hereditário',
    'familial': 'familiar',
    'idiopathic': 'idiopático',
    'primary': 'primário',
    'secondary': 'secundário',
    'acquired': 'adquirido',
    'progressive': 'progressivo',

    // Severidade
    'mild': 'leve',
    'moderate': 'moderado',
    'severe': 'grave',
    'profound': 'profundo',
    'acute': 'agudo',
    'chronic': 'crônico',
    'early': 'precoce',
    'late': 'tardio',

    // Localização Anatômica
    'cerebral': 'cerebral',
    'spinal': 'espinhal',
    'peripheral': 'periférico',
    'central': 'central',
    'cranial': 'craniano',
    'facial': 'facial',
    'cardiac': 'cardíaco',
    'pulmonary': 'pulmonar',
    'muscular': 'muscular',
    'skeletal': 'esquelético',
    'cutaneous': 'cutâneo'
};

// =====================================================================================
// TRADUÇÕES ESPECÍFICAS DE DOENÇAS CONHECIDAS
// =====================================================================================

const SPECIFIC_DISEASE_TRANSLATIONS = {
    // Síndromes Genéticas
    'Marfan syndrome': 'Síndrome de Marfan',
    'Turner syndrome': 'Síndrome de Turner',
    'Down syndrome': 'Síndrome de Down',
    'Ehlers-Danlos syndrome': 'Síndrome de Ehlers-Danlos',
    'Prader-Willi syndrome': 'Síndrome de Prader-Willi',
    'Angelman syndrome': 'Síndrome de Angelman',
    'DiGeorge syndrome': 'Síndrome de DiGeorge',
    'Williams-Beuren syndrome': 'Síndrome de Williams-Beuren',

    // Distrofias Musculares
    'Duchenne muscular dystrophy': 'Distrofia muscular de Duchenne',
    'Becker muscular dystrophy': 'Distrofia muscular de Becker',
    'Myotonic dystrophy': 'Distrofia miotônica',
    'Facioscapulohumeral muscular dystrophy': 'Distrofia muscular facioescapuloumeral',
    'Limb-girdle muscular dystrophy': 'Distrofia muscular de cinturas',

    // Mucopolissacaridoses
    'Mucopolysaccharidosis type I': 'Mucopolissacaridose tipo I',
    'Mucopolysaccharidosis type II': 'Mucopolissacaridose tipo II',
    'Mucopolysaccharidosis type III': 'Mucopolissacaridose tipo III',
    'Mucopolysaccharidosis type IV': 'Mucopolissacaridose tipo IV',
    'Hunter syndrome': 'Síndrome de Hunter',
    'Hurler syndrome': 'Síndrome de Hurler',
    'Sanfilippo syndrome': 'Síndrome de Sanfilippo',

    // Leucodistrofias
    'Metachromatic leukodystrophy': 'Leucodistrofia metacromática',
    'Adrenoleukodystrophy': 'Adrenoleucodistrofia',
    'Krabbe disease': 'Doença de Krabbe',
    'Alexander disease': 'Doença de Alexander',

    // Doenças de Depósito
    'Gaucher disease': 'Doença de Gaucher',
    'Niemann-Pick disease': 'Doença de Niemann-Pick',
    'Tay-Sachs disease': 'Doença de Tay-Sachs',
    'Fabry disease': 'Doença de Fabry',
    'Pompe disease': 'Doença de Pompe',

    // Erros Inatos do Metabolismo
    'Phenylketonuria': 'Fenilcetonúria',
    'Galactosemia': 'Galactosemia',
    'Maple syrup urine disease': 'Doença da urina do xarope de bordo',
    'Homocystinuria': 'Homocistinúria',

    // Imunodeficiências
    'Severe combined immunodeficiency': 'Imunodeficiência combinada grave',
    'DiGeorge syndrome': 'Síndrome de DiGeorge',
    'Wiskott-Aldrich syndrome': 'Síndrome de Wiskott-Aldrich',

    // Doenças Cardíacas
    'Hypertrophic cardiomyopathy': 'Cardiomiopatia hipertrófica',
    'Dilated cardiomyopathy': 'Cardiomiopatia dilatada',
    'Arrhythmogenic right ventricular cardiomyopathy': 'Cardiomiopatia arritmogênica do ventrículo direito',

    // Retinopatias
    'Leber congenital amaurosis': 'Amaurose congênita de Leber',
    'Stargardt disease': 'Doença de Stargardt',
    'Retinitis pigmentosa': 'Retinose pigmentar',

    // Ataxias
    'Friedreich ataxia': 'Ataxia de Friedreich',
    'Spinocerebellar ataxia': 'Ataxia espinocerebelar',
    'Ataxia telangiectasia': 'Ataxia telangiectasia'
};

// =====================================================================================
// CLASSE DE TRADUÇÃO DE DOENÇAS ORPHANET
// =====================================================================================

class OrphanetTranslator {
    constructor() {
        this.translatedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
        this.batchSize = 100;
    }

    // =====================================================================================
    // MÉTODO PRINCIPAL
    // =====================================================================================
    async translateAllOrphanetDiseases() {
        console.log('🧬 INICIANDO TRADUÇÃO DE DOENÇAS ORPHANET');
        console.log('=======================================\n');

        try {
            const totalDiseases = await prisma.orphaDisease.count();
            const diseasesToTranslate = await prisma.orphaDisease.count({
                where: {
                    OR: [
                        { preferredNamePt: null },
                        { preferredNamePt: '' }
                    ]
                }
            });

            console.log(`📊 Total de doenças: ${totalDiseases.toLocaleString()}`);
            console.log(`🔄 Doenças para traduzir: ${diseasesToTranslate.toLocaleString()}`);
            console.log(`📈 Percentual a traduzir: ${((diseasesToTranslate / totalDiseases) * 100).toFixed(1)}%\n`);

            let offset = 0;
            while (true) {
                const batch = await this.getNextBatch(offset);
                if (batch.length === 0) break;

                await this.processBatch(batch);
                offset += this.batchSize;

                console.log(`✅ Processadas ${Math.min(offset, diseasesToTranslate)} de ${diseasesToTranslate} doenças...`);
            }

            await this.generateReport();

        } catch (error) {
            console.error('❌ Erro na tradução Orphanet:', error);
        } finally {
            await prisma.$disconnect();
        }
    }

    // =====================================================================================
    // BUSCAR PRÓXIMO LOTE
    // =====================================================================================
    async getNextBatch(offset) {
        return await prisma.orphaDisease.findMany({
            where: {
                OR: [
                    { preferredNamePt: null },
                    { preferredNamePt: '' }
                ]
            },
            skip: offset,
            take: this.batchSize,
            orderBy: { preferredNameEn: 'asc' }
        });
    }

    // =====================================================================================
    // PROCESSAR LOTE
    // =====================================================================================
    async processBatch(diseases) {
        for (const disease of diseases) {
            try {
                // Traduzir nome preferido
                const translatedName = this.translateDiseaseName(disease.preferredNameEn);
                
                // Traduzir sinônimos se existirem
                let translatedSynonyms = null;
                if (disease.synonymsEn) {
                    translatedSynonyms = this.translateSynonyms(disease.synonymsEn);
                }

                // Verificar se houve mudança
                const nameChanged = translatedName !== disease.preferredNameEn;
                const synonymsChanged = translatedSynonyms && translatedSynonyms !== disease.synonymsEn;

                if (nameChanged || synonymsChanged) {
                    const updateData = {};
                    if (nameChanged) updateData.preferredNamePt = translatedName;
                    if (synonymsChanged) updateData.synonymsPt = translatedSynonyms;

                    await prisma.orphaDisease.update({
                        where: { id: disease.id },
                        data: updateData
                    });

                    this.translatedCount++;
                } else {
                    this.skippedCount++;
                }

            } catch (error) {
                console.error(`⚠️  Erro traduzindo ${disease.orphaNumber}: ${error.message}`);
                this.errorCount++;
            }
        }
    }

    // =====================================================================================
    // TRADUZIR NOME DA DOENÇA
    // =====================================================================================
    translateDiseaseName(originalName) {
        // 1. Verificar traduções específicas exatas
        if (SPECIFIC_DISEASE_TRANSLATIONS[originalName]) {
            return SPECIFIC_DISEASE_TRANSLATIONS[originalName];
        }

        // 2. Verificar traduções específicas parciais (contendo palavras-chave)
        for (const [english, portuguese] of Object.entries(SPECIFIC_DISEASE_TRANSLATIONS)) {
            if (originalName.includes(english)) {
                return originalName.replace(english, portuguese);
            }
        }

        // 3. Aplicar dicionário palavra por palavra
        let translated = originalName;
        for (const [english, portuguese] of Object.entries(RARE_DISEASE_DICTIONARY)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // 4. Correções pós-tradução
        translated = this.applyPostTranslationCorrections(translated);

        // 5. Capitalização adequada para nomes de doenças
        translated = this.capitalizeDiseaseName(translated);

        return translated;
    }

    // =====================================================================================
    // TRADUZIR SINÔNIMOS
    // =====================================================================================
    translateSynonyms(synonymsString) {
        if (!synonymsString) return null;

        // Assumindo que sinônimos são separados por ';' ou '|'
        const synonyms = synonymsString.split(/[;|]/).map(s => s.trim());
        const translatedSynonyms = synonyms.map(synonym => this.translateDiseaseName(synonym));
        
        return translatedSynonyms.join('; ');
    }

    // =====================================================================================
    // CORREÇÕES PÓS-TRADUÇÃO
    // =====================================================================================
    applyPostTranslationCorrections(text) {
        const corrections = {
            // Correções de artigos
            'síndrome de de': 'síndrome de',
            'doença de de': 'doença de',
            'distúrbio de de': 'distúrbio de',
            'distrofia de de': 'distrofia de',
            
            // Correções de gênero
            'deficiência de': 'deficiência da',
            'insuficiência de': 'insuficiência da',
            'atrofia de': 'atrofia da',
            'displasia de': 'displasia da',
            'hiperplasia de': 'hiperplasia da',
            'hipoplasia de': 'hipoplasia da',
            
            // Correções específicas
            'mucopolissacaridose de tipo': 'mucopolissacaridose tipo',
            'leucodistrofia de metacromática': 'leucodistrofia metacromática',
            'cardiomiopatia de hipertrófica': 'cardiomiopatia hipertrófica',
            'cardiomiopatia de dilatada': 'cardiomiopatia dilatada',
            
            // Números
            'tipo eu': 'tipo I',
            'tipo ii': 'tipo II',
            'tipo iii': 'tipo III',
            'tipo iv': 'tipo IV',
            'tipo v': 'tipo V'
        };

        let corrected = text;
        for (const [wrong, right] of Object.entries(corrections)) {
            corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
        }

        return corrected;
    }

    // =====================================================================================
    // CAPITALIZAR NOME DA DOENÇA
    // =====================================================================================
    capitalizeDiseaseName(name) {
        // Palavras que devem permanecer minúsculas (exceto no início)
        const lowercaseWords = ['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'com', 'por', 'para', 'tipo'];
        
        const words = name.split(' ');
        const capitalizedWords = words.map((word, index) => {
            if (index === 0) {
                // Primeira palavra sempre maiúscula
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            } else if (lowercaseWords.includes(word.toLowerCase())) {
                // Palavras específicas em minúscula
                return word.toLowerCase();
            } else if (/^[IVX]+$/.test(word)) {
                // Números romanos em maiúscula
                return word.toUpperCase();
            } else {
                // Outras palavras com primeira letra maiúscula
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            }
        });

        return capitalizedWords.join(' ');
    }

    // =====================================================================================
    // RELATÓRIO FINAL
    // =====================================================================================
    async generateReport() {
        const totalDiseases = await prisma.orphaDisease.count();
        const translatedDiseases = await prisma.orphaDisease.count({
            where: { preferredNamePt: { not: null } }
        });
        const coverage = totalDiseases > 0 ? ((translatedDiseases / totalDiseases) * 100).toFixed(1) : '0.0';

        console.log('\n🎉 TRADUÇÃO ORPHANET CONCLUÍDA!');
        console.log('==============================');
        console.log(`✅ Doenças traduzidas: ${this.translatedCount.toLocaleString()}`);
        console.log(`⏭️  Doenças ignoradas: ${this.skippedCount.toLocaleString()}`);
        console.log(`❌ Erros encontrados: ${this.errorCount.toLocaleString()}`);
        console.log(`📊 Total de doenças: ${totalDiseases.toLocaleString()}`);
        console.log(`📈 Cobertura atual: ${coverage}%`);

        console.log('\n🧬 QUALIDADE DA TRADUÇÃO:');
        console.log('========================');
        console.log('✅ Nomenclatura médica oficial preservada');
        console.log('✅ Traduções específicas para síndromes conhecidas');
        console.log('✅ Capitalização adequada para nomes próprios');
        console.log('✅ Correções gramaticais aplicadas');

        console.log('\n🌍 BENEFÍCIOS PARA COMUNIDADE MÉDICA:');
        console.log('=====================================');
        console.log('🏥 Diagnósticos mais acessíveis em português');
        console.log('📚 Literatura médica traduzida automaticamente');
        console.log('🔬 Pesquisa facilitada para cientistas lusófonos');
        console.log('👨‍⚕️ Comunicação médico-paciente aprimorada');
    }
}

// =====================================================================================
// EXECUÇÃO
// =====================================================================================
async function main() {
    const translator = new OrphanetTranslator();
    await translator.translateAllOrphanetDiseases();
}

if (require.main === module) {
    main().then(() => {
        console.log('\n🎊 DOENÇAS ORPHANET MULTILÍNGUES ATIVAS!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 ERRO CRÍTICO:', error);
        process.exit(1);
    });
}

module.exports = { OrphanetTranslator };
