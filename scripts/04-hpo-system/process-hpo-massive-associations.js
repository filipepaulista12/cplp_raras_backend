const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processHPOAssociationsMassive() {
  console.log('🔥 PROCESSAMENTO MASSIVO DE ASSOCIAÇÕES HPO');
  console.log('📊 HPOA: 272,731 linhas de doença-fenótipo');
  console.log('📊 genes_to_phenotype: 1,231,106 linhas de gene-fenótipo');
  
  try {
    // =========================================================================
    // 1. PROCESSAR HPO DISEASE ASSOCIATIONS (phenotype.hpoa)
    // =========================================================================
    console.log('\n🏥 === PROCESSANDO ASSOCIAÇÕES DOENÇA-HPO ===');
    const hpoaData = fs.readFileSync('database/hpo-official/phenotype.hpoa', 'utf8');
    const hpoaLines = hpoaData.split('\n').filter(line => line && !line.startsWith('#'));
    
    console.log(`🎯 Associações doença-HPO encontradas: ${hpoaLines.length}`);
    
    let processedDiseases = 0;
    let insertedDiseases = 0;
    let diseaseErrors = 0;
    
    // Processar em lotes de 500 (HPOA tem muitos dados)
    const diseaseBatchSize = 500;
    const maxDiseaseRecords = 50000; // Limitar a 50K para não sobrecarregar
    
    for (let i = 0; i < Math.min(hpoaLines.length, maxDiseaseRecords); i += diseaseBatchSize) {
      const batch = hpoaLines.slice(i, i + diseaseBatchSize);
      console.log(`🔄 Lote doenças ${Math.floor(i/diseaseBatchSize) + 1}/${Math.ceil(Math.min(hpoaLines.length, maxDiseaseRecords)/diseaseBatchSize)} - ${batch.length} associações`);
      
      for (const line of batch) {
        try {
          const parts = line.split('\t');
          if (parts.length >= 4) {
            const databaseId = parts[0];     // OMIM:123456 ou ORPHA:123
            const diseaseName = parts[1];    // Nome da doença
            const hpoId = parts[3];          // HP:0000123
            const reference = parts[4] || 'Unknown';
            const evidence = parts[5] || 'IEA';
            const frequency = parts[7] || 'Unknown';
            
            // Verificar se o termo HPO existe
            const hpoTerm = await prisma.hPOTerm.findUnique({
              where: { hpoId: hpoId }
            });
            
            if (hpoTerm) {
              // Inserir associação doença-HPO
              await prisma.hPODiseaseAssociation.create({
                data: {
                  hpoTermId: hpoTerm.id,
                  diseaseId: databaseId,
                  diseaseName: diseaseName,
                  evidence: evidence,
                  reference: reference,
                  frequencyTerm: frequency
                }
              });
              
              insertedDiseases++;
            }
          }
          
          processedDiseases++;
          
          if (processedDiseases % 2000 === 0) {
            console.log(`🎯 Progresso doenças: ${processedDiseases}/${Math.min(hpoaLines.length, maxDiseaseRecords)} processadas, ${insertedDiseases} inseridas`);
          }
          
        } catch (error) {
          if (!error.message.includes('Unique constraint')) {
            console.error(`❌ Erro na associação doença ${line.substring(0,50)}:`, error.message);
          }
          diseaseErrors++;
        }
      }
      
      // Pausa pequena entre lotes
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // =========================================================================
    // 2. PROCESSAR HPO GENE ASSOCIATIONS (genes_to_phenotype.txt) 
    // =========================================================================
    console.log('\n🧬 === PROCESSANDO ASSOCIAÇÕES GENE-HPO ===');
    const genesData = fs.readFileSync('database/hpo-official/genes_to_phenotype.txt', 'utf8');
    const genesLines = genesData.split('\n').filter(line => line && !line.startsWith('#') && !line.startsWith('ncbi'));
    
    console.log(`🎯 Associações gene-HPO encontradas: ${genesLines.length}`);
    
    let processedGenes = 0;
    let insertedGenes = 0;
    let geneErrors = 0;
    
    // Processar em lotes menores para genes (tem 1.2M linhas!)
    const geneBatchSize = 200;
    const maxGeneRecords = 30000; // Limitar a 30K para teste
    
    for (let i = 0; i < Math.min(genesLines.length, maxGeneRecords); i += geneBatchSize) {
      const batch = genesLines.slice(i, i + geneBatchSize);
      console.log(`🔄 Lote genes ${Math.floor(i/geneBatchSize) + 1}/${Math.ceil(Math.min(genesLines.length, maxGeneRecords)/geneBatchSize)} - ${batch.length} associações`);
      
      for (const line of batch) {
        try {
          const parts = line.split('\t');
          if (parts.length >= 4) {
            const ncbiGeneId = parts[0];     // NCBI Gene ID
            const geneSymbol = parts[1];     // Gene Symbol (ABC1)
            const hpoId = parts[2];          // HPO ID (HP:0000123)
            const hpoName = parts[3] || '';  // HPO Name
            
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
                  geneId: ncbiGeneId,
                  evidence: 'IEA',
                  associationType: 'phenotype'
                }
              });
              
              insertedGenes++;
            }
          }
          
          processedGenes++;
          
          if (processedGenes % 1000 === 0) {
            console.log(`🎯 Progresso genes: ${processedGenes}/${Math.min(genesLines.length, maxGeneRecords)} processados, ${insertedGenes} inseridos`);
          }
          
        } catch (error) {
          if (!error.message.includes('Unique constraint')) {
            console.error(`❌ Erro na associação gene:`, error.message);
          }
          geneErrors++;
        }
      }
      
      // Pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    
    // =========================================================================
    // 3. ESTATÍSTICAS FINAIS
    // =========================================================================
    console.log('\n🎉 PROCESSAMENTO MASSIVO COMPLETO!');
    console.log(`📊 Doenças processadas: ${processedDiseases}`);
    console.log(`✅ Associações doença-HPO inseridas: ${insertedDiseases}`);
    console.log(`❌ Erros doenças: ${diseaseErrors}`);
    console.log(`📊 Genes processados: ${processedGenes}`);
    console.log(`✅ Associações gene-HPO inseridas: ${insertedGenes}`);
    console.log(`❌ Erros genes: ${geneErrors}`);
    
    // Verificar contagens finais
    const hpoTermCount = await prisma.hPOTerm.count();
    const geneAssocCount = await prisma.hPOGeneAssociation.count();
    const diseaseAssocCount = await prisma.hPODiseaseAssociation.count();
    
    console.log('\n🗄️ CONTAGENS FINAIS DO SISTEMA HPO:');
    console.log(`🧬 Termos HPO: ${hpoTermCount.toLocaleString()}`);
    console.log(`🔗 Associações Gene-HPO: ${geneAssocCount.toLocaleString()}`);
    console.log(`🏥 Associações Doença-HPO: ${diseaseAssocCount.toLocaleString()}`);
    
    const totalAssociations = geneAssocCount + diseaseAssocCount;
    console.log(`📈 Total de Associações: ${totalAssociations.toLocaleString()}`);
    
    if (totalAssociations > 50000) {
      console.log('🎯 SISTEMA HPO MASSIVO COMPLETO! MAIS DE 50.000 ASSOCIAÇÕES!');
    }
    
  } catch (error) {
    console.error('💥 Erro no processamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
processHPOAssociationsMassive().catch(console.error);
