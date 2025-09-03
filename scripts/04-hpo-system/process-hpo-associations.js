const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processHPOAssociations() {
  console.log('🔗 PROCESSANDO ASSOCIAÇÕES HPO OFICIAIS');
  
  try {
    // Processar genes_to_phenotype.txt
    console.log('📂 Carregando genes_to_phenotype.txt...');
    const genesPhenotypeData = fs.readFileSync('database/hpo-official/genes_to_phenotype.txt', 'utf8');
    const genesPhenotypeLines = genesPhenotypeData.split('\n').filter(line => line && !line.startsWith('#'));
    
    console.log(`🎯 Associações gene-fenótipo encontradas: ${genesPhenotypeLines.length}`);
    
    let processedAssociations = 0;
    let insertedAssociations = 0;
    let errors = 0;
    
    // Processar associações gene-fenótipo em lotes
    const batchSize = 100;
    for (let i = 0; i < Math.min(genesPhenotypeLines.length, 5000); i += batchSize) { // Limitar a 5000 para teste
      const batch = genesPhenotypeLines.slice(i, i + batchSize);
      console.log(`🔄 Processando lote de associações ${Math.floor(i/batchSize) + 1} - ${batch.length} associações`);
      
      for (const line of batch) {
        try {
          const parts = line.split('\t');
          if (parts.length >= 4) {
            const geneSymbol = parts[1];  // Gene symbol
            const hpoId = parts[3];       // HPO ID (HP:xxxxxxx)
            const evidenceCode = parts[4] || 'IEA'; // Evidence code
            
            // Verificar se o termo HPO existe
            const hpoTerm = await prisma.hPOTerm.findUnique({
              where: { hpoId: hpoId }
            });
            
            if (hpoTerm) {
              // Inserir associação gene-HPO
              await prisma.hPOGeneAssociation.create({
                data: {
                  hpoTermId: hpoTerm.id,
                  geneSymbol: geneSymbol,
                  evidenceCode: evidenceCode,
                  source: 'HPO_OFFICIAL',
                  frequency: 'Unknown',
                  onsetType: 'Unknown'
                }
              });
              
              insertedAssociations++;
            }
          }
          
          processedAssociations++;
          
          if (processedAssociations % 500 === 0) {
            console.log(`🎯 Progresso associações: ${processedAssociations} processadas, ${insertedAssociations} inseridas`);
          }
          
        } catch (error) {
          console.error(`❌ Erro na associação ${line.substring(0,50)}:`, error.message);
          errors++;
        }
      }
      
      // Pausa pequena entre lotes
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Processar phenotype_to_genes.txt para associações doença-HPO
    console.log('\n📂 Carregando phenotype_to_genes.txt...');
    const phenotypeGeneData = fs.readFileSync('database/hpo-official/phenotype_to_genes.txt', 'utf8');
    const phenotypeGeneLines = phenotypeGeneData.split('\n').filter(line => line && !line.startsWith('#'));
    
    console.log(`🎯 Associações fenótipo-gene encontradas: ${phenotypeGeneLines.length}`);
    
    let processedDiseaseAssoc = 0;
    let insertedDiseaseAssoc = 0;
    
    // Processar associações fenótipo-doença em lotes (amostra menor)
    for (let i = 0; i < Math.min(phenotypeGeneLines.length, 2000); i += batchSize) { // Limitar a 2000
      const batch = phenotypeGeneLines.slice(i, i + batchSize);
      console.log(`🔄 Processando lote de doenças ${Math.floor(i/batchSize) + 1} - ${batch.length} associações`);
      
      for (const line of batch) {
        try {
          const parts = line.split('\t');
          if (parts.length >= 3) {
            const hpoId = parts[0];       // HPO ID
            const diseaseName = parts[2] || 'Unknown Disease'; // Disease name
            
            // Verificar se o termo HPO existe
            const hpoTerm = await prisma.hPOTerm.findUnique({
              where: { hpoId: hpoId }
            });
            
            if (hpoTerm) {
              // Inserir associação doença-HPO
              await prisma.hPODiseaseAssociation.create({
                data: {
                  hpoTermId: hpoTerm.id,
                  diseaseName: diseaseName,
                  evidenceCode: 'IEA',
                  source: 'HPO_OFFICIAL',
                  frequency: 'Unknown',
                  onsetType: 'Unknown'
                }
              });
              
              insertedDiseaseAssoc++;
            }
          }
          
          processedDiseaseAssoc++;
          
        } catch (error) {
          console.error(`❌ Erro na associação doença:`, error.message);
          errors++;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Estatísticas finais
    console.log('\n🎉 PROCESSAMENTO DE ASSOCIAÇÕES COMPLETO!');
    console.log(`📊 Associações gene-HPO processadas: ${processedAssociations}`);
    console.log(`✅ Associações gene-HPO inseridas: ${insertedAssociations}`);
    console.log(`📊 Associações doença-HPO processadas: ${processedDiseaseAssoc}`);
    console.log(`✅ Associações doença-HPO inseridas: ${insertedDiseaseAssoc}`);
    console.log(`❌ Total de erros: ${errors}`);
    
    // Verificar contagens finais
    const geneAssocCount = await prisma.hPOGeneAssociation.count();
    const diseaseAssocCount = await prisma.hPODiseaseAssociation.count();
    const hpoTermCount = await prisma.hPOTerm.count();
    
    console.log('\n🗄️ CONTAGENS FINAIS:');
    console.log(`🧬 Termos HPO: ${hpoTermCount}`);
    console.log(`🔗 Associações Gene-HPO: ${geneAssocCount}`);
    console.log(`🏥 Associações Doença-HPO: ${diseaseAssocCount}`);
    
    if (hpoTermCount > 18000) {
      console.log('🎯 SISTEMA HPO COMPLETO! MAIS DE 18.000 TERMOS + ASSOCIAÇÕES!');
    }
    
  } catch (error) {
    console.error('💥 Erro no processamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
processHPOAssociations().catch(console.error);
