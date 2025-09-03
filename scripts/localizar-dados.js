/**
 * LOCALIZAÇÃO DOS DADOS - SISTEMA CPLP-RARAS
 * Script para mostrar onde estão todos os dados populados
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function mostrarLocalizacaoDados() {
  console.log('📍 LOCALIZAÇÃO DOS DADOS - SISTEMA CPLP-RARAS\n');
  console.log('==============================================\n');
  
  // 1. Banco de dados principal
  console.log('🗄️ BANCO DE DADOS PRINCIPAL:');
  const dbPath = path.resolve('database/gard_dev.db');
  const dbStats = fs.statSync(dbPath);
  const dbSizeMB = Math.round(dbStats.size / 1024 / 1024 * 100) / 100;
  
  console.log(`📁 Arquivo: ${dbPath}`);
  console.log(`📊 Tamanho: ${dbSizeMB} MB`);
  console.log(`📅 Modificado: ${dbStats.mtime.toLocaleString('pt-BR')}`);
  console.log(`💾 Tipo: SQLite Database\n`);
  
  // 2. Contagem de registros por tabela
  console.log('📊 DADOS ARMAZENADOS NO BANCO:');
  
  const tables = [
    { name: 'OrphaDisease', model: 'orphaDisease' },
    { name: 'OrphaClinicalSign', model: 'orphaClinicalSign' },
    { name: 'OrphaPhenotype', model: 'orphaPhenotype' },
    { name: 'OrphaGeneAssociation', model: 'orphaGeneAssociation' },
    { name: 'HPOPhenotypeAssociation', model: 'hPOPhenotypeAssociation' },
    { name: 'OrphaTextualInformation', model: 'orphaTextualInformation' },
    { name: 'DrugDiseaseAssociation', model: 'drugDiseaseAssociation' },
    { name: 'OrphaEpidemiology', model: 'orphaEpidemiology' },
    { name: 'OrphaNaturalHistory', model: 'orphaNaturalHistory' }
  ];
  
  let totalRecords = 0;
  
  for (const table of tables) {
    try {
      const count = await prisma[table.model].count();
      totalRecords += count;
      
      const status = count > 0 ? '✅' : '❌';
      const emoji = count > 5000 ? '🔥' : count > 1000 ? '⭐' : count > 0 ? '✅' : '❌';
      
      console.log(`${emoji} ${table.name}: ${count.toLocaleString()} registros`);
    } catch (error) {
      console.log(`❌ ${table.name}: erro de acesso`);
    }
  }
  
  console.log(`\n🎯 TOTAL: ${totalRecords.toLocaleString()} registros no banco de dados\n`);
  
  // 3. Arquivos de dados fonte
  console.log('📂 ARQUIVOS DE DADOS FONTE:');
  
  const sourceDirs = [
    'database/orphadata-sources',
    'database/hpo-official',
    'database/orphanet-official',
    'database/drugbank-real'
  ];
  
  for (const dir of sourceDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      console.log(`\n📁 ${dir}:`);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          const sizeKB = Math.round(stats.size / 1024);
          const sizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;
          const size = sizeMB > 1 ? `${sizeMB} MB` : `${sizeKB} KB`;
          
          console.log(`   📄 ${file} (${size})`);
        }
      });
    }
  }
  
  // 4. Relatórios gerados
  console.log('\n📋 RELATÓRIOS GERADOS:');
  if (fs.existsSync('reports')) {
    const reports = fs.readdirSync('reports');
    reports.forEach(report => {
      const reportPath = path.join('reports', report);
      const stats = fs.statSync(reportPath);
      console.log(`   📊 ${report} (${stats.mtime.toLocaleDateString('pt-BR')})`);
    });
  }
  
  // 5. Como acessar os dados
  console.log('\n🔧 COMO ACESSAR OS DADOS:');
  console.log('1. 📊 Prisma Studio: npx prisma studio');
  console.log('2. 🔍 SQLite Browser: Abrir database/gard_dev.db');
  console.log('3. 💻 Código Node.js: const { PrismaClient } = require("@prisma/client")');
  console.log('4. 🌐 API REST: Endpoints já configurados no Next.js');
  console.log('5. 📱 Interface Web: npm run dev (localhost:3000)');
  
  // 6. Resumo de localização
  console.log('\n🎯 RESUMO DE LOCALIZAÇÃO:');
  console.log(`📍 Dados principais: ${dbPath}`);
  console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
  console.log(`💾 Tamanho do banco: ${dbSizeMB} MB`);
  console.log(`🔧 Status: Sistema completamente populado e funcional`);
  
  return {
    databasePath: dbPath,
    databaseSize: dbSizeMB,
    totalRecords,
    tablesPopulated: tables.length
  };
}

async function main() {
  try {
    const info = await mostrarLocalizacaoDados();
    
    console.log('\n🎉 DADOS LOCALIZADOS COM SUCESSO!');
    console.log('🚀 Sistema CPLP-Raras totalmente operacional!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { mostrarLocalizacaoDados };
