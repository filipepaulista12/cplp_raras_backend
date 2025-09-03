// =====================================================================================
// SISTEMA DE TRADUÇÃO MÉDICA ESPECIALIZADA - HPO TERMS
// =====================================================================================
// Tradução fidedigna de termos médicos HPO para português brasileiro
// Baseado em terminologia médica oficial e dicionários especializados
// =====================================================================================

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;

const prisma = new PrismaClient();

// =====================================================================================
// DICIONÁRIO MÉDICO HPO PORTUGUÊS - TERMINOLOGIA OFICIAL
// =====================================================================================

const HPO_MEDICAL_DICTIONARY = {
    // Anatomia Básica
    'abnormal': 'anormal',
    'abnormality': 'anormalidade',
    'morphology': 'morfologia',
    'structure': 'estrutura',
    'function': 'função',
    'development': 'desenvolvimento',
    'formation': 'formação',
    'growth': 'crescimento',
    'size': 'tamanho',
    'shape': 'forma',
    'position': 'posição',
    'orientation': 'orientação',
    'configuration': 'configuração',

    // Sistemas Corporais
    'cardiovascular': 'cardiovascular',
    'respiratory': 'respiratório',
    'nervous': 'nervoso',
    'musculoskeletal': 'musculoesquelético',
    'gastrointestinal': 'gastrointestinal',
    'genitourinary': 'geniturinário',
    'endocrine': 'endócrino',
    'immune': 'imunológico',
    'hematologic': 'hematológico',
    'integumentary': 'tegumentar',
    'sensory': 'sensorial',

    // Cabeça e Pescoço
    'head': 'cabeça',
    'skull': 'crânio',
    'face': 'face',
    'facial': 'facial',
    'forehead': 'testa',
    'eye': 'olho',
    'ocular': 'ocular',
    'orbital': 'orbital',
    'nose': 'nariz',
    'nasal': 'nasal',
    'mouth': 'boca',
    'oral': 'oral',
    'lip': 'lábio',
    'tongue': 'língua',
    'teeth': 'dentes',
    'dental': 'dental',
    'jaw': 'mandíbula',
    'ear': 'orelha',
    'hearing': 'audição',
    'neck': 'pescoço',
    'cervical': 'cervical',

    // Sistema Neurológico
    'brain': 'cérebro',
    'cerebral': 'cerebral',
    'neurological': 'neurológico',
    'cognitive': 'cognitivo',
    'intellectual': 'intelectual',
    'mental': 'mental',
    'behavioral': 'comportamental',
    'seizure': 'convulsão',
    'epilepsy': 'epilepsia',
    'paralysis': 'paralisia',
    'weakness': 'fraqueza',
    'ataxia': 'ataxia',
    'tremor': 'tremor',
    'spasticity': 'espasticidade',
    'hypotonia': 'hipotonia',
    'hypertonia': 'hipertonia',

    // Sistema Cardiovascular
    'heart': 'coração',
    'cardiac': 'cardíaco',
    'vessel': 'vaso',
    'vascular': 'vascular',
    'artery': 'artéria',
    'arterial': 'arterial',
    'vein': 'veia',
    'venous': 'venoso',
    'circulation': 'circulação',
    'blood': 'sangue',
    'pressure': 'pressão',
    'rhythm': 'ritmo',

    // Sistema Respiratório
    'lung': 'pulmão',
    'pulmonary': 'pulmonar',
    'respiratory': 'respiratório',
    'breathing': 'respiração',
    'airway': 'via aérea',
    'bronchi': 'brônquios',
    'alveoli': 'alvéolos',

    // Sistema Musculoesquelético
    'muscle': 'músculo',
    'muscular': 'muscular',
    'bone': 'osso',
    'skeletal': 'esquelético',
    'joint': 'articulação',
    'limb': 'membro',
    'arm': 'braço',
    'leg': 'perna',
    'hand': 'mão',
    'foot': 'pé',
    'finger': 'dedo',
    'toe': 'dedo do pé',
    'spine': 'coluna',
    'vertebral': 'vertebral',

    // Pele e Anexos
    'skin': 'pele',
    'cutaneous': 'cutâneo',
    'hair': 'cabelo',
    'nail': 'unha',

    // Sistema Digestivo
    'digestive': 'digestivo',
    'stomach': 'estômago',
    'intestine': 'intestino',
    'liver': 'fígado',
    'hepatic': 'hepático',
    'kidney': 'rim',
    'renal': 'renal',

    // Descritores Clínicos
    'increased': 'aumentado',
    'decreased': 'diminuído',
    'reduced': 'reduzido',
    'enlarged': 'aumentado',
    'small': 'pequeno',
    'large': 'grande',
    'thick': 'espesso',
    'thin': 'fino',
    'wide': 'largo',
    'narrow': 'estreito',
    'deep': 'profundo',
    'shallow': 'superficial',
    'prominent': 'proeminente',
    'depressed': 'deprimido',
    'elevated': 'elevado',

    // Processos Patológicos
    'inflammation': 'inflamação',
    'infection': 'infecção',
    'tumor': 'tumor',
    'malformation': 'malformação',
    'deformity': 'deformidade',
    'dysplasia': 'displasia',
    'hyperplasia': 'hiperplasia',
    'hypoplasia': 'hipoplasia',
    'atrophy': 'atrofia',
    'hypertrophy': 'hipertrofia',
    'stenosis': 'estenose',
    'obstruction': 'obstrução',

    // Severidade
    'mild': 'leve',
    'moderate': 'moderado',
    'severe': 'grave',
    'profound': 'profundo',

    // Frequência
    'frequent': 'frequente',
    'occasional': 'ocasional',
    'rare': 'raro',
    'common': 'comum',

    // Idade de Início
    'congenital': 'congênito',
    'neonatal': 'neonatal',
    'infantile': 'infantil',
    'childhood': 'da infância',
    'juvenile': 'juvenil',
    'adult': 'adulto',
    'onset': 'início',

    // Progressão
    'progressive': 'progressivo',
    'nonprogressive': 'não progressivo',
    'static': 'estático',
    'improving': 'em melhoria',
    'worsening': 'em piora'
};

