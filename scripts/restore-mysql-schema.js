// =====================================================================================
// RESTAURAR SCHEMA MYSQL - CPLP-RARAS
// =====================================================================================
// Script para voltar ao MySQL quando estiver configurado
// =====================================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

console.log('🔄 RESTAURANDO CONFIGURAÇÃO MYSQL');
console.log('='.repeat(50));

async function restoreMySQLSchema() {
  try {
    // 1. Verificar se backup existe
    const schemaMysqlPath = path.join(__dirname, '..', 'prisma', 'schema.mysql.prisma');
    const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
    
    if (!fs.existsSync(schemaMysqlPath)) {
      console.error('❌ Backup MySQL não encontrado: schema.mysql.prisma');
      process.exit(1);
    }

    // 2. Restaurar schema MySQL
    console.log('📋 Restaurando schema MySQL...');
    fs.copyFileSync(schemaMysqlPath, schemaPath);
    console.log('✅ Schema MySQL restaurado');

    // 3. Atualizar .env para MySQL
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent = `# CONFIGURACAO LOCAL - MYSQL ESPELHO DO SERVIDOR
# ==================================================================
# MySQL local sincronizado com servidor

# DATABASE PRINCIPAL (MySQL Local)
DATABASE_URL="mysql://root:password@localhost:3306/cplp_raras"

# SQLite (backup temporário)
SQLITE_DATABASE_URL="file:./database/cplp_raras_local.db"

# Configurações MySQL Local
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="password"
MYSQL_DATABASE="cplp_raras"

# Configurações JWT
JWT_SECRET="cplp-raras-secret-2025-super-secure"

# Configuração do Servidor de Produção (para sync)
SERVER_HOST="200.144.254.4"
SERVER_USER="root"
SERVER_DATABASE="cplp_raras"
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env configurado para MySQL');

    // 4. Gerar Prisma Client
    console.log('🔧 Gerando Prisma client MySQL...');
    await execAsync('npx prisma generate', { cwd: path.join(__dirname, '..') });
    console.log('✅ Prisma client gerado');

    console.log('');
    console.log('🎉 CONFIGURAÇÃO MYSQL RESTAURADA!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar se MySQL está rodando');
    console.log('   2. npx prisma db push  # Criar tabelas');
    console.log('   3. node scripts/sync-mysql-dumps.js  # Sincronizar dados');
    console.log('   4. node scripts/test-mysql-connection.js  # Testar');

  } catch (error) {
    console.error('❌ Erro na restauração:', error.message);
    process.exit(1);
  }
}

// Executar
restoreMySQLSchema();
