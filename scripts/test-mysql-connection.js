// =====================================================================================
// TESTE DE CONEXÃO MYSQL - CPLP-RARAS
// =====================================================================================
// Script para testar conexão com MySQL local e verificar tabelas
// =====================================================================================

import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();

async function testMySQL() {
  console.log('🧪 TESTANDO MYSQL LOCAL - CPLP-RARAS');
  console.log('='.repeat(50));

  // 1. Testar conexão raw MySQL
  try {
    console.log('🔌 Testando conexão MySQL raw...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'cplp_raras'
    });

    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ MySQL conectado: ${rows[0].version}`);
    await connection.end();
  } catch (error) {
    console.log(`❌ Erro MySQL: ${error.message}`);
    console.log('💡 Certifique-se de que o MySQL está rodando e as credenciais estão corretas');
    return;
  }

  // 2. Testar Prisma
  try {
    console.log('🔌 Testando Prisma...');
    await prisma.$connect();
    console.log('✅ Prisma conectado');
  } catch (error) {
    console.log(`❌ Erro Prisma: ${error.message}`);
    return;
  }

  // 3. Verificar tabelas
  try {
    console.log('📋 Verificando tabelas...');
    
    // Verificar países CPLP
    const countries = await prisma.cplpCountry.count();
    console.log(`📊 Países CPLP: ${countries} registros`);
    
    // Verificar doenças Orphanet
    const diseases = await prisma.orphaDisease.count();
    console.log(`📊 Doenças Orphanet: ${diseases} registros`);
    
    // Verificar medicamentos
    const drugs = await prisma.drugbankDrug.count();
    console.log(`📊 Medicamentos: ${drugs} registros`);
    
    // Verificar interações
    const interactions = await prisma.drugInteraction.count();
    console.log(`📊 Interações: ${interactions} registros`);

  } catch (error) {
    console.log(`❌ Erro ao verificar tabelas: ${error.message}`);
    console.log('💡 Talvez seja necessário executar: npx prisma db push');
  }

  // 4. Testar consulta simples
  try {
    console.log('🔍 Testando consulta simples...');
    const sampleCountries = await prisma.cplpCountry.findMany({
      take: 3,
      select: {
        code: true,
        name: true,
        name_pt: true
      }
    });

    if (sampleCountries.length > 0) {
      console.log('✅ Consulta funcionando:');
      sampleCountries.forEach(country => {
        console.log(`   ${country.code}: ${country.name_pt}`);
      });
    } else {
      console.log('⚠️ Nenhum país encontrado - pode ser necessário importar dados');
    }

  } catch (error) {
    console.log(`❌ Erro na consulta: ${error.message}`);
  }

  await prisma.$disconnect();
  console.log('');
  console.log('🎉 TESTE CONCLUÍDO!');
}

// Executar teste
testMySQL().catch((error) => {
  console.error('💥 ERRO CRÍTICO:', error);
  process.exit(1);
});
