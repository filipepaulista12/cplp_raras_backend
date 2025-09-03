const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct9PrevStructure() {
  console.log('📊 ANÁLISE PRODUCT9_PREV - EPIDEMIOLOGY DATA');
  console.log('==========================================\n');
  
  try {
    const xmlPath = 'database/orphadata-sources/en_product9_prev.xml';
    const stats = fs.statSync(xmlPath);
    console.log(`📁 Arquivo: ${xmlPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
    
    console.log('🔄 Parseando XML...');
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
          
          // Analisar primeiros disorders
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
            
            // Procurar informações epidemiológicas
            Object.keys(disorder).forEach(key => {
              if (key.toLowerCase().includes('prevalence') || 
                  key.toLowerCase().includes('epidemio') || 
                  key.toLowerCase().includes('frequency') ||
                  key.toLowerCase().includes('incidence')) {
                console.log(`🎯 EPIDEMIOLOGY FIELD: ${key}`);
                const content = JSON.stringify(disorder[key], null, 2);
                console.log('Content:', content.substring(0, 500) + '...');
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
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeProduct9PrevStructure();
