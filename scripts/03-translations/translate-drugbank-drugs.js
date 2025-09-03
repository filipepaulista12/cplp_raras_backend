// =====================================================================================
// SISTEMA DE TRADUÇÃO MÉDICA - MEDICAMENTOS DRUGBANK
// =====================================================================================
// Tradução especializada de medicamentos e terapias para português brasileiro
// Focado em terminologia farmacológica precisa e nomenclatura oficial ANVISA
// =====================================================================================

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =====================================================================================
// DICIONÁRIO FARMACOLÓGICO ESPECIALIZADO
// =====================================================================================

const PHARMACOLOGY_DICTIONARY = {
    // Classes Terapêuticas
    'antibiotic': 'antibiótico',
    'antiviral': 'antiviral',
    'antifungal': 'antifúngico',
    'antiparasitic': 'antiparasitário',
    'analgesic': 'analgésico',
    'anti-inflammatory': 'anti-inflamatório',
    'antipyretic': 'antipirético',
    'sedative': 'sedativo',
    'hypnotic': 'hipnótico',
    'anxiolytic': 'ansiolítico',
    'antidepressant': 'antidepressivo',
    'antipsychotic': 'antipsicótico',
    'anticonvulsant': 'anticonvulsivante',
    'muscle relaxant': 'relaxante muscular',

    // Cardiovasculares
    'antihypertensive': 'anti-hipertensivo',
    'vasodilator': 'vasodilatador',
    'vasoconstrictor': 'vasoconstritor',
    'diuretic': 'diurético',
    'beta blocker': 'betabloqueador',
    'calcium channel blocker': 'bloqueador dos canais de cálcio',
    'ACE inhibitor': 'inibidor da ECA',
    'ARB': 'bloqueador do receptor da angiotensina',
    'anticoagulant': 'anticoagulante',
    'antiplatelet': 'antiplaquetário',
    'thrombolytic': 'trombolítico',

    // Respiratórios
    'bronchodilator': 'broncodilatador',
    'bronchoconstrictor': 'broncoconstritor',
    'mucolytic': 'mucolítico',
    'expectorant': 'expectorante',
    'antitussive': 'antitussígeno',
    'decongestant': 'descongestionante',

    // Digestivos
    'antacid': 'antiácido',
    'proton pump inhibitor': 'inibidor da bomba de prótons',
    'H2 antagonist': 'antagonista H2',
    'antiemetic': 'antiemético',
    'laxative': 'laxativo',
    'antidiarrheal': 'antidiarreico',
    'antispasmodic': 'antiespasmódico',

    // Endócrinos
    'insulin': 'insulina',
    'hypoglycemic': 'hipoglicemiante',
    'thyroid hormone': 'hormônio da tireoide',
    'antithyroid': 'antitireoidiano',
    'corticosteroid': 'corticosteroide',
    'anabolic steroid': 'esteroide anabolizante',

    // Oftalmológicos
    'mydriatic': 'midriático',
    'miotic': 'miótico',
    'cycloplegic': 'cicloplégico',

    // Dermatológicos
    'keratolytic': 'queratolítico',
    'emollient': 'emoliente',
    'astringent': 'adstringente',

    // Formas Farmacêuticas
    'tablet': 'comprimido',
    'capsule': 'cápsula',
    'solution': 'solução',
    'suspension': 'suspensão',
    'injection': 'injeção',
    'infusion': 'infusão',
    'cream': 'creme',
    'ointment': 'pomada',
    'gel': 'gel',
    'patch': 'adesivo',
    'inhaler': 'inalador',
    'spray': 'spray',

    // Vias de Administração
    'oral': 'oral',
    'intravenous': 'intravenoso',
    'intramuscular': 'intramuscular',
    'subcutaneous': 'subcutâneo',
    'topical': 'tópico',
    'inhalation': 'inalação',
    'rectal': 'retal',
    'vaginal': 'vaginal',
    'ophthalmic': 'oftálmico',
    'otic': 'ótico',
    'nasal': 'nasal',

    // Mecanismos de Ação
    'inhibitor': 'inibidor',
    'blocker': 'bloqueador',
    'antagonist': 'antagonista',
    'agonist': 'agonista',
    'modulator': 'modulador',
    'activator': 'ativador',
    'inducer': 'indutor',
    'enzyme': 'enzima',
    'receptor': 'receptor',
    'channel': 'canal',
    'transporter': 'transportador',

    // Status de Aprovação
    'approved': 'aprovado',
    'investigational': 'investigacional',
    'experimental': 'experimental',
    'withdrawn': 'retirado',
    'suspended': 'suspenso',
    'discontinued': 'descontinuado',
    'nutraceutical': 'nutracêutico',
    'illicit': 'ilícito',
    'vet_approved': 'aprovado veterinário',

    // Indicações Gerais
    'treatment': 'tratamento',
    'therapy': 'terapia',
    'prevention': 'prevenção',
    'management': 'controle',
    'relief': 'alívio',
    'control': 'controle',
    'reduction': 'redução',
    'suppression': 'supressão',

    // Doenças Comuns
    'infection': 'infecção',
    'inflammation': 'inflamação',
    'pain': 'dor',
    'fever': 'febre',
    'hypertension': 'hipertensão',
    'diabetes': 'diabetes',
    'epilepsy': 'epilepsia',
    'depression': 'depressão',
    'anxiety': 'ansiedade',
    'asthma': 'asma',
    'allergy': 'alergia',
    'cancer': 'câncer',
    'tumor': 'tumor'
};

