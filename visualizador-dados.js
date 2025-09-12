/**
 * 📊 VISUALIZADOR DE DADOS CPLP RARAS - DASHBOARD INTERATIVO
 * 🎯 OBJETIVO: Explorar visualmente os dados já importados
 * 📈 META: Interface web para navegar pelos 65.293 registros
 */

const { PrismaClient } = require('@prisma/client');
const mysql = require('mysql2/promise');
const express = require('express');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ====================================================================
// 📊 ENDPOINT: DASHBOARD GERAL
// ====================================================================
app.get('/api/dashboard', async (req, res) => {
    try {
        console.log('📊 Carregando dashboard geral...');
        
        const stats = await Promise.all([
            prisma.cplpCountry.count(),
            prisma.rareDisease.count(),
            prisma.hpoTerm.count(),
            prisma.hpoDiseasAssociation.count(),
            prisma.drugbankDrug.count(),
            prisma.drugInteraction.count(),
            prisma.hpoGeneAssociation.count()
        ]);
        
        const dashboard = {
            timestamp: new Date().toISOString(),
            totais: {
                paises_cplp: stats[0],
                doencas_raras: stats[1],
                termos_hpo: stats[2],
                associacoes_hpo_doenca: stats[3],
                medicamentos: stats[4],
                interacoes_medicamentosas: stats[5],
                associacoes_hpo_gene: stats[6],
                total_geral: stats.reduce((a, b) => a + b, 0)
            },
            status: 'Operacional',
            ultima_atualizacao: '2025-09-11'
        };
        
        res.json(dashboard);
    } catch (error) {
        console.error('❌ Erro no dashboard:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 🌍 ENDPOINT: PAÍSES CPLP
// ====================================================================
app.get('/api/paises', async (req, res) => {
    try {
        const paises = await prisma.cplpCountry.findMany({
            orderBy: { name: 'asc' }
        });
        
        res.json({
            total: paises.length,
            dados: paises.map(pais => ({
                nome: pais.name,
                nome_pt: pais.name_pt,
                codigo: pais.code,
                bandeira: pais.flag_emoji,
                populacao: pais.population,
                sistema_saude: pais.health_system,
                politica_dr: pais.rare_disease_policy,
                programa_orfaos: pais.orphan_drugs_program,
                ativo: pais.is_active
            }))
        });
    } catch (error) {
        console.error('❌ Erro nos países:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 🧬 ENDPOINT: DOENÇAS RARAS
// ====================================================================
app.get('/api/doencas', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const where = search ? {
            OR: [
                { name: { contains: search } },
                { orphacode: { contains: search } },
                { definition: { contains: search } }
            ]
        } : {};
        
        const [doencas, total] = await Promise.all([
            prisma.rareDisease.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    hpo_associations: {
                        take: 3,
                        include: {
                            hpo_term: {
                                select: { hpo_id: true, name: true }
                            }
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.rareDisease.count({ where })
        ]);
        
        res.json({
            total,
            pagina: parseInt(page),
            total_paginas: Math.ceil(total / limit),
            dados: doencas.map(doenca => ({
                id: doenca.id,
                nome: doenca.name,
                orphacode: doenca.orphacode,
                definicao: doenca.definition?.substring(0, 200) + '...',
                sinonimos: doenca.synonyms,
                prevalencia: doenca.prevalence,
                heranca: doenca.inheritance,
                idade_inicio: doenca.age_onset,
                icd10: doenca.icd10_codes,
                omim: doenca.omim_codes,
                associacoes_hpo: doenca.hpo_associations.length,
                fenotipos_exemplo: doenca.hpo_associations.slice(0, 2).map(a => a.hpo_term.name)
            }))
        });
    } catch (error) {
        console.error('❌ Erro nas doenças:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 🧠 ENDPOINT: TERMOS HPO
// ====================================================================
app.get('/api/hpo', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const where = search ? {
            OR: [
                { hpo_id: { contains: search } },
                { name: { contains: search } },
                { definition: { contains: search } }
            ]
        } : {};
        
        const [termos, total] = await Promise.all([
            prisma.hpoTerm.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    disease_associations: {
                        take: 3,
                        include: {
                            disease: {
                                select: { name: true, orphacode: true }
                            }
                        }
                    }
                },
                orderBy: { hpo_id: 'asc' }
            }),
            prisma.hpoTerm.count({ where })
        ]);
        
        res.json({
            total,
            pagina: parseInt(page),
            total_paginas: Math.ceil(total / limit),
            dados: termos.map(termo => ({
                hpo_id: termo.hpo_id,
                nome: termo.name,
                definicao: termo.definition?.substring(0, 200) + '...',
                sinonimos: termo.synonyms,
                comentario: termo.comment?.substring(0, 100) + '...',
                associacoes_doencas: termo.disease_associations.length,
                doencas_exemplo: termo.disease_associations.slice(0, 2).map(a => 
                    `${a.disease.name} (ORPHA:${a.disease.orphacode})`
                )
            }))
        });
    } catch (error) {
        console.error('❌ Erro nos HPO:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 💊 ENDPOINT: MEDICAMENTOS
// ====================================================================
app.get('/api/medicamentos', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        const where = search ? {
            OR: [
                { name: { contains: search } },
                { drugbank_id: { contains: search } },
                { description: { contains: search } }
            ]
        } : {};
        
        const [medicamentos, total] = await Promise.all([
            prisma.drugbankDrug.findMany({
                where,
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    drug1_interactions: {
                        take: 3,
                        include: {
                            drug2: {
                                select: { name: true, drugbank_id: true }
                            }
                        }
                    }
                },
                orderBy: { name: 'asc' }
            }),
            prisma.drugbankDrug.count({ where })
        ]);
        
        res.json({
            total,
            pagina: parseInt(page),
            total_paginas: Math.ceil(total / limit),
            dados: medicamentos.map(med => ({
                id: med.id,
                nome: med.name,
                drugbank_id: med.drugbank_id,
                descricao: med.description?.substring(0, 200) + '...',
                cas_number: med.cas_number,
                grupos: med.groups,
                indicacao: med.indication?.substring(0, 150) + '...',
                interacoes: med.drug1_interactions.length,
                interacoes_exemplo: med.drug1_interactions.slice(0, 2).map(i => i.drug2.name)
            }))
        });
    } catch (error) {
        console.error('❌ Erro nos medicamentos:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 🔗 ENDPOINT: ASSOCIAÇÕES HPO-DOENÇA
// ====================================================================
app.get('/api/associacoes', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        
        const [associacoes, total] = await Promise.all([
            prisma.hpoDiseasAssociation.findMany({
                skip: parseInt(skip),
                take: parseInt(limit),
                include: {
                    hpo_term: {
                        select: { hpo_id: true, name: true }
                    },
                    disease: {
                        select: { name: true, orphacode: true }
                    }
                }
            }),
            prisma.hpoDiseasAssociation.count()
        ]);
        
        res.json({
            total,
            pagina: parseInt(page),
            total_paginas: Math.ceil(total / limit),
            dados: associacoes.map(assoc => ({
                id: assoc.id,
                hpo_id: assoc.hpo_term.hpo_id,
                hpo_nome: assoc.hpo_term.name,
                doenca_nome: assoc.disease.name,
                orphacode: assoc.disease.orphacode,
                evidencia: assoc.evidence,
                frequencia: assoc.frequency,
                fonte: assoc.source
            }))
        });
    } catch (error) {
        console.error('❌ Erro nas associações:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 🔍 ENDPOINT: BUSCA GLOBAL
// ====================================================================
app.get('/api/busca/:termo', async (req, res) => {
    try {
        const { termo } = req.params;
        console.log(`🔍 Busca global por: "${termo}"`);
        
        const [doencas, hpos, medicamentos] = await Promise.all([
            prisma.rareDisease.findMany({
                where: {
                    OR: [
                        { name: { contains: termo } },
                        { orphacode: { contains: termo } },
                        { definition: { contains: termo } }
                    ]
                },
                take: 10,
                select: { id: true, name: true, orphacode: true, definition: true }
            }),
            prisma.hpoTerm.findMany({
                where: {
                    OR: [
                        { hpo_id: { contains: termo } },
                        { name: { contains: termo } },
                        { definition: { contains: termo } }
                    ]
                },
                take: 10,
                select: { hpo_id: true, name: true, definition: true }
            }),
            prisma.drugbankDrug.findMany({
                where: {
                    OR: [
                        { name: { contains: termo } },
                        { drugbank_id: { contains: termo } },
                        { description: { contains: termo } }
                    ]
                },
                take: 10,
                select: { id: true, name: true, drugbank_id: true, description: true }
            })
        ]);
        
        res.json({
            termo_busca: termo,
            resultados: {
                doencas: doencas.length,
                hpo_termos: hpos.length,
                medicamentos: medicamentos.length
            },
            dados: {
                doencas: doencas,
                hpo_termos: hpos,
                medicamentos: medicamentos
            }
        });
    } catch (error) {
        console.error('❌ Erro na busca:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ====================================================================
// 📄 PÁGINA PRINCIPAL
// ====================================================================
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 CPLP Raras - Visualizador de Dados</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container { 
            max-width: 1200px; margin: 0 auto; padding: 20px;
        }
        .header {
            text-align: center; margin-bottom: 30px; color: white;
            background: rgba(0,0,0,0.1); padding: 20px; border-radius: 15px;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .stats-grid { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .stat-card {
            background: white; border-radius: 15px; padding: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center; transition: transform 0.3s;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-number { 
            font-size: 2.5em; font-weight: bold; 
            color: #667eea; margin: 10px 0;
        }
        .stat-label { 
            font-size: 1.1em; color: #666; font-weight: 500;
        }
        .search-section {
            background: white; border-radius: 15px; padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); margin-bottom: 30px;
        }
        .search-box {
            width: 100%; padding: 15px; font-size: 1.1em;
            border: 2px solid #eee; border-radius: 10px;
            margin-bottom: 15px;
        }
        .search-box:focus { outline: none; border-color: #667eea; }
        .tabs {
            display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .tab {
            padding: 12px 20px; background: #f8f9fa; border: none;
            border-radius: 8px; cursor: pointer; font-weight: 500;
            transition: all 0.3s;
        }
        .tab.active, .tab:hover { 
            background: #667eea; color: white; 
        }
        .content-area {
            background: white; border-radius: 15px; padding: 25px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1); min-height: 400px;
        }
        .loading { 
            text-align: center; padding: 50px; color: #666;
            font-size: 1.2em;
        }
        .data-table {
            width: 100%; border-collapse: collapse; margin-top: 20px;
        }
        .data-table th, .data-table td {
            padding: 12px; text-align: left; border-bottom: 1px solid #eee;
        }
        .data-table th {
            background: #f8f9fa; font-weight: 600; color: #555;
        }
        .data-table tr:hover {
            background: #f8f9fa;
        }
        .pagination {
            display: flex; justify-content: center; gap: 10px; margin-top: 20px;
        }
        .pagination button {
            padding: 8px 16px; border: 1px solid #ddd; background: white;
            border-radius: 5px; cursor: pointer;
        }
        .pagination button:hover, .pagination button.active {
            background: #667eea; color: white; border-color: #667eea;
        }
        .badge {
            display: inline-block; padding: 4px 8px; background: #e3f2fd;
            color: #1976d2; border-radius: 4px; font-size: 0.85em;
            margin: 2px;
        }
        .no-data {
            text-align: center; padding: 40px; color: #666;
        }
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            .tabs { flex-direction: column; }
            .header h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 CPLP Raras - Visualizador de Dados</h1>
            <p>🎯 Explore os dados científicos de doenças raras dos países CPLP</p>
            <p>📈 <span id="total-records">Carregando...</span> registros disponíveis</p>
        </div>

        <div class="stats-grid" id="stats-grid">
            <div class="loading">📊 Carregando estatísticas...</div>
        </div>

        <div class="search-section">
            <h3>🔍 Busca Global</h3>
            <input type="text" class="search-box" id="search-input" 
                   placeholder="Digite aqui para buscar doenças, HPO termos, medicamentos...">
            <div id="search-results"></div>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="showTab('paises')">🌍 Países CPLP</button>
            <button class="tab" onclick="showTab('doencas')">🧬 Doenças Raras</button>
            <button class="tab" onclick="showTab('hpo')">🧠 Termos HPO</button>
            <button class="tab" onclick="showTab('medicamentos')">💊 Medicamentos</button>
            <button class="tab" onclick="showTab('associacoes')">🔗 Associações</button>
        </div>

        <div class="content-area" id="content-area">
            <div class="loading">📊 Carregando dados...</div>
        </div>
    </div>

    <script>
        let currentTab = 'paises';
        let currentPage = 1;

        // Carregar dashboard ao iniciar
        async function loadDashboard() {
            try {
                const response = await fetch('/api/dashboard');
                const data = await response.json();
                
                document.getElementById('total-records').textContent = 
                    data.totais.total_geral.toLocaleString() + ' registros';
                
                const statsGrid = document.getElementById('stats-grid');
                statsGrid.innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.paises_cplp}</div>
                        <div class="stat-label">🌍 Países CPLP</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.doencas_raras.toLocaleString()}</div>
                        <div class="stat-label">🧬 Doenças Raras</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.termos_hpo.toLocaleString()}</div>
                        <div class="stat-label">🧠 Termos HPO</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.associacoes_hpo_doenca.toLocaleString()}</div>
                        <div class="stat-label">🔗 Associações HPO-Doença</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.medicamentos}</div>
                        <div class="stat-label">💊 Medicamentos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${data.totais.associacoes_hpo_gene.toLocaleString()}</div>
                        <div class="stat-label">🧬 Genes-HPO</div>
                    </div>
                \`;
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
            }
        }

        // Mostrar aba
        function showTab(tab) {
            currentTab = tab;
            currentPage = 1;
            
            // Atualizar tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            loadTabData(tab);
        }

        // Carregar dados da aba
        async function loadTabData(tab, page = 1) {
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = '<div class="loading">📊 Carregando dados...</div>';
            
            try {
                const response = await fetch(\`/api/\${tab}?page=\${page}&limit=20\`);
                const data = await response.json();
                
                let html = '';
                
                if (tab === 'paises') {
                    html = \`
                        <h3>🌍 Países CPLP (\${data.total})</h3>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Bandeira</th><th>País</th><th>População</th>
                                    <th>Sistema de Saúde</th><th>Política DR</th>
                                </tr>
                            </thead>
                            <tbody>
                                \${data.dados.map(p => \`
                                    <tr>
                                        <td>\${p.bandeira || '🏳️'}</td>
                                        <td><strong>\${p.nome}</strong><br><small>\${p.codigo}</small></td>
                                        <td>\${p.populacao || 'N/A'}</td>
                                        <td>\${p.sistema_saude || 'N/A'}</td>
                                        <td>\${p.politica_dr || 'N/A'}</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    \`;
                } else if (tab === 'doencas') {
                    html = \`
                        <h3>🧬 Doenças Raras (\${data.total.toLocaleString()})</h3>
                        <table class="data-table">
                            <thead>
                                <tr><th>Nome</th><th>Orphacode</th><th>Definição</th><th>HPO</th></tr>
                            </thead>
                            <tbody>
                                \${data.dados.map(d => \`
                                    <tr>
                                        <td><strong>\${d.nome}</strong></td>
                                        <td>ORPHA:\${d.orphacode}</td>
                                        <td>\${d.definicao || 'N/A'}</td>
                                        <td>
                                            <span class="badge">\${d.associacoes_hpo} associações</span>
                                            \${d.fenotipos_exemplo.map(f => \`<span class="badge">\${f}</span>\`).join('')}
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                        \${createPagination(data.pagina, data.total_paginas)}
                    \`;
                } else if (tab === 'hpo') {
                    html = \`
                        <h3>🧠 Termos HPO (\${data.total.toLocaleString()})</h3>
                        <table class="data-table">
                            <thead>
                                <tr><th>HPO ID</th><th>Nome</th><th>Definição</th><th>Doenças</th></tr>
                            </thead>
                            <tbody>
                                \${data.dados.map(h => \`
                                    <tr>
                                        <td><strong>\${h.hpo_id}</strong></td>
                                        <td>\${h.nome}</td>
                                        <td>\${h.definicao || 'N/A'}</td>
                                        <td>
                                            <span class="badge">\${h.associacoes_doencas} doenças</span>
                                            \${h.doencas_exemplo.map(d => \`<span class="badge">\${d}</span>\`).join('')}
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                        \${createPagination(data.pagina, data.total_paginas)}
                    \`;
                } else if (tab === 'medicamentos') {
                    html = \`
                        <h3>💊 Medicamentos (\${data.total})</h3>
                        <table class="data-table">
                            <thead>
                                <tr><th>Nome</th><th>DrugBank ID</th><th>Descrição</th><th>Interações</th></tr>
                            </thead>
                            <tbody>
                                \${data.dados.map(m => \`
                                    <tr>
                                        <td><strong>\${m.nome}</strong></td>
                                        <td>\${m.drugbank_id}</td>
                                        <td>\${m.descricao || 'N/A'}</td>
                                        <td>
                                            <span class="badge">\${m.interacoes} interações</span>
                                            \${m.interacoes_exemplo.map(i => \`<span class="badge">\${i}</span>\`).join('')}
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                        \${createPagination(data.pagina, data.total_paginas)}
                    \`;
                } else if (tab === 'associacoes') {
                    html = \`
                        <h3>🔗 Associações HPO-Doença (\${data.total.toLocaleString()})</h3>
                        <table class="data-table">
                            <thead>
                                <tr><th>HPO Termo</th><th>Doença</th><th>Evidência</th><th>Frequência</th></tr>
                            </thead>
                            <tbody>
                                \${data.dados.map(a => \`
                                    <tr>
                                        <td>
                                            <strong>\${a.hpo_id}</strong><br>
                                            <small>\${a.hpo_nome}</small>
                                        </td>
                                        <td>
                                            <strong>\${a.doenca_nome}</strong><br>
                                            <small>ORPHA:\${a.orphacode}</small>
                                        </td>
                                        <td>\${a.evidencia || 'N/A'}</td>
                                        <td>\${a.frequencia || 'N/A'}</td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                        \${createPagination(data.pagina, data.total_paginas)}
                    \`;
                }
                
                contentArea.innerHTML = html;
                
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                contentArea.innerHTML = '<div class="no-data">❌ Erro ao carregar dados</div>';
            }
        }

        // Criar paginação
        function createPagination(currentPage, totalPages) {
            if (totalPages <= 1) return '';
            
            let html = '<div class="pagination">';
            
            if (currentPage > 1) {
                html += \`<button onclick="loadTabData('\${currentTab}', \${currentPage - 1})">‹ Anterior</button>\`;
            }
            
            for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
                html += \`<button onclick="loadTabData('\${currentTab}', \${i})" \${i === currentPage ? 'class="active"' : ''}>\${i}</button>\`;
            }
            
            if (currentPage < totalPages) {
                html += \`<button onclick="loadTabData('\${currentTab}', \${currentPage + 1})">Próxima ›</button>\`;
            }
            
            html += '</div>';
            return html;
        }

        // Busca global
        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const termo = e.target.value.trim();
            
            if (termo.length < 3) {
                document.getElementById('search-results').innerHTML = '';
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(\`/api/busca/\${encodeURIComponent(termo)}\`);
                    const data = await response.json();
                    
                    let html = \`
                        <h4>🔍 Resultados para "\${termo}"</h4>
                        <p>Encontrados: \${data.resultados.doencas} doenças, \${data.resultados.hpo_termos} HPO termos, \${data.resultados.medicamentos} medicamentos</p>
                    \`;
                    
                    if (data.dados.doencas.length > 0) {
                        html += '<h5>🧬 Doenças:</h5>';
                        data.dados.doencas.forEach(d => {
                            html += \`<span class="badge">\${d.name} (ORPHA:\${d.orphacode})</span>\`;
                        });
                    }
                    
                    if (data.dados.hpo_termos.length > 0) {
                        html += '<h5>🧠 HPO Termos:</h5>';
                        data.dados.hpo_termos.forEach(h => {
                            html += \`<span class="badge">\${h.hpo_id}: \${h.name}</span>\`;
                        });
                    }
                    
                    document.getElementById('search-results').innerHTML = html;
                    
                } catch (error) {
                    console.error('Erro na busca:', error);
                }
            }, 500);
        });

        // Inicializar
        loadDashboard();
        loadTabData('paises');
    </script>
</body>
</html>
    `);
});

// ====================================================================
// 🚀 INICIALIZAR SERVIDOR
// ====================================================================
app.listen(PORT, () => {
    console.log('🚀 VISUALIZADOR DE DADOS CPLP RARAS INICIADO!');
    console.log('=' + '='.repeat(80));
    console.log(`📊 Dashboard disponível em: http://localhost:${PORT}`);
    console.log('🎯 Explore seus dados de forma interativa!');
    console.log('\n📋 FUNCIONALIDADES DISPONÍVEIS:');
    console.log('   🌍 Países CPLP - Visualizar dados dos 9 países');
    console.log('   🧬 Doenças Raras - Navegar pelas 11.239 doenças');
    console.log('   🧠 Termos HPO - Explorar os 19.662 fenótipos');
    console.log('   💊 Medicamentos - Consultar os 409 medicamentos');
    console.log('   🔗 Associações - Ver as 9.280 associações HPO-Doença');
    console.log('   🔍 Busca Global - Buscar em todas as bases simultaneamente');
    console.log('\n🌐 Acesse: http://localhost:' + PORT);
    console.log('📊 Total de registros disponíveis: 65.293');
    console.log('✅ Sistema operacional e pronto para uso!');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 Encerrando visualizador...');
    await prisma.$disconnect();
    process.exit(0);
});
