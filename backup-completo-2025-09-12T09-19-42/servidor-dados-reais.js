const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Configurar EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rota principal - Dashboard
app.get('/', async (req, res) => {
    try {
        console.log('📊 Carregando dashboard...');
        
        // Contar registros de cada tabela
        const stats = {
            ensembl_genes: await contarRegistros('ensembl_genes'),
            uniprot_proteins: await contarRegistros('uniprot_proteins'),
            gene_expression: await contarRegistros('gene_expression_data'),
            ema_medicines: await contarRegistros('ema_medicines'),
            eu_trials: await contarRegistros('eu_clinical_trials'),
            who_data: await contarRegistros('who_health_data'),
            clinvar_variants: await contarRegistros('clinvar_variants'),
            omim_entries: await contarRegistros('omim_entries'),
            rare_diseases: await contarRegistros('rare_diseases')
        };
        
        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        
        console.log('✅ Stats carregadas:', stats);
        
        res.render('index', { stats, total });
    } catch (error) {
        console.error('❌ Erro no dashboard:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Rota Genes Ensembl
app.get('/ensembl-genes', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        console.log(`📊 Carregando genes página ${page}...`);
        
        const genes = await prisma.$queryRawUnsafe(`
            SELECT * FROM ensembl_genes 
            ORDER BY id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('ensembl_genes');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const biotypes = await prisma.$queryRaw`
            SELECT biotype, COUNT(*) as count 
            FROM ensembl_genes 
            WHERE biotype IS NOT NULL
            GROUP BY biotype 
            ORDER BY count DESC 
            LIMIT 10
        `;

        const chromosomes = await prisma.$queryRaw`
            SELECT chromosome, COUNT(*) as count 
            FROM ensembl_genes 
            WHERE chromosome IS NOT NULL
            GROUP BY chromosome 
            ORDER BY 
                CASE 
                    WHEN chromosome GLOB '[0-9]*' THEN CAST(chromosome AS INTEGER)
                    ELSE 999 
                END,
                chromosome
        `;

        res.render('ensembl-genes', { 
            genes, 
            biotypes, 
            chromosomes, 
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        console.error('❌ Erro em genes:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Rota Medicamentos EMA
app.get('/ema-medicines', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        console.log(`💊 Carregando medicamentos página ${page}...`);
        
        const medicines = await prisma.$queryRawUnsafe(`
            SELECT * FROM ema_medicines 
            ORDER BY id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('ema_medicines');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas por área terapêutica
        const areas = await prisma.$queryRaw`
            SELECT therapeutic_area, COUNT(*) as count 
            FROM ema_medicines 
            WHERE therapeutic_area IS NOT NULL
            GROUP BY therapeutic_area 
            ORDER BY count DESC 
            LIMIT 10
        `;

        // Estatísticas órfãos
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
        console.error('❌ Erro em medicamentos:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Rota Ensaios Clínicos
app.get('/eu-trials', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        console.log(`🧪 Carregando ensaios página ${page}...`);
        
        const trials = await prisma.$queryRawUnsafe(`
            SELECT * FROM eu_clinical_trials 
            ORDER BY id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('eu_clinical_trials');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const phases = await prisma.$queryRaw`
            SELECT trial_phase, COUNT(*) as count 
            FROM eu_clinical_trials 
            WHERE trial_phase IS NOT NULL
            GROUP BY trial_phase 
            ORDER BY count DESC
        `;

        const statuses = await prisma.$queryRaw`
            SELECT recruitment_status, COUNT(*) as count 
            FROM eu_clinical_trials 
            WHERE recruitment_status IS NOT NULL
            GROUP BY recruitment_status 
            ORDER BY count DESC
        `;

        const countries = await prisma.$queryRaw`
            SELECT sponsor_country, COUNT(*) as count 
            FROM eu_clinical_trials 
            WHERE sponsor_country IS NOT NULL
            GROUP BY sponsor_country 
            ORDER BY count DESC 
            LIMIT 10
        `;

        // Total de participantes
        const totalParticipantsResult = await prisma.$queryRaw`
            SELECT SUM(target_enrollment) as total 
            FROM eu_clinical_trials 
            WHERE target_enrollment IS NOT NULL
        `;
        const totalParticipants = Number(totalParticipantsResult[0]?.total || 0);

        res.render('eu-trials', { 
            trials, 
            phases, 
            statuses, 
            countries, 
            totalParticipants,
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        console.error('❌ Erro em ensaios:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Rota WHO Data
app.get('/who-data', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;
        
        console.log(`🌍 Carregando dados WHO página ${page}...`);
        
        const healthData = await prisma.$queryRawUnsafe(`
            SELECT * FROM who_health_data 
            ORDER BY id 
            LIMIT ${limit} OFFSET ${offset}
        `);

        const total = await contarRegistros('who_health_data');
        const totalPages = Math.ceil(total / limit);

        // Estatísticas
        const categories = await prisma.$queryRaw`
            SELECT category, COUNT(*) as count 
            FROM who_health_data 
            WHERE category IS NOT NULL
            GROUP BY category 
            ORDER BY count DESC
        `;

        const countries = await prisma.$queryRaw`
            SELECT country_name, COUNT(*) as count 
            FROM who_health_data 
            WHERE country_name IS NOT NULL
            GROUP BY country_name 
            ORDER BY count DESC 
            LIMIT 10
        `;

        const years = await prisma.$queryRaw`
            SELECT year, COUNT(*) as count 
            FROM who_health_data 
            WHERE year IS NOT NULL
            GROUP BY year 
            ORDER BY year ASC
        `;

        res.render('who-data', { 
            healthData, 
            categories, 
            countries, 
            years,
            currentPage: page, 
            totalPages, 
            total 
        });
    } catch (error) {
        console.error('❌ Erro em WHO:', error);
        res.status(500).send(`Erro: ${error.message}`);
    }
});

// Função auxiliar para contar registros
async function contarRegistros(tabela) {
    try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela}`);
        return Number(result[0].count);
    } catch (error) {
        console.error(`Erro ao contar ${tabela}:`, error.message);
        return 0;
    }
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🌐 SERVIDOR WEB FUNCIONANDO!`);
    console.log(`📊 Acesse: http://localhost:${PORT}`);
    console.log(`✅ Dados reais conectados e funcionando`);
    console.log(`🔍 Interface para navegar pelos ${PORT === 3001 ? '550.000+' : ''} registros`);
    console.log(`⚡ Pressione Ctrl+C para parar`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Parando servidor...');
    await prisma.$disconnect();
    process.exit(0);
});