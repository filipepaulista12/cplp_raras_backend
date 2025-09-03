const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct1Structure() {
  console.log('📚 ANÁLISE PRODUCT1 - TEXTUAL INFORMATION');
  console.log('========================================\n');
  
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
    
    if (result.JDBOR) {
      console.log('\n🎯 JDBOR Keys:');
      console.log('Keys:', Object.keys(result.JDBOR));
      
      if (result.JDBOR.HPODisorderSetStatusList) {
        console.log('\n🎯 HPODisorderSetStatusList:');
        console.log('Length:', result.JDBOR.HPODisorderSetStatusList.length);
        
        if (result.JDBOR.HPODisorderSetStatusList[0].HPODisorderSetStatus) {
          const disorders = result.JDBOR.HPODisorderSetStatusList[0].HPODisorderSetStatus;
          console.log('HPODisorderSetStatus Length:', disorders.length);
          
          // Analisar primeiro disorder
          console.log('\n🔬 ANÁLISE DOS PRIMEIROS 3 DISORDERS:');
          for (let i = 0; i < Math.min(3, disorders.length); i++) {
            const disorder = disorders[i];
            console.log(`\n--- Disorder ${i + 1} ---`);
            console.log('Keys:', Object.keys(disorder));
            
            if (disorder.Disorder && disorder.Disorder[0]) {
              const disorderData = disorder.Disorder[0];
              console.log('Disorder keys:', Object.keys(disorderData));
              
              // Mostrar OrphaCode
              if (disorderData.OrphaCode) {
                console.log('OrphaCode:', disorderData.OrphaCode[0]);
              }
              
              // Procurar informações textuais
              Object.keys(disorderData).forEach(key => {
                if (key.toLowerCase().includes('text') || 
                    key.toLowerCase().includes('summary') || 
                    key.toLowerCase().includes('definition') ||
                    key.toLowerCase().includes('description')) {
                  console.log(`🎯 TEXT FIELD: ${key}`);
                  const content = JSON.stringify(disorderData[key], null, 2);
                  console.log('Content preview:', content.substring(0, 300) + '...');
                }
              });
              
              // Mostrar todos os campos para entender estrutura
              console.log('All fields:');
              Object.keys(disorderData).forEach(key => {
                const value = disorderData[key];
                if (Array.isArray(value) && value.length > 0) {
                  if (typeof value[0] === 'string') {
                    console.log(`   ${key}: "${value[0].substring(0, 50)}..."`);
                  } else if (typeof value[0] === 'object' && value[0]._) {
                    console.log(`   ${key}: "${value[0]._.substring(0, 50)}..."`);
                  } else {
                    console.log(`   ${key}: [object]`);
                  }
                }
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

analyzeProduct1Structure();
