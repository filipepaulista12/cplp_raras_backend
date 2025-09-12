// IMPORTAÇÃO DOS DADOS REAIS DO SERVIDOR - NÃO FAKE!
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

console.log('🔥 IMPORTANDO DADOS REAIS DO SERVIDOR - ZERO FAKE!');
console.log('='.repeat(60));

async function importRealServerData() {
  try {
    await prisma.$connect();
    console.log('🔌 Conectado ao SQLite');

    // 1. PAÍSES CPLP (vou ler do arquivo real)
    console.log('\n🌍 LENDO PAÍSES CPLP DO SERVIDOR...');
    const countriesFile = fs.readFileSync('database/data20250903/cplp_raras_cplp_countries.sql', 'utf8');
    const countryInserts = countriesFile.match(/INSERT INTO.*?VALUES.*?;/gs) || [];
    console.log(`📁 Encontrados ${countryInserts.length} países no arquivo real`);

    // 2. DOENÇAS ORPHANET (dados reais do servidor)
    console.log('\n🧬 LENDO DOENÇAS ORPHANET DO SERVIDOR...');
    const diseasesFile = fs.readFileSync('database/data20250903/cplp_raras_orpha_diseases.sql', 'utf8');
    const diseaseInserts = diseasesFile.match(/INSERT INTO.*?VALUES.*?;/gs) || [];
    console.log(`📁 Encontradas ${diseaseInserts.length} doenças no arquivo real`);

    // 3. TERMOS HPO (dados reais do servidor)
    console.log('\n📋 LENDO TERMOS HPO DO SERVIDOR...');
    const hpoFile = fs.readFileSync('database/data20250903/cplp_raras_hpo_terms.sql', 'utf8');
    const hpoInserts = hpoFile.match(/INSERT INTO.*?VALUES.*?;/gs) || [];
    console.log(`📁 Encontrados ${hpoInserts.length} termos HPO no arquivo real`);

    // 4. MEDICAMENTOS (dados reais do servidor)
    console.log('\n💊 LENDO MEDICAMENTOS DO SERVIDOR...');
    const drugsFile = fs.readFileSync('database/data20250903/cplp_raras_drugbank_drugs.sql', 'utf8');
    const drugInserts = drugsFile.match(/INSERT INTO.*?VALUES.*?;/gs) || [];
    console.log(`📁 Encontrados ${drugInserts.length} medicamentos no arquivo real`);

    // PARSING E INSERÇÃO DOS DADOS REAIS
    console.log('\n⚠️  ANÁLISE: OS DADOS REAIS DO SEU SERVIDOR SÃO:');
    console.log(`    • ${countryInserts.length} países CPLP`);
    console.log(`    • ${diseaseInserts.length} doenças Orphanet`);
    console.log(`    • ${hpoInserts.length} termos HPO`);
    console.log(`    • ${drugInserts.length} medicamentos DrugBank`);

    console.log('\n🔍 PRIMEIRA DOENÇA REAL DO SEU ARQUIVO:');
    if (diseaseInserts[0]) {
      console.log(diseaseInserts[0].substring(0, 200) + '...');
    }

    console.log('\n❌ PROBLEMA IDENTIFICADO:');
    console.log('    Os arquivos SQL do servidor usam estrutura MySQL');
    console.log('    Preciso converter para SQLite e extrair os dados');

    console.log('\n🔧 SOLUÇÃO: Vou analisar a estrutura real e converter...');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importRealServerData();
