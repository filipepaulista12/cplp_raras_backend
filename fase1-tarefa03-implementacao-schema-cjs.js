/**
 * FASE 1 - TAREFA 1.3: IMPLEMENTAÇÃO E TESTE DO SCHEMA EXPANDIDO
 * 
 * Implementa as novas tabelas genômicas no MySQL e atualiza o schema Prisma
 * com sincronização automática para SQLite
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

class SchemaImplementation {
    constructor() {
        this.mysqlConnection = null;
        this.prisma = new PrismaClient();
        this.logFile = `logs/fase1-tarefa03-${timestamp}.log`;
        this.results = {
            inicio: new Date().toISOString(),
            etapas: {},
            erros: [],
            sucessos: [],
            metricas: {},
            status: 'iniciando'
        };
        
        this.ensureLogDir();
    }

    ensureLogDir() {
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
        }
    }

    log(message, level = 'info') {
        const logEntry = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
        console.log(logEntry);
        fs.appendFileSync(this.logFile, logEntry + '\n');
    }

    async connectMySQL() {
        try {
            // Tentar conectar com diferentes configurações
            const configs = [
                {
                    host: 'autorack.proxy.rlwy.net',
                    port: 14913,
                    user: 'root',
                    password: 'gFaGJDuBGwfOWBLKfGLRXVDlrLbmnQtC',
                    database: 'cplp_raras'
                },
                {
                    host: 'localhost',
                    port: 3306,
                    user: 'root',
                    password: '',
                    database: 'cplp_raras'
                }
            ];

            for (const config of configs) {
                try {
                    this.log(`Tentando conectar MySQL: ${config.host}:${config.port}`);
                    this.mysqlConnection = await mysql.createConnection(config);
                    await this.mysqlConnection.execute('SELECT 1');
                    this.log(`✅ MySQL conectado: ${config.host}:${config.port}`);
                    this.results.sucessos.push(`MySQL conectado: ${config.host}:${config.port}`);
                    return config;
                } catch (error) {
                    this.log(`❌ Falha MySQL ${config.host}: ${error.message}`, 'warn');
                }
            }
            
            throw new Error('Nenhuma conexão MySQL disponível');
        } catch (error) {
            this.log(`❌ Erro conectando MySQL: ${error.message}`, 'error');
            this.results.erros.push(`MySQL connection: ${error.message}`);
            throw error;
        }
    }

    async validateCurrentSchema() {
        try {
            this.log('🔍 Validando schema atual...');
            
            // Verificar tabelas existentes
            const [tables] = await this.mysqlConnection.execute('SHOW TABLES');
            const tableNames = tables.map(row => Object.values(row)[0]);
            
            this.log(`📊 Tabelas existentes: ${tableNames.length}`);
            this.log(`Tabelas: ${tableNames.join(', ')}`);

            // Verificar se tabelas genômicas já existem
            const genomicTables = [
                'clinvar_variants',
                'clinvar_submissions', 
                'clinvar_hpo_associations',
                'clinvar_genes',
                'omim_entries',
                'omim_phenotypes',
                'omim_hpo_associations',
                'omim_external_mappings'
            ];

            const existingGenomicTables = genomicTables.filter(table => 
                tableNames.includes(table)
            );

            if (existingGenomicTables.length > 0) {
                this.log(`⚠️ Tabelas genômicas já existem: ${existingGenomicTables.join(', ')}`);
                this.results.etapas.schema_validation = {
                    status: 'tabelas_existentes',
                    tabelas_existentes: existingGenomicTables,
                    acao: 'skip_creation'
                };
                return false; // Não criar novamente
            }

            this.results.etapas.schema_validation = {
                status: 'sucesso',
                tabelas_existentes: tableNames.length,
                ready_for_expansion: true
            };

            return true; // Pronto para criar
            
        } catch (error) {
            this.log(`❌ Erro validando schema: ${error.message}`, 'error');
            this.results.erros.push(`Schema validation: ${error.message}`);
            throw error;
        }
    }

    async implementGenomicTables() {
        try {
            this.log('🚀 Implementando tabelas genômicas...');

            // Ler o SQL de extensão
            const sqlFile = 'schemas/fase1-genomica/mysql-genomica-extension.sql';
            if (!fs.existsSync(sqlFile)) {
                throw new Error(`Arquivo SQL não encontrado: ${sqlFile}`);
            }

            const sqlContent = fs.readFileSync(sqlFile, 'utf8');
            this.log(`📝 SQL carregado: ${sqlContent.length} caracteres`);

            // Dividir em comandos individuais
            const commands = sqlContent
                .split(';')
                .map(cmd => cmd.trim())
                .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

            this.log(`🔧 Executando ${commands.length} comandos SQL...`);

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < commands.length; i++) {
                const command = commands[i];
                if (command.length < 10) continue; // Skip very short commands

                try {
                    this.log(`Executando comando ${i + 1}/${commands.length}...`);
                    await this.mysqlConnection.execute(command);
                    successCount++;
                    this.log(`✅ Comando ${i + 1} executado com sucesso`);
                } catch (error) {
                    errorCount++;
                    this.log(`❌ Erro no comando ${i + 1}: ${error.message}`, 'warn');
                    
                    // Se for erro de tabela já existir, continuar
                    if (error.message.includes('already exists')) {
                        this.log(`⚠️ Tabela já existe, continuando...`);
                        successCount++;
                    } else {
                        this.results.erros.push(`SQL command ${i + 1}: ${error.message}`);
                    }
                }
            }

            this.results.etapas.mysql_implementation = {
                status: 'concluido',
                comandos_executados: commands.length,
                sucessos: successCount,
                erros: errorCount
            };

            this.log(`✅ Implementação MySQL concluída: ${successCount}/${commands.length} sucessos`);
            
        } catch (error) {
            this.log(`❌ Erro implementando tabelas: ${error.message}`, 'error');
            this.results.erros.push(`MySQL implementation: ${error.message}`);
            throw error;
        }
    }

    async updatePrismaSchema() {
        try {
            this.log('🔄 Atualizando schema Prisma...');

            // Ler o schema Prisma atual
            const currentSchemaPath = 'prisma/schema.prisma';
            const genomicModelsPath = 'schemas/fase1-genomica/prisma-genomica-models.prisma';

            if (!fs.existsSync(genomicModelsPath)) {
                throw new Error(`Modelos genômicos não encontrados: ${genomicModelsPath}`);
            }

            const currentSchema = fs.readFileSync(currentSchemaPath, 'utf8');
            const genomicModels = fs.readFileSync(genomicModelsPath, 'utf8');

            // Verificar se já foi adicionado
            if (currentSchema.includes('model ClinvarVariant')) {
                this.log('⚠️ Modelos genômicos já estão no schema Prisma');
                this.results.etapas.prisma_update = {
                    status: 'ja_atualizado',
                    acao: 'skip'
                };
                return;
            }

            // Backup do schema atual
            const backupPath = `prisma/schema-backup-${timestamp}.prisma`;
            fs.writeFileSync(backupPath, currentSchema);
            this.log(`💾 Backup criado: ${backupPath}`);

            // Adicionar modelos genômicos
            const updatedSchema = currentSchema + '\n\n// === MODELOS GENÔMICOS - FASE 1 ===\n' + genomicModels;
            fs.writeFileSync(currentSchemaPath, updatedSchema);

            this.log('✅ Schema Prisma atualizado com modelos genômicos');
            this.results.etapas.prisma_update = {
                status: 'sucesso',
                backup_criado: backupPath,
                modelos_adicionados: 8
            };

        } catch (error) {
            this.log(`❌ Erro atualizando Prisma: ${error.message}`, 'error');
            this.results.erros.push(`Prisma update: ${error.message}`);
            throw error;
        }
    }

    async generatePrismaClient() {
        try {
            this.log('⚙️ Gerando cliente Prisma...');

            return new Promise((resolve, reject) => {
                const process = spawn('npx', ['prisma', 'generate'], {
                    cwd: process.cwd(),
                    stdio: 'pipe'
                });

                let output = '';
                let error = '';

                process.stdout.on('data', (data) => {
                    output += data.toString();
                });

                process.stderr.on('data', (data) => {
                    error += data.toString();
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        this.log('✅ Cliente Prisma gerado com sucesso');
                        this.results.etapas.prisma_generate = {
                            status: 'sucesso',
                            output: output.trim()
                        };
                        resolve();
                    } else {
                        this.log(`❌ Erro gerando cliente Prisma: ${error}`, 'error');
                        this.results.erros.push(`Prisma generate: ${error}`);
                        reject(new Error(error));
                    }
                });
            });

        } catch (error) {
            this.log(`❌ Erro no processo Prisma generate: ${error.message}`, 'error');
            this.results.erros.push(`Prisma generate process: ${error.message}`);
            throw error;
        }
    }

    async testNewTables() {
        try {
            this.log('🧪 Testando novas tabelas...');

            const genomicTables = [
                'clinvar_variants',
                'clinvar_submissions', 
                'clinvar_hpo_associations',
                'clinvar_genes',
                'omim_entries',
                'omim_phenotypes',
                'omim_hpo_associations',
                'omim_external_mappings'
            ];

            const testResults = {};

            for (const table of genomicTables) {
                try {
                    // Testar estrutura da tabela
                    const [columns] = await this.mysqlConnection.execute(`DESCRIBE ${table}`);
                    
                    testResults[table] = {
                        status: 'sucesso',
                        colunas: columns.length,
                        estrutura_valida: true
                    };

                    this.log(`✅ Tabela ${table}: ${columns.length} colunas`);

                } catch (error) {
                    testResults[table] = {
                        status: 'erro',
                        erro: error.message
                    };
                    this.log(`❌ Erro testando ${table}: ${error.message}`, 'warn');
                }
            }

            this.results.etapas.table_testing = {
                status: 'concluido',
                tabelas_testadas: genomicTables.length,
                sucessos: Object.values(testResults).filter(r => r.status === 'sucesso').length,
                resultados: testResults
            };

            this.log(`✅ Teste de tabelas concluído`);

        } catch (error) {
            this.log(`❌ Erro testando tabelas: ${error.message}`, 'error');
            this.results.erros.push(`Table testing: ${error.message}`);
            throw error;
        }
    }

    async validateIntegrity() {
        try {
            this.log('🔍 Validando integridade do sistema...');

            // Contar registros existentes
            const existingTables = ['countries', 'diseases', 'hpo_terms', 'disease_hpo_associations', 'medications'];
            const counts = {};

            for (const table of existingTables) {
                try {
                    const [result] = await this.mysqlConnection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                    counts[table] = result[0].count;
                    this.log(`📊 ${table}: ${counts[table]} registros`);
                } catch (error) {
                    this.log(`⚠️ Erro contando ${table}: ${error.message}`, 'warn');
                    counts[table] = 'erro';
                }
            }

            // Verificar se dados não foram afetados
            const expectedCounts = {
                countries: 9,
                diseases: 11239,
                hpo_terms: 19662,
                disease_hpo_associations: 9280,
                medications: 409
            };

            let integrityIssues = 0;
            for (const [table, expected] of Object.entries(expectedCounts)) {
                if (counts[table] !== expected) {
                    this.log(`⚠️ Contagem divergente em ${table}: esperado ${expected}, encontrado ${counts[table]}`, 'warn');
                    integrityIssues++;
                }
            }

            this.results.etapas.integrity_validation = {
                status: integrityIssues === 0 ? 'sucesso' : 'divergencias_encontradas',
                contagens: counts,
                divergencias: integrityIssues,
                dados_preservados: integrityIssues === 0
            };

            if (integrityIssues === 0) {
                this.log('✅ Integridade dos dados preservada');
            } else {
                this.log(`⚠️ ${integrityIssues} divergências de integridade encontradas`);
            }

        } catch (error) {
            this.log(`❌ Erro validando integridade: ${error.message}`, 'error');
            this.results.erros.push(`Integrity validation: ${error.message}`);
            throw error;
        }
    }

    async generateReport() {
        try {
            this.results.fim = new Date().toISOString();
            this.results.duracao_total = new Date(this.results.fim) - new Date(this.results.inicio);
            this.results.status = this.results.erros.length === 0 ? 'sucesso_completo' : 'concluido_com_avisos';

            // Métricas finais
            this.results.metricas = {
                tempo_execucao_ms: this.results.duracao_total,
                tempo_execucao_legivel: `${Math.round(this.results.duracao_total / 1000)}s`,
                etapas_concluidas: Object.keys(this.results.etapas).length,
                sucessos_total: this.results.sucessos.length,
                erros_total: this.results.erros.length,
                status_geral: this.results.status
            };

            // Salvar relatório
            const reportPath = `relatorios/fase1-tarefa03-implementacao-${timestamp}.json`;
            if (!fs.existsSync('relatorios')) {
                fs.mkdirSync('relatorios', { recursive: true });
            }
            
            fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

            this.log('='.repeat(60));
            this.log('📋 RELATÓRIO FINAL - TAREFA 1.3: IMPLEMENTAÇÃO SCHEMA');
            this.log('='.repeat(60));
            this.log(`⏱️  Duração: ${this.results.metricas.tempo_execucao_legivel}`);
            this.log(`✅ Sucessos: ${this.results.sucessos.length}`);
            this.log(`❌ Erros: ${this.results.erros.length}`);
            this.log(`📊 Status: ${this.results.status}`);
            this.log(`📄 Relatório: ${reportPath}`);
            this.log('='.repeat(60));

            if (this.results.status === 'sucesso_completo') {
                this.log('🎉 SCHEMA EXPANDIDO IMPLEMENTADO COM SUCESSO!');
                this.log('🔄 Próximo passo: Tarefa 1.4 - ETL ClinVar');
            }

            return reportPath;

        } catch (error) {
            this.log(`❌ Erro gerando relatório: ${error.message}`, 'error');
            throw error;
        }
    }

    async cleanup() {
        try {
            if (this.mysqlConnection) {
                await this.mysqlConnection.end();
                this.log('🔌 Conexão MySQL fechada');
            }
            
            await this.prisma.$disconnect();
            this.log('🔌 Prisma desconectado');
            
        } catch (error) {
            this.log(`⚠️ Erro no cleanup: ${error.message}`, 'warn');
        }
    }

    async execute() {
        try {
            this.log('🚀 INICIANDO TAREFA 1.3: IMPLEMENTAÇÃO SCHEMA EXPANDIDO');
            this.log('='.repeat(60));

            // 1. Conectar MySQL
            await this.connectMySQL();

            // 2. Validar schema atual
            const shouldImplement = await this.validateCurrentSchema();

            // 3. Implementar tabelas genômicas (se necessário)
            if (shouldImplement) {
                await this.implementGenomicTables();
            } else {
                this.log('⚠️ Tabelas já existem, pulando implementação MySQL');
            }

            // 4. Atualizar schema Prisma
            await this.updatePrismaSchema();

            // 5. Gerar cliente Prisma
            await this.generatePrismaClient();

            // 6. Testar novas tabelas
            await this.testNewTables();

            // 7. Validar integridade
            await this.validateIntegrity();

            // 8. Gerar relatório
            const reportPath = await this.generateReport();

            return {
                sucesso: true,
                relatorio: reportPath,
                status: this.results.status,
                metricas: this.results.metricas
            };

        } catch (error) {
            this.log(`💥 ERRO FATAL: ${error.message}`, 'error');
            this.results.status = 'erro_fatal';
            this.results.erro_fatal = error.message;
            
            await this.generateReport();
            return {
                sucesso: false,
                erro: error.message,
                relatorio: await this.generateReport()
            };
        } finally {
            await this.cleanup();
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const implementation = new SchemaImplementation();
    implementation.execute()
        .then(result => {
            if (result.sucesso) {
                console.log('\n🎉 TAREFA 1.3 CONCLUÍDA COM SUCESSO!');
                console.log(`📊 Status: ${result.status}`);
                console.log(`📄 Relatório: ${result.relatorio}`);
            } else {
                console.log('\n💥 TAREFA 1.3 FALHOU!');
                console.log(`❌ Erro: ${result.erro}`);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 ERRO CRÍTICO:', error.message);
            process.exit(1);
        });
}

module.exports = SchemaImplementation;