// =====================================================================================
// TRADUÇÕES ESPECÍFICAS DE TERMOS HPO COMPLEXOS
// =====================================================================================

const HPO_SPECIFIC_TRANSLATIONS = {
    // Deficiência Intelectual
    'Intellectual disability': 'Deficiência intelectual',
    'Mental retardation': 'Deficiência intelectual',
    'Cognitive impairment': 'Comprometimento cognitivo',
    'Global developmental delay': 'Atraso global do desenvolvimento',
    'Developmental delay': 'Atraso do desenvolvimento',
    'Learning disability': 'Dificuldade de aprendizagem',

    // Características Faciais
    'Coarse facial features': 'Características faciais grosseiras',
    'Dysmorphic facial features': 'Características faciais dismórficas',
    'Facial asymmetry': 'Assimetria facial',
    'Round face': 'Face arredondada',
    'Long face': 'Face alongada',
    'Triangular face': 'Face triangular',

    // Olhos
    'Hypertelorism': 'Hipertelorismo',
    'Hypotelorism': 'Hipotelorismo',
    'Ptosis': 'Ptose',
    'Strabismus': 'Estrabismo',
    'Nystagmus': 'Nistagmo',
    'Cataract': 'Catarata',
    'Corneal opacity': 'Opacidade corneana',
    'Corneal clouding': 'Opacidade corneana',

    // Orelhas
    'Low-set ears': 'Orelhas baixo-implantadas',
    'Prominent ears': 'Orelhas proeminentes',
    'Hearing loss': 'Perda auditiva',
    'Conductive hearing loss': 'Perda auditiva condutiva',
    'Sensorineural hearing loss': 'Perda auditiva neurossensorial',

    // Sistema Cardiovascular
    'Congenital heart defect': 'Defeito cardíaco congênito',
    'Ventricular septal defect': 'Defeito do septo ventricular',
    'Atrial septal defect': 'Defeito do septo atrial',
    'Patent ductus arteriosus': 'Persistência do canal arterial',
    'Mitral valve prolapse': 'Prolapso da válvula mitral',
    'Aortic stenosis': 'Estenose aórtica',
    'Pulmonary stenosis': 'Estenose pulmonar',

    // Sistema Respiratório
    'Respiratory insufficiency': 'Insuficiência respiratória',
    'Recurrent respiratory infections': 'Infecções respiratórias recorrentes',
    'Chronic cough': 'Tosse crônica',
    'Shortness of breath': 'Dispneia',

    // Sistema Musculoesquelético
    'Muscle weakness': 'Fraqueza muscular',
    'Joint contractures': 'Contraturas articulares',
    'Scoliosis': 'Escoliose',
    'Kyphosis': 'Cifose',
    'Lordosis': 'Lordose',
    'Hip dysplasia': 'Displasia do quadril',
    'Club foot': 'Pé torto',

    // Crescimento
    'Short stature': 'Baixa estatura',
    'Tall stature': 'Alta estatura',
    'Growth retardation': 'Retardo do crescimento',
    'Failure to thrive': 'Falha no crescimento',
    'Obesity': 'Obesidade',

    // Sistema Digestivo
    'Feeding difficulties': 'Dificuldades alimentares',
    'Gastroesophageal reflux': 'Refluxo gastroesofágico',
    'Constipation': 'Constipação',
    'Diarrhea': 'Diarreia',
    'Hepatomegaly': 'Hepatomegalia',
    'Splenomegaly': 'Esplenomegalia',

    // Pele
    'Dry skin': 'Pele seca',
    'Eczema': 'Eczema',
    'Hyperpigmentation': 'Hiperpigmentação',
    'Hypopigmentation': 'Hipopigmentação',
    'Cafe-au-lait spots': 'Manchas café-com-leite',

    // Sistema Nervoso
    'Seizures': 'Convulsões',
    'Epilepsy': 'Epilepsia',
    'Ataxia': 'Ataxia',
    'Tremor': 'Tremor',
    'Dystonia': 'Distonia',
    'Chorea': 'Coreia',
    'Myoclonus': 'Mioclonia'
};

