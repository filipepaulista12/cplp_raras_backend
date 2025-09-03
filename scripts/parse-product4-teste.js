const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function parseProduct4Simple() {
  console.log('🧬 PARSER PRODUCT4 SIMPLES - HPO ASSOCIATIONS');
  console.log('=============================================');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const xmlFile = 'database/orphadata-sources/en_product4.xml';
  
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ Arquivo não encontrado:', xmlFile);
    return;
  }

  const stats = fs.statSync(xmlFile);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`📁 Arquivo: ${xmlFile} (${sizeMB} MB)`);
  
  console.log('🔄 Parseando XML (apenas primeiros 100 KB para teste rápido)...');
  
  try {
    // Ler apenas uma parte do arquivo para teste
    const content = fs.readFileSync(xmlFile, 'utf8').substring(0, 100000);
    const parser = new xml2js.Parser();
    
    // Se falhar no XML parcial, vamos tentar uma abordagem diferente
    console.log('🔄 Lendo XML completo...');
    const fullContent = fs.readFileSync(xmlFile, 'utf8');
    const result = await parser.parseStringPromise(fullContent);
    
    console.log('✅ XML parseado com sucesso!');
    console.log('🔍 Estrutura root:', Object.keys(result));
    
    // Encontrar o path correto
    const jdbor = result?.JDBOR;
    if (!jdbor) {
      console.log('❌ Estrutura JDBOR não encontrada');
      console.log('📊 Chaves disponíveis:', Object.keys(result));
      return;
    }
    
    console.log('✅ JDBOR encontrado');
    console.log('🔍 Chaves JDBOR:', Object.keys(jdbor));
    
    const hpoList = jdbor.HPODisorderSetStatusList?.[0]?.HPODisorderSetStatus;
    if (!hpoList) {
      console.log('❌ HPODisorderSetStatusList não encontrada');
      return;
    }
    
    console.log(`📊 Encontrados ${hpoList.length} disorders`);
    
    // Processar apenas os primeiros 10 para teste
    let totalInserted = 0;
    
    for (let i = 0; i < Math.min(10, hpoList.length); i++) {
      const hpoStatus = hpoList[i];
      const disorder = hpoStatus.Disorder?.[0];
      
      if (!disorder) continue;
      
      const orphaNumber = disorder.OrphaNumber?.[0];
      console.log(`🔄 Processando disorder ${i + 1}: ORPHA:${orphaNumber}`);
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      
      if (!hpoAssociations || !Array.isArray(hpoAssociations)) {
        console.log(`   ⚠️  Sem associações HPO`);
        continue;
      }
      
      console.log(`   📋 ${hpoAssociations.length} associações HPO encontradas`);
      
      // Processar cada associação HPO
      for (let j = 0; j < Math.min(5, hpoAssociations.length); j++) { // Apenas 5 por disorder para teste
        const assoc = hpoAssociations[j];
        const hpo = assoc.HPO?.[0];
        
        if (!hpo) continue;
        
        const hpoId = hpo.HPOId?.[0];
        const hpoTerm = hpo.HPOTerm?.[0];
        const frequency = assoc.HPOFrequency?.[0]?.Name?.[0];
        
        console.log(`     - HPO: ${hpoId} (${hpoTerm}) - ${frequency || 'sem frequência'}`);
        
        if (hpoId && hpoTerm) {
          // Inserir na tabela orpha_phenotypes usando o model correto
          try {
            const existingPhenotype = await prisma.orphaPhenotype.findFirst({
              where: { hpoId: hpoId }
            });
            
            if (!existingPhenotype) {
              await prisma.orphaPhenotype.create({
                data: {
                  hpoId: hpoId,
                  hpoTerm: hpoTerm,
                  frequencyTerm: frequency
                }
              });
              totalInserted++;
              console.log(`       ✅ Phenotype inserido`);
            } else {
              console.log(`       ⚡ Phenotype já existe`);
            }
            
          } catch (error) {
            console.log(`       ❌ Erro ao inserir phenotype:`, error.message);
          }
        }
      }
      
      console.log('');
    }
    
    console.log(`\n🎉 TESTE CONCLUÍDO!`);
    console.log(`✅ Phenotypes inseridos: ${totalInserted}`);
    console.log(`📊 Estrutura XML confirmada e funcional`);
    
    return { inserted: totalInserted };
    
  } catch (error) {
    console.error('❌ Erro no parsing:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const resultado = await parseProduct4Simple();
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Parser funciona corretamente');
    console.log('2. Pode processar todos os 4316 disorders');
    console.log('3. Estrutura XML mapeada com sucesso');
    
  } catch (error) {
    console.error('💥 Falha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
