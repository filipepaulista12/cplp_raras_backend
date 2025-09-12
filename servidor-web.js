/**
 * SERVIDOR WEB - INTERFACE DE NAVEGAÇÃO DOS DADOS
 * ===============================================
 * Interface web simples para explorar os dados das Etapas 1 e 2
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Configurar EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Página inicial
app.get('/', async (req, res) => {
    try {
        // Contar registros de cada tabela
        const stats = {
            ensembl_genes: await contarRegistros('ensembl_genes'),
            uniprot_proteins: await contarRegistros('uniprot_proteins'),
            gene_expression_data: await contarRegistros('gene_expression_data'),
            ema_medicines: await contarRegistros('ema_medicines'),
            eu_clinical_trials: await contarRegistros('eu_clinical_trials'),
            who_health_data: await contarRegistros('who_health_data'),
            // Fase 1
            rare_diseases: await contarRegistros('rare_diseases'),
            omim_entries: await contarRegistros('omim_entries'),
            clinvar_variants: await contarRegistros('clinvar_variants'),
            hpo_terms: await contarRegistros('hpo_terms')
        };

        const totalEtapas = stats.ensembl_genes + stats.uniprot_proteins + stats.gene_expression_data + 
                           stats.ema_medicines + stats.eu_clinical_trials + stats.who_health_data;

        const totalGeral = Object.values(stats).reduce((sum, count) => sum + count, 0);

        res.render('index', { stats, totalEtapas, totalGeral });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página Ensembl Genes
app.get('/ensembl-genes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const genes = await prisma.$queryRawUnsafe(`
            SELECT ensembl_id, gene_symbol, gene_name, chromosome, biotype, protein_coding
            FROM ensembl_genes 
            ORDER BY ensembl_id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('ensembl_genes');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const biotipos = await prisma.$queryRaw`
            SELECT biotype, COUNT(*) as count 
            FROM ensembl_genes 
            GROUP BY biotype 
            ORDER BY count DESC 
            LIMIT 10
        `;

        const cromossomos = await prisma.$queryRaw`
            SELECT chromosome, COUNT(*) as count 
            FROM ensembl_genes 
            GROUP BY chromosome 
            ORDER BY chromosome
        `;

        res.render('ensembl-genes', { 
            genes, 
            biotipos, 
            cromossomos, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página UniProt Proteins
app.get('/uniprot-proteins', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const proteins = await prisma.$queryRawUnsafe(`
            SELECT uniprot_id, protein_name, gene_symbol, protein_length, 
                   subcellular_location, reviewed
            FROM uniprot_proteins 
            ORDER BY uniprot_id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('uniprot_proteins');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const locations = await prisma.$queryRaw`
            SELECT subcellular_location, COUNT(*) as count 
            FROM uniprot_proteins 
            GROUP BY subcellular_location 
            ORDER BY count DESC
        `;

        const reviewed = await prisma.$queryRaw`
            SELECT reviewed, COUNT(*) as count 
            FROM uniprot_proteins 
            GROUP BY reviewed
        `;

        res.render('uniprot-proteins', { 
            proteins, 
            locations, 
            reviewed, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página Gene Expression
app.get('/gene-expression', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const expressions = await prisma.$queryRawUnsafe(`
            SELECT gene_symbol, tissue_type, cell_type, expression_level, 
                   fold_change, experiment_id
            FROM gene_expression_data 
            ORDER BY expression_level DESC 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('gene_expression_data');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const tecidos = await prisma.$queryRaw`
            SELECT tissue_type, COUNT(*) as count 
            FROM gene_expression_data 
            GROUP BY tissue_type 
            ORDER BY count DESC 
            LIMIT 10
        `;

        const topExpressed = await prisma.$queryRaw`
            SELECT gene_symbol, tissue_type, expression_level
            FROM gene_expression_data 
            ORDER BY expression_level DESC 
            LIMIT 10
        `;

        res.render('gene-expression', { 
            expressions, 
            tecidos, 
            topExpressed, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página EMA Medicines
app.get('/ema-medicines', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const medicines = await prisma.$queryRawUnsafe(`
            SELECT medicine_name, therapeutic_area, orphan_designation, 
                   marketing_status, authorization_date, marketing_holder
            FROM ema_medicines 
            ORDER BY authorization_date DESC 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('ema_medicines');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const areas = await prisma.$queryRaw`
            SELECT therapeutic_area, COUNT(*) as count 
            FROM ema_medicines 
            GROUP BY therapeutic_area 
            ORDER BY count DESC
        `;

        const orphanStats = await prisma.$queryRaw`
            SELECT orphan_designation, COUNT(*) as count 
            FROM ema_medicines 
            GROUP BY orphan_designation
        `;

        res.render('ema-medicines', { 
            medicines, 
            areas, 
            orphanStats, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página EU Clinical Trials
app.get('/eu-trials', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const trials = await prisma.$queryRawUnsafe(`
            SELECT eudract_number, trial_title, trial_phase, trial_status, 
                   medical_condition, rare_disease, orphan_condition, 
                   target_enrollment, start_date
            FROM eu_clinical_trials 
            ORDER BY start_date DESC 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('eu_clinical_trials');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const fases = await prisma.$queryRaw`
            SELECT trial_phase, COUNT(*) as count 
            FROM eu_clinical_trials 
            GROUP BY trial_phase 
            ORDER BY trial_phase
        `;

        const rareStats = await prisma.$queryRaw`
            SELECT 
                SUM(CASE WHEN rare_disease = TRUE THEN 1 ELSE 0 END) as rare_count,
                SUM(CASE WHEN orphan_condition = TRUE THEN 1 ELSE 0 END) as orphan_count,
                COUNT(*) as total_count
            FROM eu_clinical_trials
        `;

        res.render('eu-trials', { 
            trials, 
            fases, 
            rareStats: rareStats[0], 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Página WHO Health Data
app.get('/who-data', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        const healthData = await prisma.$queryRawUnsafe(`
            SELECT indicator_name, country_name, year, value, unit_measure, category
            FROM who_health_data 
            ORDER BY year DESC, country_name 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('who_health_data');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const countries = await prisma.$queryRaw`
            SELECT country_name, COUNT(*) as count 
            FROM who_health_data 
            GROUP BY country_name 
            ORDER BY count DESC
        `;

        const indicators = await prisma.$queryRaw`
            SELECT indicator_name, COUNT(*) as count 
            FROM who_health_data 
            GROUP BY indicator_name 
            ORDER BY count DESC
        `;

        res.render('who-data', { 
            healthData, 
            countries, 
            indicators, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API para busca
app.get('/api/search/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const { q } = req.query;
        
        let results = [];
        
        if (table === 'ensembl_genes' && q) {
            results = await prisma.$queryRawUnsafe(`
                SELECT ensembl_id, gene_symbol, gene_name, chromosome, biotype
                FROM ensembl_genes 
                WHERE gene_symbol LIKE '%${q}%' OR gene_name LIKE '%${q}%'
                LIMIT 20
            `);
        } else if (table === 'uniprot_proteins' && q) {
            results = await prisma.$queryRawUnsafe(`
                SELECT uniprot_id, protein_name, gene_symbol
                FROM uniprot_proteins 
                WHERE protein_name LIKE '%${q}%' OR gene_symbol LIKE '%${q}%'
                LIMIT 20
            `);
        } else if (table === 'ema_medicines' && q) {
            results = await prisma.$queryRawUnsafe(`
                SELECT medicine_name, therapeutic_area, orphan_designation
                FROM ema_medicines 
                WHERE medicine_name LIKE '%${q}%' OR therapeutic_area LIKE '%${q}%'
                LIMIT 20
            `);
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Função auxiliar para contar registros
async function contarRegistros(tabela) {
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela}`);
        return Number(result[0].count);
    } catch (error) {
        return 0;
    }
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌐 SERVIDOR WEB INICIADO!`);
    console.log(`📊 Acesse: http://localhost:${PORT}`);
    console.log(`🔍 Interface de navegação dos dados disponível`);
    console.log(`⚡ Pressione Ctrl+C para parar`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Parando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});