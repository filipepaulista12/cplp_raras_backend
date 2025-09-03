const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processOfficialHPO() {
  console.log('🚀 PROCESSANDO DADOS OFICIAIS HPO - MAIS DE 18.000 TERMOS!');
  
  try {
    // Ler arquivo JSON oficial (40.5 MB)
    console.log('📂 Carregando hp-full.json (40.5 MB)...');
    const hpoData = JSON.parse(fs.readFileSync('database/hpo-official/hp-full.json', 'utf8'));
    
    console.log('📊 Estrutura do arquivo:', Object.keys(hpoData));
    
    if (!hpoData.graphs || !hpoData.graphs[0] || !hpoData.graphs[0].nodes) {
      throw new Error('Estrutura JSON inválida');
    }
    
    const nodes = hpoData.graphs[0].nodes;
    console.log(`🎯 Total de NODES encontrados: ${nodes.length}`);
    
    // Filtrar apenas termos HPO (HP:xxxxxxx)
    const hpoTerms = nodes.filter(node => 
      node.id && 
      node.id.includes('HP_') && 
      node.lbl && // Tem label
      !node.id.includes('_obsolete') // Não é obsoleto
    );
    
    console.log(`✅ Termos HPO válidos encontrados: ${hpoTerms.length}`);
    
    // Processar em lotes de 100
    const batchSize = 100;
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < hpoTerms.length; i += batchSize) {
      const batch = hpoTerms.slice(i, i + batchSize);
      console.log(`🔄 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(hpoTerms.length/batchSize)} - ${batch.length} termos`);
      
      for (const term of batch) {
        try {
          // Extrair HPO ID
          const hpoId = term.id.replace('http://purl.obolibrary.org/obo/HP_', 'HP:');
          const label = term.lbl;
          
          // Extrair definição se disponível
          let definition = '';
          if (term.meta && term.meta.definition && term.meta.definition.val) {
            definition = term.meta.definition.val;
          }
          
          // Extrair sinônimos
          let synonyms = [];
          if (term.meta && term.meta.synonyms) {
            synonyms = term.meta.synonyms.map(syn => syn.val || syn).slice(0, 5); // Máximo 5 sinônimos
          }
          
          // Extrair código HPO (sem prefixo)
          const hpoCode = hpoId.replace('HP:', '');
          
          // Tentar inserir ou atualizar
          const result = await prisma.hPOTerm.upsert({
            where: { hpoId: hpoId },
            update: {
              name: label,
              definition: definition,
              exactSynonyms: JSON.stringify(synonyms),
              updatedAt: new Date()
            },
            create: {
              hpoId: hpoId,
              hpoCode: hpoCode,
              name: label,
              definition: definition,
              exactSynonyms: JSON.stringify(synonyms)
            }
          });
          
          if (result.createdAt.getTime() === result.updatedAt.getTime()) {
            inserted++;
          } else {
            updated++;
          }
          
          processed++;
          
          if (processed % 500 === 0) {
            console.log(`🎯 Progresso: ${processed}/${hpoTerms.length} processados`);
          }
          
        } catch (error) {
          console.error(`❌ Erro no termo ${term.id}:`, error.message);
          errors++;
        }
      }
      
      // Pausa pequena entre lotes
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Estatísticas finais
    console.log('\n🎉 PROCESSAMENTO COMPLETO!');
    console.log(`📊 Total processado: ${processed} termos`);
    console.log(`✅ Novos inseridos: ${inserted}`);
    console.log(`🔄 Atualizados: ${updated}`);
    console.log(`❌ Erros: ${errors}`);
    
    // Verificar contagem final
    const totalCount = await prisma.hPOTerm.count();
    console.log(`🗄️ Total de termos HPO na base: ${totalCount}`);
    
    if (totalCount > 15000) {
      console.log('🎯 META ATINGIDA! MAIS DE 15.000 TERMOS HPO!');
    }
    
  } catch (error) {
    console.error('💥 Erro no processamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
processOfficialHPO().catch(console.error);