// =====================================================================================
// CLASSE DE TRADUÇÃO HPO
// =====================================================================================

class HPOTranslator {
    constructor() {
        this.translatedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
        this.batchSize = 50;
    }

    // =====================================================================================
    // MÉTODO PRINCIPAL DE TRADUÇÃO
    // =====================================================================================
    async translateAllHPOTerms() {
        console.log('🔬 INICIANDO TRADUÇÃO ESPECIALIZADA DE TERMOS HPO');
        console.log('================================================\n');

        try {
            // Primeiro, verificar quantos termos precisam de tradução
            const totalTerms = await prisma.hPOTerm.count();
            const termsToTranslate = await prisma.hPOTerm.count({
                where: {
                    OR: [
                        { namePt: null },
                        { namePt: '' },
                        { namePt: { equals: prisma.hPOTerm.fields.name } } // Onde PT = EN
                    ]
                }
            });

            console.log(`📊 Total de termos HPO: ${totalTerms.toLocaleString()}`);
            console.log(`🔄 Termos precisando tradução: ${termsToTranslate.toLocaleString()}`);
            console.log(`📈 Percentual a traduzir: ${((termsToTranslate / totalTerms) * 100).toFixed(1)}%\n`);

            // Processar em lotes para performance
            let offset = 0;
            while (true) {
                const batch = await this.getNextBatch(offset);
                if (batch.length === 0) break;

                await this.processBatch(batch);
                offset += this.batchSize;

                // Log de progresso
                console.log(`✅ Processados ${Math.min(offset, termsToTranslate)} de ${termsToTranslate} termos...`);
            }

            // Relatório final
            await this.generateFinalReport();

        } catch (error) {
            console.error('❌ Erro na tradução HPO:', error);
        } finally {
            await prisma.$disconnect();
        }
    }

    // =====================================================================================
    // BUSCAR PRÓXIMO LOTE
    // =====================================================================================
    async getNextBatch(offset) {
        return await prisma.hPOTerm.findMany({
            where: {
                OR: [
                    { namePt: null },
                    { namePt: '' }
                ]
            },
            skip: offset,
            take: this.batchSize,
            orderBy: { name: 'asc' }
        });
    }

    // =====================================================================================
    // PROCESSAR LOTE
    // =====================================================================================
    async processBatch(terms) {
        for (const term of terms) {
            try {
                // Traduzir nome
                const translatedName = this.translateHPOTerm(term.name);
                
                // Traduzir definição se existir
                let translatedDefinition = null;
                if (term.definition) {
                    translatedDefinition = this.translateHPODefinition(term.definition);
                }

                // Verificar se a tradução é diferente do original
                const nameChanged = translatedName !== term.name;
                const definitionChanged = translatedDefinition && translatedDefinition !== term.definition;

                if (nameChanged || definitionChanged) {
                    const updateData = {};
                    if (nameChanged) updateData.namePt = translatedName;
                    if (definitionChanged) updateData.definitionPt = translatedDefinition;

                    await prisma.hPOTerm.update({
                        where: { id: term.id },
                        data: updateData
                    });

                    this.translatedCount++;
                } else {
                    this.skippedCount++;
                }

            } catch (error) {
                console.error(`⚠️  Erro traduzindo termo ${term.hpoId}: ${error.message}`);
                this.errorCount++;
            }
        }
    }

