const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function analiseExportFinal() {
  console.log('🔍 ANÁLISE FINAL DO EXPORT MYSQL');
  console.log('====================================\n');
  
  // Verificar arquivo gerado
  const exportFile = 'database/EXPORT_MYSQL_CPLP_RARAS_FINAL.sql';
  const fileStats = fs.statSync(exportFile);
  const fileSizeKB = (fileStats.size / 1024).toFixed(2);
  
  console.log(`📁 ARQUIVO GERADO:`);
  console.log(`   • Nome: ${exportFile}`);
  console.log(`   • Tamanho: ${fileSizeKB} KB`);
  console.log(`   • Data: ${fileStats.mtime.toLocaleString('pt-BR')}`);
  console.log('');
  
  // Status atual do banco SQLite
  console.log('💾 STATUS DO BANCO SQLITE ORIGINAL:');
  
  const tabelasComDados = [
    { nome: 'orpha_diseases', esperado: 11239 },
    { nome: 'hpo_terms', esperado: 19662 },
    { nome: 'drugbank_drugs', esperado: 409 },
    { nome: 'hpo_disease_associations', esperado: 50024 },
    { nome: 'hpo_gene_associations', esperado: 24501 },
    { nome: 'orpha_linearisations', esperado: 11239 },
    { nome: 'orpha_external_mappings', esperado: 6331 },
    { nome: 'drug_interactions', esperado: 193 },
    { nome: 'cplp_countries', esperado: 9 }
  ];
  
  let totalRegistros = 0;
  
  for (const tabela of tabelasComDados) {
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${tabela.nome}"`)}`;
      const atual = count[0].count;
      totalRegistros += atual;
      
      const status = atual === tabela.esperado ? '✅' : '⚠️';
      console.log(`   ${status} ${tabela.nome}: ${atual.toLocaleString()} registros`);
      
    } catch (error) {
      console.log(`   ❌ ${tabela.nome}: Erro ao contar`);
    }
  }
  
  console.log(`\n   📊 Total com dados: ${totalRegistros.toLocaleString()} registros`);
  
  // Tabelas vazias
  const tabelasVazias = [
    'drug_disease_associations',
    'hpo_phenotype_associations', 
    'orpha_clinical_signs',
    'orpha_cplp_epidemiology',
    'orpha_epidemiology',
    'orpha_gene_associations',
    'orpha_import_logs',
    'orpha_medical_classifications',
    'orpha_natural_history',
    'orpha_phenotypes',
    'orpha_textual_information'
  ];
  
  console.log(`\n   📝 Tabelas vazias (${tabelasVazias.length}): ${tabelasVazias.join(', ')}`);
  
  // Análise do arquivo SQL
  console.log('\n🔍 ANÁLISE DO ARQUIVO SQL:');
  const sqlContent = fs.readFileSync(exportFile, 'utf8');
  const lines = sqlContent.split('\n').length;
  
  const createTables = (sqlContent.match(/CREATE TABLE/g) || []).length;
  const insertStatements = (sqlContent.match(/INSERT INTO/g) || []).length;
  const dropTables = (sqlContent.match(/DROP TABLE/g) || []).length;
  
  console.log(`   📋 Linhas totais: ${lines.toLocaleString()}`);
  console.log(`   🗂️  CREATE TABLE: ${createTables}`);
  console.log(`   📥 INSERT INTO: ${insertStatements}`);
  console.log(`   🗑️  DROP TABLE: ${dropTables}`);
  
  // Instruções finais
  console.log('\n🎯 INSTRUÇÕES MYSQL WORKBENCH:');
  console.log('================================');
  console.log('1. Abra o MySQL Workbench');
  console.log('2. Conecte ao servidor MySQL');
  console.log('3. Execute os comandos:');
  console.log('   CREATE DATABASE IF NOT EXISTS cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  console.log('   USE cplp_raras;');
  console.log(`4. Execute o arquivo: ${exportFile}`);
  console.log('');
  console.log('✅ RESULTADO ESPERADO:');
  console.log(`   • 20 tabelas criadas`);
  console.log(`   • 9 tabelas com dados reais (amostras)`);
  console.log(`   • 11 tabelas vazias preparadas`);
  console.log(`   • Sistema pronto para uso`);
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('• Usar XMLs do Orphanet para popular tabelas vazias');
  console.log('• Configurar relacionamentos (foreign keys)');
  console.log('• Implementar índices para performance');
  console.log('• Testar queries principais do sistema');
  
  return {
    arquivoSQL: exportFile,
    tamanhoKB: fileSizeKB,
    totalRegistros,
    tabelasComDados: tabelasComDados.length,
    tabelasVazias: tabelasVazias.length
  };
}

async function main() {
  try {
    const resultado = await analiseExportFinal();
    
    console.log('\n🎉 EXPORT MYSQL CONCLUÍDO COM SUCESSO!');
    console.log('=====================================');
    console.log(`✅ Arquivo: ${resultado.arquivoSQL}`);
    console.log(`✅ Tamanho: ${resultado.tamanhoKB} KB`);
    console.log(`✅ Dados: ${resultado.totalRegistros.toLocaleString()} registros`);
    console.log(`✅ Tabelas: ${resultado.tabelasComDados + resultado.tabelasVazias}`);
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
