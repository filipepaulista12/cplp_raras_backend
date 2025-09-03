const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct1Correct() {
  console.log('📚 ANÁLISE PRODUCT1 - TEXTUAL INFORMATION (CORRIGIDA)');
  console.log('====================================================\n');
  
  try {
    const xmlPath = 'database/orphadata-sources/en_product1.xml';
    const stats = fs.statSync(xmlPath);
    console.log(`📁 Arquivo: ${xmlPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
    
    console.log('🔄 Parseando amostra do XML...');
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    console.log('✅ XML parseado com sucesso!\n');
    
    console.log('🎯 ESTRUTURA RAIZ:');
    console.log('Keys:', Object.keys(result));
    
    if (result.JDBOR && result.JDBOR.DisorderList) {
      console.log('\n🎯 DisorderList:');
      console.log('Length:', result.JDBOR.DisorderList.length);
      
      if (result.JDBOR.DisorderList[0].Disorder) {
        const disorders = result.JDBOR.DisorderList[0].Disorder;
        console.log('Disorders Length:', disorders.length);
        
        // Analisar primeiro disorder
        console.log('\n🔬 ANÁLISE DOS PRIMEIROS 3 DISORDERS:');
        for (let i = 0; i < Math.min(3, disorders.length); i++) {
          const disorder = disorders[i];
          console.log(`\n--- Disorder ${i + 1} ---`);
          console.log('Keys:', Object.keys(disorder));
          
          // Mostrar OrphaCode e Name
          if (disorder.OrphaCode) {
            console.log('OrphaCode:', disorder.OrphaCode[0]);
          }
          if (disorder.Name) {
            console.log('Name:', disorder.Name[0]?._ || disorder.Name[0]);
          }
          
          // Procurar informações textuais
          Object.keys(disorder).forEach(key => {
            if (key.toLowerCase().includes('text') || 
                key.toLowerCase().includes('summary') || 
                key.toLowerCase().includes('definition') ||
                key.toLowerCase().includes('description') ||
                key.toLowerCase().includes('clinical')) {
              console.log(`🎯 TEXT FIELD FOUND: ${key}`);
              const content = JSON.stringify(disorder[key], null, 2);
              console.log('Content preview:', content.substring(0, 400) + '...');
            }
          });
          
          // Mostrar todos os campos para entender estrutura
          console.log('All available fields:');
          Object.keys(disorder).forEach(key => {
            const value = disorder[key];
            if (Array.isArray(value) && value.length > 0) {
              if (typeof value[0] === 'string') {
                console.log(`   ${key}: "${value[0].substring(0, 80)}..."`);
              } else if (typeof value[0] === 'object' && value[0]._) {
                console.log(`   ${key}: "${value[0]._.substring(0, 80)}..."`);
              } else {
                console.log(`   ${key}: [${typeof value[0]}]`);
              }
            }
          });
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeProduct1Correct();
