/**
 * Script para visualizar dados do banco de dados
 * Mostra estrutura de tabelas e conteúdo
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function visualizarDados() {
  console.log('🔍 ANÁLISE COMPLETA DO BANCO DE DADOS CPLP-RARAS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar conectividade
    console.log('\n📡 Testando conectividade...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso');

    // 2. Listar todas as tabelas usando query raw
    console.log('\n📊 ESTRUTURA DO BANCO:');
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `;
    
    console.log(`📋 Total de tabelas encontradas: ${(tables as any[]).length}`);
    (tables as any[]).forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.name}`);
    });

    // 3. Verificar cada tabela com dados
    console.log('\n🔢 CONTAGEM DE REGISTROS POR TABELA:');
    for (const table of tables as any[]) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as total FROM "${table.name}"`);
        const total = (count as any[])[0]?.total || 0;
        console.log(`   📁 ${table.name}: ${total} registros`);
      } catch (error) {
        console.log(`   ❌ ${table.name}: Erro ao contar - ${error}`);
      }
    }

    // 4. Examinar estrutura de tabelas importantes
    console.log('\n🏗️ ESTRUTURA DAS TABELAS PRINCIPAIS:');
    const importantes = ['diseases', 'orphanet_diseases', 'hpo_terms', 'drugbank_drugs', 'cplp_countries'];
    
    for (const tabela of importantes) {
      try {
        const estrutura = await prisma.$queryRawUnsafe(`PRAGMA table_info("${tabela}")`);
        console.log(`\n📋 Estrutura da tabela: ${tabela}`);
        (estrutura as any[]).forEach((coluna: any) => {
          console.log(`   - ${coluna.name} (${coluna.type}) ${coluna.pk ? '[PRIMARY KEY]' : ''}`);
        });
      } catch (error) {
        console.log(`   ⚠️ Tabela ${tabela} não encontrada ou inacessível`);
      }
    }

    // 5. Amostras de dados das tabelas principais
    console.log('\n📄 AMOSTRAS DE DADOS:');
    for (const tabela of importantes) {
      try {
        const amostra = await prisma.$queryRawUnsafe(`SELECT * FROM "${tabela}" LIMIT 3`);
        console.log(`\n🔍 Primeiros 3 registros de ${tabela}:`);
        if ((amostra as any[]).length > 0) {
          (amostra as any[]).forEach((registro: any, index: number) => {
            console.log(`   ${index + 1}. ${JSON.stringify(registro, null, 2)}`);
          });
        } else {
          console.log('   📝 Tabela vazia');
        }
      } catch (error) {
        console.log(`   ❌ Erro ao acessar ${tabela}: ${error}`);
      }
    }

    // 6. Análise de qualidade dos dados
    console.log('\n✅ ANÁLISE DE QUALIDADE DOS DADOS:');
    
    // Verificar se há dados Orphanet
    try {
      const orphanetCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM sqlite_master WHERE name LIKE "%orph%"');
      console.log(`   🔬 Tabelas relacionadas ao Orphanet: ${(orphanetCount as any[])[0]?.total || 0}`);
    } catch (error) {
      console.log('   ⚠️ Não foi possível verificar dados Orphanet');
    }

    // Verificar se há dados HPO
    try {
      const hpoCount = await prisma.$queryRawUnsafe('SELECT COUNT(*) as total FROM sqlite_master WHERE name LIKE "%hpo%"');
      console.log(`   🧬 Tabelas relacionadas ao HPO: ${(hpoCount as any[])[0]?.total || 0}`);
    } catch (error) {
      console.log('   ⚠️ Não foi possível verificar dados HPO');
    }

    // 7. Verificar integridade referencial básica
    console.log('\n🔗 VERIFICAÇÃO DE INTEGRIDADE:');
    try {
      const foreignKeys = await prisma.$queryRaw`PRAGMA foreign_key_list(diseases)`;
      console.log(`   🔐 Chaves estrangeiras em 'diseases': ${(foreignKeys as any[]).length}`);
    } catch (error) {
      console.log('   ⚠️ Verificação de chaves estrangeiras não disponível');
    }

    console.log('\n🎉 ANÁLISE CONCLUÍDA COM SUCESSO!');

  } catch (error) {
    console.error('❌ ERRO na análise do banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

visualizarDados().catch(console.error);
