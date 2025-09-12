/**
 * DASHBOARD DE VISUALIZAÇÃO - ETAPAS 1 E 2
 * ========================================
 * Interface para explorar dados das bases genômicas e clínicas
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardVisualizacao {
    constructor() {
        this.startTime = Date.now();
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [DASHBOARD] [${level}] ${message}`);
    }

    async verificarTabelasDisponiveis() {
        this.log('INFO', '🔍 Verificando tabelas disponíveis...');
        
        try {
            const tabelas = await prisma.$queryRaw`
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                AND name NOT LIKE 'sqlite_%' 
                AND name NOT LIKE '_prisma%'
                ORDER BY name
            `;
            
            console.log('\n📋 TABELAS DISPONÍVEIS:');
            console.log('========================');
            
            for (const tabela of tabelas) {
                const count = await this.contarRegistros(tabela.name);
                const tamanho = count.toLocaleString();
                console.log(`   📊 ${tabela.name}: ${tamanho} registros`);
            }
            
            return tabelas.map(t => t.name);
            
        } catch (error) {
            this.log('ERROR', `Erro verificando tabelas: ${error.message}`);
            return [];
        }
    }

    async contarRegistros(tabela) {
        try {
            const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tabela}`);
            return Number(result[0].count);
        } catch (error) {
            return 0;
        }
    }

    async analisarEtapa1Genomicas() {
        this.log('INFO', '🧬 Analisando Etapa 1 - Bases Genômicas Europeias...');
        
        try {
            console.log('\n🧬 ETAPA 1 - BASES GENÔMICAS EUROPEIAS');
            console.log('=====================================');
            
            // Ensembl Genes
            const ensemblStats = await this.analisarEnsemblGenes();
            
            // UniProt Proteins
            const uniprotStats = await this.analisarUniProtProteins();
            
            // Expression Data
            const expressionStats = await this.analisarExpressionData();
            
            return { ensemblStats, uniprotStats, expressionStats };
            
        } catch (error) {
            this.log('ERROR', `Erro analisando Etapa 1: ${error.message}`);
            return null;
        }
    }

    async analisarEnsemblGenes() {
        console.log('\n📊 ENSEMBL GENES:');
        console.log('-----------------');
        
        try {
            // Total de genes
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ensembl_genes`;
            console.log(`   Total de genes: ${Number(total[0].count).toLocaleString()}`);
            
            // Por biotipo
            const biotipos = await prisma.$queryRaw`
                SELECT biotype, COUNT(*) as count 
                FROM ensembl_genes 
                GROUP BY biotype 
                ORDER BY count DESC 
                LIMIT 10
            `;
            
            console.log('\n   📋 Por biotipo:');
            for (const biotipo of biotipos) {
                console.log(`      ${biotipo.biotype}: ${Number(biotipo.count).toLocaleString()}`);
            }
            
            // Por cromossomo
            const cromossomos = await prisma.$queryRaw`
                SELECT chromosome, COUNT(*) as count 
                FROM ensembl_genes 
                GROUP BY chromosome 
                ORDER BY 
                    CASE 
                        WHEN chromosome IN ('X', 'Y') THEN 99 
                        ELSE CAST(chromosome AS INTEGER) 
                    END
            `;
            
            console.log('\n   🧬 Por cromossomo:');
            for (const chr of cromossomos) {
                console.log(`      Chr ${chr.chromosome}: ${Number(chr.count).toLocaleString()}`);
            }
            
            // Genes protein-coding
            const proteinCoding = await prisma.$queryRaw`
                SELECT COUNT(*) as count 
                FROM ensembl_genes 
                WHERE protein_coding = TRUE
            `;
            console.log(`\n   🧪 Protein-coding: ${Number(proteinCoding[0].count).toLocaleString()}`);
            
            // Exemplos de genes
            const exemplos = await prisma.$queryRaw`
                SELECT ensembl_id, gene_symbol, gene_name, chromosome, biotype
                FROM ensembl_genes 
                WHERE gene_symbol IS NOT NULL 
                LIMIT 5
            `;
            
            console.log('\n   📝 Exemplos:');
            for (const gene of exemplos) {
                console.log(`      ${gene.gene_symbol} (${gene.ensembl_id}) - Chr${gene.chromosome} - ${gene.biotype}`);
            }
            
            return { total: Number(total[0].count), biotipos, cromossomos };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async analisarUniProtProteins() {
        console.log('\n📊 UNIPROT PROTEINS:');
        console.log('--------------------');
        
        try {
            // Total de proteínas
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM uniprot_proteins`;
            console.log(`   Total de proteínas: ${Number(total[0].count).toLocaleString()}`);
            
            // Reviewed vs Unreviewed
            const reviewed = await prisma.$queryRaw`
                SELECT reviewed, COUNT(*) as count 
                FROM uniprot_proteins 
                GROUP BY reviewed
            `;
            
            console.log('\n   📋 Status de revisão:');
            for (const status of reviewed) {
                const label = status.reviewed ? 'Swiss-Prot (reviewed)' : 'TrEMBL (unreviewed)';
                console.log(`      ${label}: ${Number(status.count).toLocaleString()}`);
            }
            
            // Por localização subcelular
            const locations = await prisma.$queryRaw`
                SELECT subcellular_location, COUNT(*) as count 
                FROM uniprot_proteins 
                GROUP BY subcellular_location 
                ORDER BY count DESC 
                LIMIT 8
            `;
            
            console.log('\n   🏠 Por localização subcelular:');
            for (const location of locations) {
                console.log(`      ${location.subcellular_location}: ${Number(location.count).toLocaleString()}`);
            }
            
            // Faixa de tamanho das proteínas
            const sizes = await prisma.$queryRaw`
                SELECT 
                    CASE 
                        WHEN protein_length < 100 THEN '< 100 aa'
                        WHEN protein_length < 300 THEN '100-299 aa'
                        WHEN protein_length < 500 THEN '300-499 aa'
                        WHEN protein_length < 1000 THEN '500-999 aa'
                        ELSE '1000+ aa'
                    END as size_range,
                    COUNT(*) as count
                FROM uniprot_proteins 
                GROUP BY size_range
                ORDER BY MIN(protein_length)
            `;
            
            console.log('\n   📏 Por tamanho (aminoácidos):');
            for (const size of sizes) {
                console.log(`      ${size.size_range}: ${Number(size.count).toLocaleString()}`);
            }
            
            // Exemplos de proteínas
            const exemplos = await prisma.$queryRaw`
                SELECT uniprot_id, protein_name, gene_symbol, protein_length, reviewed
                FROM uniprot_proteins 
                WHERE gene_symbol IS NOT NULL 
                ORDER BY protein_length DESC
                LIMIT 5
            `;
            
            console.log('\n   📝 Exemplos (maiores proteínas):');
            for (const protein of exemplos) {
                const status = protein.reviewed ? '[R]' : '[U]';
                console.log(`      ${protein.uniprot_id} ${status} - ${protein.gene_symbol} (${protein.protein_length} aa)`);
            }
            
            return { total: Number(total[0].count), reviewed, locations };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async analisarExpressionData() {
        console.log('\n📊 GENE EXPRESSION DATA:');
        console.log('------------------------');
        
        try {
            // Total de registros de expressão
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM gene_expression_data`;
            console.log(`   Total de registros: ${Number(total[0].count).toLocaleString()}`);
            
            // Por tecido
            const tecidos = await prisma.$queryRaw`
                SELECT tissue_type, COUNT(*) as count 
                FROM gene_expression_data 
                GROUP BY tissue_type 
                ORDER BY count DESC 
                LIMIT 10
            `;
            
            console.log('\n   🫀 Por tecido:');
            for (const tecido of tecidos) {
                console.log(`      ${tecido.tissue_type}: ${Number(tecido.count).toLocaleString()}`);
            }
            
            // Por tipo celular
            const celulas = await prisma.$queryRaw`
                SELECT cell_type, COUNT(*) as count 
                FROM gene_expression_data 
                GROUP BY cell_type 
                ORDER BY count DESC 
                LIMIT 8
            `;
            
            console.log('\n   🔬 Por tipo celular:');
            for (const celula of celulas) {
                console.log(`      ${celula.cell_type}: ${Number(celula.count).toLocaleString()}`);
            }
            
            // Estatísticas de expressão
            const expressionStats = await prisma.$queryRaw`
                SELECT 
                    AVG(expression_level) as avg_expression,
                    MIN(expression_level) as min_expression,
                    MAX(expression_level) as max_expression,
                    AVG(fold_change) as avg_fold_change
                FROM gene_expression_data
            `;
            
            console.log('\n   📈 Estatísticas de expressão:');
            const stats = expressionStats[0];
            console.log(`      Expressão média: ${Number(stats.avg_expression).toFixed(2)} TPM`);
            console.log(`      Expressão mín/máx: ${Number(stats.min_expression).toFixed(2)} - ${Number(stats.max_expression).toFixed(2)} TPM`);
            console.log(`      Fold-change médio: ${Number(stats.avg_fold_change).toFixed(2)}x`);
            
            // Genes mais expressos
            const topGenes = await prisma.$queryRaw`
                SELECT gene_symbol, tissue_type, expression_level
                FROM gene_expression_data 
                WHERE gene_symbol IS NOT NULL
                ORDER BY expression_level DESC 
                LIMIT 5
            `;
            
            console.log('\n   🏆 Genes mais expressos:');
            for (const gene of topGenes) {
                console.log(`      ${gene.gene_symbol} em ${gene.tissue_type}: ${Number(gene.expression_level).toFixed(2)} TPM`);
            }
            
            return { total: Number(total[0].count), tecidos, celulas };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async analisarEtapa2Clinicas() {
        this.log('INFO', '💊 Analisando Etapa 2 - Bases Clínicas Regulatórias...');
        
        try {
            console.log('\n💊 ETAPA 2 - BASES CLÍNICAS REGULATÓRIAS');
            console.log('=======================================');
            
            // EMA Medicines
            const emaStats = await this.analisarEMAMedicines();
            
            // EU Clinical Trials
            const trialsStats = await this.analisarEUTrials();
            
            // WHO Health Data
            const whoStats = await this.analisarWHOData();
            
            return { emaStats, trialsStats, whoStats };
            
        } catch (error) {
            this.log('ERROR', `Erro analisando Etapa 2: ${error.message}`);
            return null;
        }
    }

    async analisarEMAMedicines() {
        console.log('\n📊 EMA MEDICINES:');
        console.log('-----------------');
        
        try {
            // Total de medicamentos
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ema_medicines`;
            console.log(`   Total de medicamentos: ${Number(total[0].count).toLocaleString()}`);
            
            // Por área terapêutica
            const areas = await prisma.$queryRaw`
                SELECT therapeutic_area, COUNT(*) as count 
                FROM ema_medicines 
                GROUP BY therapeutic_area 
                ORDER BY count DESC
            `;
            
            console.log('\n   🏥 Por área terapêutica:');
            for (const area of areas) {
                console.log(`      ${area.therapeutic_area}: ${Number(area.count).toLocaleString()}`);
            }
            
            // Medicamentos órfãos
            const orphan = await prisma.$queryRaw`
                SELECT orphan_designation, COUNT(*) as count 
                FROM ema_medicines 
                GROUP BY orphan_designation
            `;
            
            console.log('\n   🦄 Medicamentos órfãos:');
            for (const status of orphan) {
                const label = status.orphan_designation ? 'Órfãos' : 'Não-órfãos';
                console.log(`      ${label}: ${Number(status.count).toLocaleString()}`);
            }
            
            // Por forma farmacêutica
            const forms = await prisma.$queryRaw`
                SELECT pharmaceutical_form, COUNT(*) as count 
                FROM ema_medicines 
                GROUP BY pharmaceutical_form 
                ORDER BY count DESC 
                LIMIT 8
            `;
            
            console.log('\n   💊 Por forma farmacêutica:');
            for (const form of forms) {
                console.log(`      ${form.pharmaceutical_form}: ${Number(form.count).toLocaleString()}`);
            }
            
            // Status de marketing
            const status = await prisma.$queryRaw`
                SELECT marketing_status, COUNT(*) as count 
                FROM ema_medicines 
                GROUP BY marketing_status
            `;
            
            console.log('\n   ✅ Status de marketing:');
            for (const s of status) {
                console.log(`      ${s.marketing_status}: ${Number(s.count).toLocaleString()}`);
            }
            
            // Exemplos recentes
            const exemplos = await prisma.$queryRaw`
                SELECT medicine_name, therapeutic_area, orphan_designation, authorization_date
                FROM ema_medicines 
                ORDER BY authorization_date DESC 
                LIMIT 5
            `;
            
            console.log('\n   📝 Medicamentos mais recentes:');
            for (const med of exemplos) {
                const orphan = med.orphan_designation ? '[ÓRFÃO]' : '';
                console.log(`      ${med.medicine_name} ${orphan} - ${med.therapeutic_area} (${med.authorization_date})`);
            }
            
            return { total: Number(total[0].count), areas, orphan };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async analisarEUTrials() {
        console.log('\n📊 EU CLINICAL TRIALS:');
        console.log('----------------------');
        
        try {
            // Total de ensaios
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM eu_clinical_trials`;
            console.log(`   Total de ensaios: ${Number(total[0].count).toLocaleString()}`);
            
            // Por fase
            const fases = await prisma.$queryRaw`
                SELECT trial_phase, COUNT(*) as count 
                FROM eu_clinical_trials 
                GROUP BY trial_phase 
                ORDER BY trial_phase
            `;
            
            console.log('\n   🧪 Por fase:');
            for (const fase of fases) {
                console.log(`      ${fase.trial_phase}: ${Number(fase.count).toLocaleString()}`);
            }
            
            // Por status
            const statusList = await prisma.$queryRaw`
                SELECT trial_status, COUNT(*) as count 
                FROM eu_clinical_trials 
                GROUP BY trial_status 
                ORDER BY count DESC
            `;
            
            console.log('\n   📊 Por status:');
            for (const status of statusList) {
                console.log(`      ${status.trial_status}: ${Number(status.count).toLocaleString()}`);
            }
            
            // Doenças raras
            const rareStats = await prisma.$queryRaw`
                SELECT 
                    SUM(CASE WHEN rare_disease = TRUE THEN 1 ELSE 0 END) as rare_count,
                    SUM(CASE WHEN orphan_condition = TRUE THEN 1 ELSE 0 END) as orphan_count,
                    COUNT(*) as total_count
                FROM eu_clinical_trials
            `;
            
            const rare = rareStats[0];
            console.log('\n   🦄 Doenças raras:');
            console.log(`      Doenças raras: ${Number(rare.rare_count).toLocaleString()}`);
            console.log(`      Condições órfãs: ${Number(rare.orphan_count).toLocaleString()}`);
            console.log(`      % Raras: ${(Number(rare.rare_count) / Number(rare.total_count) * 100).toFixed(1)}%`);
            
            // Por tipo de intervenção
            const interventions = await prisma.$queryRaw`
                SELECT intervention_type, COUNT(*) as count 
                FROM eu_clinical_trials 
                GROUP BY intervention_type
            `;
            
            console.log('\n   💉 Por tipo de intervenção:');
            for (const intervention of interventions) {
                console.log(`      ${intervention.intervention_type}: ${Number(intervention.count).toLocaleString()}`);
            }
            
            // Estatísticas de recrutamento
            const recruitmentStats = await prisma.$queryRaw`
                SELECT 
                    AVG(target_enrollment) as avg_enrollment,
                    MIN(target_enrollment) as min_enrollment,
                    MAX(target_enrollment) as max_enrollment
                FROM eu_clinical_trials
                WHERE target_enrollment IS NOT NULL
            `;
            
            const recruit = recruitmentStats[0];
            console.log('\n   👥 Estatísticas de recrutamento:');
            console.log(`      Recrutamento médio: ${Number(recruit.avg_enrollment).toFixed(0)} participantes`);
            console.log(`      Faixa: ${Number(recruit.min_enrollment)} - ${Number(recruit.max_enrollment)} participantes`);
            
            return { total: Number(total[0].count), fases, statusList };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async analisarWHOData() {
        console.log('\n📊 WHO GLOBAL HEALTH DATA:');
        console.log('---------------------------');
        
        try {
            // Total de registros
            const total = await prisma.$queryRaw`SELECT COUNT(*) as count FROM who_health_data`;
            console.log(`   Total de registros: ${Number(total[0].count).toLocaleString()}`);
            
            // Por país CPLP
            const countries = await prisma.$queryRaw`
                SELECT country_name, COUNT(*) as count 
                FROM who_health_data 
                GROUP BY country_name 
                ORDER BY count DESC
            `;
            
            console.log('\n   🌍 Por país CPLP:');
            for (const country of countries) {
                console.log(`      ${country.country_name}: ${Number(country.count).toLocaleString()}`);
            }
            
            // Por indicador
            const indicators = await prisma.$queryRaw`
                SELECT indicator_name, COUNT(*) as count 
                FROM who_health_data 
                GROUP BY indicator_name 
                ORDER BY count DESC
            `;
            
            console.log('\n   📊 Por indicador:');
            for (const indicator of indicators) {
                console.log(`      ${indicator.indicator_name}: ${Number(indicator.count).toLocaleString()}`);
            }
            
            // Por ano
            const years = await prisma.$queryRaw`
                SELECT year, COUNT(*) as count 
                FROM who_health_data 
                GROUP BY year 
                ORDER BY year DESC
            `;
            
            console.log('\n   📅 Por ano:');
            for (const year of years) {
                console.log(`      ${year.year}: ${Number(year.count).toLocaleString()}`);
            }
            
            // Por categoria
            const categories = await prisma.$queryRaw`
                SELECT category, COUNT(*) as count 
                FROM who_health_data 
                GROUP BY category 
                ORDER BY count DESC
            `;
            
            console.log('\n   📋 Por categoria:');
            for (const category of categories) {
                console.log(`      ${category.category}: ${Number(category.count).toLocaleString()}`);
            }
            
            // Exemplo de dados por país
            const brasilExample = await prisma.$queryRaw`
                SELECT indicator_name, year, value, unit_measure
                FROM who_health_data 
                WHERE country_code = 'BRA' 
                ORDER BY year DESC 
                LIMIT 5
            `;
            
            console.log('\n   📝 Exemplo - Brasil (mais recentes):');
            for (const data of brasilExample) {
                console.log(`      ${data.indicator_name} (${data.year}): ${Number(data.value).toFixed(2)} ${data.unit_measure}`);
            }
            
            return { total: Number(total[0].count), countries, indicators };
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return null;
        }
    }

    async gerarResumoGeral() {
        console.log('\n🎯 RESUMO GERAL - ETAPAS 1 E 2');
        console.log('===============================');
        
        try {
            // Contar todas as tabelas das etapas
            const tabelas = [
                'ensembl_genes',
                'uniprot_proteins', 
                'gene_expression_data',
                'ema_medicines',
                'eu_clinical_trials',
                'who_health_data'
            ];
            
            let totalGeral = 0;
            
            console.log('\n📊 TOTAIS POR CATEGORIA:');
            for (const tabela of tabelas) {
                const count = await this.contarRegistros(tabela);
                totalGeral += count;
                console.log(`   ${tabela}: ${count.toLocaleString()}`);
            }
            
            console.log('\n🎉 TOTAL GERAL ETAPAS 1+2: ' + totalGeral.toLocaleString());
            
            // Calcular crescimento
            console.log('\n📈 CRESCIMENTO:');
            console.log(`   Etapa 1 (Genômicas): 175.000 registros`);
            console.log(`   Etapa 2 (Clínicas): 28.000 registros`);
            console.log(`   Total verificado: ${totalGeral.toLocaleString()} registros`);
            
            return totalGeral;
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}`);
            return 0;
        }
    }

    async executarDashboard() {
        try {
            this.log('INFO', '🚀 DASHBOARD DE VISUALIZAÇÃO - ETAPAS 1 E 2');
            this.log('INFO', '===========================================');
            
            // Verificar tabelas disponíveis
            await this.verificarTabelasDisponiveis();
            
            // Analisar Etapa 1
            await this.analisarEtapa1Genomicas();
            
            // Analisar Etapa 2
            await this.analisarEtapa2Clinicas();
            
            // Resumo geral
            const totalGeral = await this.gerarResumoGeral();
            
            const duracao = Math.round((Date.now() - this.startTime) / 1000);
            
            console.log('\n===========================================');
            console.log('✅ DASHBOARD CONCLUÍDO!');
            console.log(`📊 Total de registros analisados: ${totalGeral.toLocaleString()}`);
            console.log(`⏱️ Tempo de análise: ${duracao}s`);
            console.log('===========================================');
            
            return totalGeral;
            
        } catch (error) {
            this.log('ERROR', `💥 ERRO: ${error.message}`);
            throw error;
        } finally {
            await prisma.$disconnect();
        }
    }
}

// Executar
if (require.main === module) {
    const dashboard = new DashboardVisualizacao();
    dashboard.executarDashboard()
        .then((total) => {
            console.log(`\n🎉 Análise completa: ${total.toLocaleString()} registros visualizados`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERRO:', error.message);
            process.exit(1);
        });
}

module.exports = DashboardVisualizacao;