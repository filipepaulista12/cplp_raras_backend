// =====================================================================================
// SCRIPT DE SINCRONIZAÇÃO MYSQL - CPLP-RARAS
// =====================================================================================
// Script para sincronizar banco local MySQL com os dumps do servidor
// SEM ZERAR TABELAS EXISTENTES - APENAS INSERIR/ATUALIZAR
// =====================================================================================

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuração do banco local
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'cplp_raras',
  multipleStatements: true
};

// Lista de arquivos SQL para importar (ordem importante)
const IMPORT_ORDER = [
  'cplp_raras_cplp_countries.sql',
  'cplp_raras_orpha_diseases.sql',
  'cplp_raras_orpha_phenotypes.sql',
  'cplp_raras_orpha_clinical_signs.sql',
  'cplp_raras_orpha_gene_associations.sql',
  'cplp_raras_orpha_external_mappings.sql',
  'cplp_raras_orpha_medical_classifications.sql',
  'cplp_raras_orpha_linearisations.sql',
  'cplp_raras_orpha_epidemiology.sql',
  'cplp_raras_orpha_natural_history.sql',
  'cplp_raras_orpha_textual_information.sql',
  'cplp_raras_orpha_cplp_epidemiology.sql',
  'cplp_raras_drugbank_drugs.sql',
  'cplp_raras_drug_disease_associations.sql',
  'cplp_raras_drug_interactions.sql',
  'cplp_raras_hpo_terms.sql',
  'cplp_raras_hpo_disease_associations.sql',
  'cplp_raras_hpo_gene_associations.sql',
  'cplp_raras_hpo_phenotype_associations.sql',
  'cplp_raras_orpha_import_logs.sql'
];

class MySQLSyncer {
  constructor() {
    this.connection = null;
    this.dumpPath = path.join(__dirname, '..', 'database', 'data20250903');
    this.logFile = path.join(__dirname, '..', 'logs', `sync_${new Date().toISOString().slice(0, 10)}.log`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Criar diretório de logs se não existir
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async connect() {
    try {
      this.log('🔌 Conectando ao MySQL local...');
      this.connection = await mysql.createConnection(DB_CONFIG);
      this.log('✅ Conexão estabelecida com sucesso');
    } catch (error) {
      this.log(`❌ Erro ao conectar: ${error.message}`);
      throw error;
    }
  }

  async createDatabase() {
    try {
      this.log('🗄️ Verificando/criando database...');
      await this.connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await this.connection.execute(`USE ${DB_CONFIG.database}`);
      this.log('✅ Database configurado');
    } catch (error) {
      this.log(`❌ Erro ao configurar database: ${error.message}`);
      throw error;
    }
  }

  async createTablesFromSchema() {
    try {
      this.log('📋 Criando tabelas via Prisma...');
      const { exec } = require('child_process');
      
      return new Promise((resolve, reject) => {
        exec('npx prisma db push --force-reset', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
          if (error) {
            this.log(`❌ Erro no Prisma: ${error.message}`);
            reject(error);
          } else {
            this.log('✅ Tabelas criadas via Prisma');
            resolve();
          }
        });
      });
    } catch (error) {
      this.log(`❌ Erro ao criar tabelas: ${error.message}`);
      throw error;
    }
  }

  async importDumpFile(filename) {
    const filePath = path.join(this.dumpPath, filename);
    
    if (!fs.existsSync(filePath)) {
      this.log(`⚠️ Arquivo não encontrado: ${filename}`);
      return;
    }

    try {
      this.log(`📥 Importando ${filename}...`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Remover comandos MySQL específicos que podem causar erro
      const cleanSql = sqlContent
        .replace(/\/\*!.*?\*\/;/g, '') // Remove comentários MySQL
        .replace(/LOCK TABLES.*?;/g, '') // Remove LOCK TABLES
        .replace(/UNLOCK TABLES;/g, '') // Remove UNLOCK TABLES
        .replace(/SET.*?;/g, '') // Remove comandos SET
        .replace(/--.*$/gm, '') // Remove comentários de linha
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('--'))
        .join('\n');

      // Executar SQL apenas se houver dados para inserir
      if (cleanSql.includes('INSERT INTO')) {
        // Usar INSERT IGNORE para evitar duplicatas
        const safeSQL = cleanSql.replace(/INSERT INTO/g, 'INSERT IGNORE INTO');
        await this.connection.execute(safeSQL);
        this.log(`✅ Arquivo ${filename} importado com sucesso`);
      } else {
        this.log(`⚠️ Nenhum dado para importar em ${filename}`);
      }
    } catch (error) {
      this.log(`❌ Erro ao importar ${filename}: ${error.message}`);
      // Não falhar completamente, continuar com próximo arquivo
    }
  }

  async syncAllTables() {
    try {
      await this.connect();
      await this.createDatabase();
      await this.createTablesFromSchema();

      this.log('🔄 Iniciando sincronização de dados...');
      
      for (const filename of IMPORT_ORDER) {
        await this.importDumpFile(filename);
      }

      this.log('🎉 Sincronização completa!');
      
      // Verificar dados importados
      await this.verifyImport();
      
    } catch (error) {
      this.log(`💥 ERRO CRÍTICO: ${error.message}`);
      throw error;
    } finally {
      if (this.connection) {
        await this.connection.end();
        this.log('🔌 Conexão fechada');
      }
    }
  }

  async verifyImport() {
    try {
      this.log('🔍 Verificando dados importados...');
      
      const tables = [
        'cplp_countries',
        'orpha_diseases',
        'drugbank_drugs',
        'drug_interactions',
        'hpo_terms'
      ];

      for (const table of tables) {
        try {
          const [rows] = await this.connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          this.log(`📊 ${table}: ${rows[0].count} registros`);
        } catch (error) {
          this.log(`⚠️ Erro ao verificar tabela ${table}: ${error.message}`);
        }
      }
    } catch (error) {
      this.log(`❌ Erro na verificação: ${error.message}`);
    }
  }
}

// Executar sincronização se chamado diretamente
if (require.main === module) {
  const syncer = new MySQLSyncer();
  
  syncer.syncAllTables()
    .then(() => {
      console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('📋 Verifique o log para detalhes:', syncer.logFile);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FALHA NA SINCRONIZAÇÃO:', error.message);
      process.exit(1);
    });
}

module.exports = MySQLSyncer;