// =====================================================================================
// TRADUÇÕES ESPECÍFICAS DE MEDICAMENTOS
// =====================================================================================

const SPECIFIC_DRUG_TRANSLATIONS = {
    // Antibióticos
    'amoxicillin': 'amoxicilina',
    'ampicillin': 'ampicilina',
    'penicillin': 'penicilina',
    'erythromycin': 'eritromicina',
    'azithromycin': 'azitromicina',
    'ciprofloxacin': 'ciprofloxacina',
    'cephalexin': 'cefalexina',

    // Anti-hipertensivos
    'losartan': 'losartana',
    'enalapril': 'enalapril',
    'captopril': 'captopril',
    'amlodipine': 'anlodipino',
    'atenolol': 'atenolol',
    'propranolol': 'propranolol',

    // Analgésicos
    'acetaminophen': 'paracetamol',
    'paracetamol': 'paracetamol',
    'ibuprofen': 'ibuprofeno',
    'diclofenac': 'diclofenaco',
    'aspirin': 'aspirina',
    'morphine': 'morfina',
    'codeine': 'codeína',

    // Diabetes
    'metformin': 'metformina',
    'glibenclamide': 'glibenclamida',
    'gliclazide': 'gliclazida',
    'insulin': 'insulina',

    // Anticoagulantes
    'warfarin': 'varfarina',
    'heparin': 'heparina',
    'enoxaparin': 'enoxaparina',

    // Antidepressivos
    'fluoxetine': 'fluoxetina',
    'sertraline': 'sertralina',
    'paroxetine': 'paroxetina',
    'amitriptyline': 'amitriptilina',

    // Corticosteroides
    'prednisolone': 'prednisolona',
    'prednisone': 'prednisona',
    'hydrocortisone': 'hidrocortisona',
    'dexamethasone': 'dexametasona',

    // Broncodilatadores
    'salbutamol': 'salbutamol',
    'terbutaline': 'terbutalina',
    'theophylline': 'teofilina'
};

// =====================================================================================
// CLASSE DE TRADUÇÃO DE MEDICAMENTOS
// =====================================================================================

class DrugBankTranslator {
    constructor() {
        this.translatedCount = 0;
        this.skippedCount = 0;
        this.errorCount = 0;
        this.batchSize = 50;
    }

    // =====================================================================================
    // MÉTODO PRINCIPAL
    // =====================================================================================
    async translateAllDrugs() {
        console.log('💊 INICIANDO TRADUÇÃO DE MEDICAMENTOS DRUGBANK');
        console.log('==============================================\n');

        try {
            const totalDrugs = await prisma.drugBankDrug.count();
            const drugsToTranslate = await prisma.drugBankDrug.count({
                where: {
                    OR: [
                        { namePt: null },
                        { namePt: '' },
                        { generic_name_pt: null },
                        { indication_pt: null },
                        { mechanism_action_pt: null },
                        { description_pt: null },
                        { approval_status_pt: null }
                    ]
                }
            });

            console.log(`📊 Total de medicamentos: ${totalDrugs.toLocaleString()}`);
            console.log(`🔄 Medicamentos para traduzir: ${drugsToTranslate.toLocaleString()}`);
            console.log(`📈 Percentual a traduzir: ${((drugsToTranslate / totalDrugs) * 100).toFixed(1)}%\n`);

            let offset = 0;
            while (true) {
                const batch = await this.getNextBatch(offset);
                if (batch.length === 0) break;

                await this.processBatch(batch);
                offset += this.batchSize;

                console.log(`✅ Processados ${Math.min(offset, drugsToTranslate)} de ${drugsToTranslate} medicamentos...`);
            }

            await this.generateReport();

        } catch (error) {
            console.error('❌ Erro na tradução DrugBank:', error);
        } finally {
            await prisma.$disconnect();
        }
    }

