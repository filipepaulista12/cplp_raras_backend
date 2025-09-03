const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct6Structure() {
  console.log('🧬 ANÁLISE PRODUCT6 - GENE ASSOCIATIONS');
  console.log('====================================\n');
  
  try {
    const xmlPath = 'database/orphadata-sources/en_product6.xml';
    const stats = fs.statSync(xmlPath);
    console.log(`📁 Arquivo: ${xmlPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
    
    // Ler uma pequena parte do XML primeiro
    console.log('🔄 Parseando amostra do XML...');
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    console.log('✅ XML parseado com sucesso!\n');
    
    console.log('🎯 ESTRUTURA RAIZ:');
    console.log('Keys:', Object.keys(result));
    
    if (result.JDBOR) {
      console.log('\n🎯 JDBOR Keys:');
      console.log('Keys:', Object.keys(result.JDBOR));
      
      if (result.JDBOR.DisorderList) {
        console.log('\n🎯 DisorderList:');
        console.log('Length:', result.JDBOR.DisorderList.length);
        
        if (result.JDBOR.DisorderList[0].Disorder) {
          const disorders = result.JDBOR.DisorderList[0].Disorder;
          console.log('Disorders Length:', disorders.length);
          
          // Analisar primeiro disorder
          console.log('\n🔬 ANÁLISE DO PRIMEIRO DISORDER:');
          const first = disorders[0];
          console.log('Disorder keys:', Object.keys(first));
          
          // Mostrar informações importantes
          Object.keys(first).forEach(key => {
            console.log(`   ${key}:`, JSON.stringify(first[key], null, 2).substring(0, 200) + '...');
          });
          
          // Procurar associações de genes
          console.log('\n🧬 PROCURANDO GENE ASSOCIATIONS...');
          for (let i = 0; i < Math.min(5, disorders.length); i++) {
            const disorder = disorders[i];
            console.log(`\n--- Disorder ${i + 1} ---`);
            console.log('Keys:', Object.keys(disorder));
            
            // Procurar OrphaCode
            if (disorder.OrphaCode) {
              console.log('OrphaCode:', disorder.OrphaCode[0]);
            }
            
            // Procurar Name
            if (disorder.Name) {
              console.log('Name:', disorder.Name[0]?._ || disorder.Name[0]);
            }
            
            // Procurar gene associations
            Object.keys(disorder).forEach(key => {
              if (key.toLowerCase().includes('gene')) {
                console.log(`🎯 GENE FIELD FOUND: ${key}`);
                console.log('Structure:', JSON.stringify(disorder[key], null, 2).substring(0, 300));
              }
            });
            
            // Procurar DisorderGeneAssociationList
            if (disorder.DisorderGeneAssociationList) {
              console.log('🎯 DisorderGeneAssociationList encontrado!');
              const geneList = disorder.DisorderGeneAssociationList[0];
              if (geneList.DisorderGeneAssociation) {
                console.log(`   Genes: ${geneList.DisorderGeneAssociation.length} associações`);
                
                // Mostrar primeira associação de gene
                if (geneList.DisorderGeneAssociation[0]) {
                  const firstGene = geneList.DisorderGeneAssociation[0];
                  console.log('   Primeira associação keys:', Object.keys(firstGene));
                  
                  if (firstGene.Gene) {
                    const gene = firstGene.Gene[0];
                    console.log('   Gene keys:', Object.keys(gene));
                    if (gene.Symbol) console.log('   Gene Symbol:', gene.Symbol[0]);
                    if (gene.Name) console.log('   Gene Name:', gene.Name[0]);
                  }
                }
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeProduct6Structure();