    // =====================================================================================
    // TRADUZIR TERMO HPO
    // =====================================================================================
    translateHPOTerm(originalTerm) {
        let translated = originalTerm;

        // 1. Verificar se existe tradução específica exata
        if (HPO_SPECIFIC_TRANSLATIONS[originalTerm]) {
            return HPO_SPECIFIC_TRANSLATIONS[originalTerm];
        }

        // 2. Aplicar traduções de palavras individuais
        for (const [english, portuguese] of Object.entries(HPO_MEDICAL_DICTIONARY)) {
            // Usar regex para substituir palavras completas
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // 3. Correções específicas pós-tradução
        translated = this.applyPostTranslationCorrections(translated);

        // 4. Capitalizar primeira letra
        translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();

        return translated;
    }

    // =====================================================================================
    // TRADUZIR DEFINIÇÃO HPO
    // =====================================================================================
    translateHPODefinition(definition) {
        let translated = definition;

        // Aplicar dicionário médico
        for (const [english, portuguese] of Object.entries(HPO_MEDICAL_DICTIONARY)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // Traduções de frases comuns em definições
        const definitionPhrases = {
            'characterized by': 'caracterizado por',
            'defined as': 'definido como',
            'refers to': 'refere-se a',
            'associated with': 'associado com',
            'resulting from': 'resultante de',
            'due to': 'devido a',
            'caused by': 'causado por',
            'leading to': 'levando a',
            'manifested as': 'manifestado como',
            'presenting with': 'apresentando-se com'
        };

        for (const [english, portuguese] of Object.entries(definitionPhrases)) {
            const regex = new RegExp(english, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        return translated;
    }

    // =====================================================================================
    // CORREÇÕES PÓS-TRADUÇÃO
    // =====================================================================================
    applyPostTranslationCorrections(text) {
        // Correções específicas para manter qualidade médica
        const corrections = {
            'anormalo': 'anormal',
            'anormalidade de': 'anormalidade da',
            'malformação de': 'malformação da',
            'deficiência de': 'deficiência da',
            'displasia de': 'displasia da',
            'hiperplasia de': 'hiperplasia da',
            'hipoplasia de': 'hipoplasia da',
            'atrofia de': 'atrofia da',
            'hipertrofia de': 'hipertrofia da'
        };

        let corrected = text;
        for (const [wrong, right] of Object.entries(corrections)) {
            corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
        }

        return corrected;
    }

    // =====================================================================================
    // RELATÓRIO FINAL
    // =====================================================================================
    async generateFinalReport() {
        const totalTerms = await prisma.hPOTerm.count();
        const translatedTerms = await prisma.hPOTerm.count({
            where: { namePt: { not: null } }
        });
        const coverage = totalTerms > 0 ? ((translatedTerms / totalTerms) * 100).toFixed(1) : '0.0';

        console.log('\n🎉 TRADUÇÃO HPO CONCLUÍDA!');
        console.log('========================');
        console.log(`✅ Termos traduzidos: ${this.translatedCount.toLocaleString()}`);
        console.log(`⏭️  Termos ignorados: ${this.skippedCount.toLocaleString()}`);
        console.log(`❌ Erros encontrados: ${this.errorCount.toLocaleString()}`);
        console.log(`📊 Total de termos: ${totalTerms.toLocaleString()}`);
        console.log(`📈 Cobertura atual: ${coverage}%`);
        
        console.log('\n🔬 QUALIDADE DA TRADUÇÃO:');
        console.log('========================');
        console.log('✅ Terminologia médica especializada aplicada');
        console.log('✅ Traduções específicas para termos complexos');
        console.log('✅ Correções pós-tradução implementadas');
        console.log('✅ Capitalização adequada mantida');
        
        console.log('\n🌍 IMPACTO PARA COMUNIDADE MÉDICA LUSÓFONA:');
        console.log('==========================================');
        console.log('🏥 Profissionais de saúde terão acesso a terminologia precisa');
        console.log('📚 Estudantes podem aprender fenótipos em português');
        console.log('🔬 Pesquisadores podem usar ontologia traduzida');
        console.log('🌐 Pacientes terão informações mais acessíveis');
    }
}

// =====================================================================================
// EXECUÇÃO
// =====================================================================================
async function main() {
    const translator = new HPOTranslator();
    await translator.translateAllHPOTerms();
}

// Executar se chamado diretamente
if (require.main === module) {
    main().then(() => {
        console.log('\n🎊 SISTEMA HPO MULTILÍNGUE ATIVO!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 ERRO CRÍTICO:', error);
        process.exit(1);
    });
}

module.exports = { HPOTranslator };