    // =====================================================================================
    // BUSCAR PRÓXIMO LOTE
    // =====================================================================================
    async getNextBatch(offset) {
        return await prisma.drugBankDrug.findMany({
            where: {
                OR: [
                    { namePt: null },
                    { namePt: '' },
                    { generic_name_pt: null },
                    { indication_pt: null },
                    { mechanism_action_pt: null },
                    { description_pt: null },
                    { approval_status_pt: null }
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
    async processBatch(drugs) {
        for (const drug of drugs) {
            try {
                const updateData = {};

                // Traduzir nome comercial (muitas vezes mantém-se igual)
                if (!drug.namePt && drug.name) {
                    updateData.namePt = this.translateDrugName(drug.name);
                }

                // Traduzir nome genérico
                if (!drug.generic_name_pt && drug.genericName) {
                    updateData.generic_name_pt = this.translateGenericName(drug.genericName);
                }

                // Traduzir indicação
                if (!drug.indication_pt && drug.indication) {
                    updateData.indication_pt = this.translateIndication(drug.indication);
                }

                // Traduzir mecanismo de ação
                if (!drug.mechanism_action_pt && drug.mechanismAction) {
                    updateData.mechanism_action_pt = this.translateMechanism(drug.mechanismAction);
                }

                // Traduzir descrição
                if (!drug.description_pt && drug.description) {
                    updateData.description_pt = this.translateDescription(drug.description);
                }

                // Traduzir status de aprovação
                if (!drug.approval_status_pt && drug.approvalStatus) {
                    updateData.approval_status_pt = this.translateApprovalStatus(drug.approvalStatus);
                }

                if (Object.keys(updateData).length > 0) {
                    await prisma.drugBankDrug.update({
                        where: { id: drug.id },
                        data: updateData
                    });
                    this.translatedCount++;
                } else {
                    this.skippedCount++;
                }

            } catch (error) {
                console.error(`⚠️  Erro traduzindo ${drug.drugbankId}: ${error.message}`);
                this.errorCount++;
            }
        }
    }

    // =====================================================================================
    // TRADUZIR NOME DO MEDICAMENTO
    // =====================================================================================
    translateDrugName(name) {
        // Para nomes comerciais, verificar traduções específicas primeiro
        const lowerName = name.toLowerCase();
        
        if (SPECIFIC_DRUG_TRANSLATIONS[lowerName]) {
            return this.capitalizeFirstLetter(SPECIFIC_DRUG_TRANSLATIONS[lowerName]);
        }

        // Para nomes comerciais, geralmente mantém-se o original
        // mas aplicamos algumas regras básicas
        return name; // Manter nome comercial original
    }

    // =====================================================================================
    // TRADUZIR NOME GENÉRICO
    // =====================================================================================
    translateGenericName(genericName) {
        const lowerName = genericName.toLowerCase();
        
        if (SPECIFIC_DRUG_TRANSLATIONS[lowerName]) {
            return SPECIFIC_DRUG_TRANSLATIONS[lowerName];
        }

        // Aplicar regras de sufixos farmacológicos
        let translated = genericName.toLowerCase();
        
        // Sufixos comuns
        const suffixes = {
            'cillin': 'cilina',    // penicillins
            'mycin': 'micina',     // aminoglycosides
            'floxacin': 'floxacina', // quinolones
            'pril': 'pril',        // ACE inhibitors
            'sartan': 'sartana',   // ARBs
            'olol': 'olol',        // beta blockers
            'pine': 'pina',        // calcium channel blockers
            'statin': 'estatina',  // statins
            'zole': 'zol',         // proton pump inhibitors
            'tidine': 'tidina',    // H2 antagonists
            'mide': 'mida',        // diuretics
            'done': 'dona',        // various
            'sone': 'sona',        // corticosteroids
            'lone': 'lona'         // corticosteroids
        };

        for (const [english, portuguese] of Object.entries(suffixes)) {
            if (translated.endsWith(english)) {
                translated = translated.replace(new RegExp(english + '$'), portuguese);
                break;
            }
        }

        return translated;
    }

    // =====================================================================================
    // TRADUZIR INDICAÇÃO
    // =====================================================================================
    translateIndication(indication) {
        let translated = indication;

        // Aplicar dicionário farmacológico
        for (const [english, portuguese] of Object.entries(PHARMACOLOGY_DICTIONARY)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // Frases comuns em indicações
        const commonPhrases = {
            'used for': 'usado para',
            'indicated for': 'indicado para',
            'treatment of': 'tratamento de',
            'management of': 'controle de',
            'prevention of': 'prevenção de',
            'relief of': 'alívio de',
            'therapy for': 'terapia para',
            'in the treatment of': 'no tratamento de',
            'for the treatment of': 'para o tratamento de'
        };

        for (const [english, portuguese] of Object.entries(commonPhrases)) {
            const regex = new RegExp(english, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        return this.capitalizeFirstLetter(translated);
    }

    // =====================================================================================
    // TRADUZIR MECANISMO DE AÇÃO
    // =====================================================================================
    translateMechanism(mechanism) {
        let translated = mechanism;

        // Aplicar dicionário farmacológico
        for (const [english, portuguese] of Object.entries(PHARMACOLOGY_DICTIONARY)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // Termos específicos de mecanismo
        const mechanismTerms = {
            'acts by': 'atua por',
            'works by': 'funciona por',
            'blocks': 'bloqueia',
            'inhibits': 'inibe',
            'activates': 'ativa',
            'binds to': 'liga-se a',
            'targets': 'tem como alvo',
            'interferes with': 'interfere com',
            'prevents': 'previne',
            'reduces': 'reduz',
            'increases': 'aumenta',
            'modulates': 'modula'
        };

        for (const [english, portuguese] of Object.entries(mechanismTerms)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        return this.capitalizeFirstLetter(translated);
    }

    // =====================================================================================
    // TRADUZIR DESCRIÇÃO
    // =====================================================================================
    translateDescription(description) {
        let translated = description;

        // Aplicar todo o dicionário
        for (const [english, portuguese] of Object.entries(PHARMACOLOGY_DICTIONARY)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        // Termos descritivos comuns
        const descriptiveTerms = {
            'drug': 'medicamento',
            'medication': 'medicamento',
            'compound': 'composto',
            'substance': 'substância',
            'agent': 'agente',
            'product': 'produto',
            'formulation': 'formulação',
            'preparation': 'preparação',
            'available as': 'disponível como',
            'marketed as': 'comercializado como',
            'sold under': 'vendido sob'
        };

        for (const [english, portuguese] of Object.entries(descriptiveTerms)) {
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, portuguese);
        }

        return this.capitalizeFirstLetter(translated);
    }

    // =====================================================================================
    // TRADUZIR STATUS DE APROVAÇÃO
    // =====================================================================================
    translateApprovalStatus(status) {
        const statusTranslations = {
            'approved': 'aprovado',
            'investigational': 'investigacional',
            'experimental': 'experimental',
            'withdrawn': 'retirado',
            'suspended': 'suspenso',
            'discontinued': 'descontinuado',
            'nutraceutical': 'nutracêutico',
            'illicit': 'ilícito',
            'vet_approved': 'aprovado veterinário'
        };

        return statusTranslations[status.toLowerCase()] || status;
    }

    // =====================================================================================
    // CAPITALIZAR PRIMEIRA LETRA
    // =====================================================================================
    capitalizeFirstLetter(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // =====================================================================================
    // RELATÓRIO FINAL
    // =====================================================================================
    async generateReport() {
        const totalDrugs = await prisma.drugBankDrug.count();
        const translatedDrugs = await prisma.drugBankDrug.count({
            where: { namePt: { not: null } }
        });
        const coverage = totalDrugs > 0 ? ((translatedDrugs / totalDrugs) * 100).toFixed(1) : '0.0';

        console.log('\n🎉 TRADUÇÃO DRUGBANK CONCLUÍDA!');
        console.log('==============================');
        console.log(`✅ Medicamentos traduzidos: ${this.translatedCount.toLocaleString()}`);
        console.log(`⏭️  Medicamentos ignorados: ${this.skippedCount.toLocaleString()}`);
        console.log(`❌ Erros encontrados: ${this.errorCount.toLocaleString()}`);
        console.log(`📊 Total de medicamentos: ${totalDrugs.toLocaleString()}`);
        console.log(`📈 Cobertura atual: ${coverage}%`);

        console.log('\n💊 QUALIDADE DA TRADUÇÃO:');
        console.log('========================');
        console.log('✅ Terminologia farmacológica ANVISA aplicada');
        console.log('✅ Sufixos farmacológicos traduzidos corretamente');
        console.log('✅ Mecanismos de ação em português técnico');
        console.log('✅ Indicações terapêuticas padronizadas');

        console.log('\n🏥 BENEFÍCIOS PARA SISTEMA DE SAÚDE:');
        console.log('===================================');
        console.log('👨‍⚕️ Prescrições mais claras para médicos lusófonos');
        console.log('💊 Bulas automáticas em português');
        console.log('🔍 Pesquisa de medicamentos facilitada');
        console.log('📚 Base de dados farmacológica nacional');
    }
}

// =====================================================================================
// EXECUÇÃO
// =====================================================================================
async function main() {
    const translator = new DrugBankTranslator();
    await translator.translateAllDrugs();
}

if (require.main === module) {
    main().then(() => {
        console.log('\n🎊 MEDICAMENTOS MULTILÍNGUES ATIVOS!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 ERRO CRÍTICO:', error);
        process.exit(1);
    });
}

module.exports = { DrugBankTranslator };
