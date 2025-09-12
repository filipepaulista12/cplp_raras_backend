// =====================================================================================
// CONFIGURAÇÃO TEMPORÁRIA SQLITE - CPLP-RARAS
// =====================================================================================
// Script para configurar SQLite temporariamente até MySQL estar pronto
// =====================================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 CONFIGURANDO SQLITE TEMPORÁRIO');
console.log('='.repeat(50));

// 1. Backup do schema MySQL atual
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const schemaMysqlPath = path.join(__dirname, '..', 'prisma', 'schema.mysql.prisma');
const schemaSqlitePath = path.join(__dirname, '..', 'prisma', 'schema.sqlite.prisma');

try {
  if (fs.existsSync(schemaPath)) {
    console.log('📋 Fazendo backup do schema MySQL...');
    if (!fs.existsSync(schemaMysqlPath)) {
      fs.copyFileSync(schemaPath, schemaMysqlPath);
    }
    console.log('✅ Backup criado: schema.mysql.prisma');
  }

  // 2. Copiar schema SQLite
  console.log('🔄 Aplicando schema SQLite...');
  fs.copyFileSync(schemaSqlitePath, schemaPath);
  console.log('✅ Schema SQLite aplicado');

  // 3. Configurar .env para SQLite
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Comentar MySQL e ativar SQLite
  envContent = envContent.replace(
    /^DATABASE_URL="mysql:\/\/.*"$/gm, 
    '# DATABASE_URL="mysql://root:password@localhost:3306/cplp_raras" # COMENTADO - MySQL não configurado'
  );
  
  if (!envContent.includes('DATABASE_URL="file:')) {
    envContent += '\n# SQLite TEMPORÁRIO\nDATABASE_URL="file:./database/cplp_raras_local.db"\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env configurado para SQLite');

  // 4. Criar diretório database se não existir
  const dbDir = path.join(__dirname, '..', 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

} catch (error) {
  console.error('❌ Erro na configuração:', error.message);
  process.exit(1);
}

// 5. Executar Prisma
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupPrisma() {
  try {
    console.log('🔧 Gerando Prisma client...');
    await execAsync('npx prisma generate', { cwd: path.join(__dirname, '..') });
    console.log('✅ Prisma client gerado');

    console.log('📋 Criando tabelas SQLite...');
    await execAsync('npx prisma db push', { cwd: path.join(__dirname, '..') });
    console.log('✅ Tabelas SQLite criadas');

    // 6. Popular dados básicos
    console.log('📊 Populando dados básicos...');
    await populateBasicData();

  } catch (error) {
    console.error('❌ Erro no Prisma:', error.message);
  }
}

async function populateBasicData() {
  const prisma = new PrismaClient();

  try {
    // Inserir países CPLP básicos
    const countries = [
      { code: 'BR', name: 'Brazil', name_pt: 'Brasil', flag_emoji: '🇧🇷', population: '215000000' },
      { code: 'PT', name: 'Portugal', name_pt: 'Portugal', flag_emoji: '🇵🇹', population: '10300000' },
      { code: 'AO', name: 'Angola', name_pt: 'Angola', flag_emoji: '🇦🇴', population: '33900000' },
      { code: 'MZ', name: 'Mozambique', name_pt: 'Moçambique', flag_emoji: '🇲🇿', population: '32200000' },
      { code: 'CV', name: 'Cape Verde', name_pt: 'Cabo Verde', flag_emoji: '🇨🇻', population: '560000' },
      { code: 'GW', name: 'Guinea-Bissau', name_pt: 'Guiné-Bissau', flag_emoji: '🇬🇼', population: '2000000' },
      { code: 'ST', name: 'São Tomé and Príncipe', name_pt: 'São Tomé e Príncipe', flag_emoji: '🇸🇹', population: '220000' },
      { code: 'TL', name: 'East Timor', name_pt: 'Timor-Leste', flag_emoji: '🇹🇱', population: '1340000' },
      { code: 'GQ', name: 'Equatorial Guinea', name_pt: 'Guiné Equatorial', flag_emoji: '🇬🇶', population: '1500000' }
    ];

    for (const country of countries) {
      await prisma.cplpCountry.upsert({
        where: { code: country.code },
        update: {},
        create: country
      });
    }

    console.log(`✅ ${countries.length} países CPLP inseridos`);

    // Inserir algumas doenças exemplo
    const diseases = [
      {
        orphacode: 'ORPHA:558',
        name: 'Maroteaux-Lamy syndrome',
        name_pt: 'Síndrome de Maroteaux-Lamy',
        definition: 'A rare lysosomal storage disease',
        definition_pt: 'Uma doença rara de armazenamento lisossômico'
      },
      {
        orphacode: 'ORPHA:1234',
        name: 'Example rare disease',
        name_pt: 'Doença rara exemplo',
        definition: 'An example rare disease for testing',
        definition_pt: 'Uma doença rara exemplo para testes'
      }
    ];

    for (const disease of diseases) {
      await prisma.orphaDisease.upsert({
        where: { orphacode: disease.orphacode },
        update: {},
        create: disease
      });
    }

    console.log(`✅ ${diseases.length} doenças exemplo inseridas`);

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar setup
setupPrisma().then(() => {
  console.log('');
  console.log('🎉 CONFIGURAÇÃO SQLITE CONCLUÍDA!');
  console.log('');
  console.log('📋 PARA USAR:');
  console.log('   1. npm run dev  # Iniciar API');
  console.log('   2. npx prisma studio  # Ver dados');
  console.log('');
  console.log('🔄 PARA VOLTAR AO MYSQL:');
  console.log('   1. Configure o MySQL conforme MYSQL_SETUP_INSTRUCTIONS.md');
  console.log('   2. Execute: cp prisma/schema.mysql.prisma prisma/schema.prisma');
  console.log('   3. Altere o .env para MySQL');
  console.log('   4. Execute: npx prisma generate && npx prisma db push');
  console.log('');
});
