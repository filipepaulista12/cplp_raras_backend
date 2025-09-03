const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeXmlStructure() {
  console.log('🔍 ANÁLISE PROFUNDA DA ESTRUTURA XML');
  console.log('==================================\n');
  
  try {
    const xmlPath = 'database/orphadata-sources/en_product4.xml';
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    console.log('🎯 ESTRUTURA RAIZ:');
    console.log('Keys:', Object.keys(result));
    
    if (result.JDBOR) {
      console.log('\n🎯 JDBOR Keys:');
      console.log('Keys:', Object.keys(result.JDBOR));
      
      if (result.JDBOR.HPODisorderSetStatusList) {
        console.log('\n🎯 HPODisorderSetStatusList:');
        console.log('Length:', result.JDBOR.HPODisorderSetStatusList.length);
        
        if (result.JDBOR.HPODisorderSetStatusList[0].HPODisorderSetStatus) {
          const hpoList = result.JDBOR.HPODisorderSetStatusList[0].HPODisorderSetStatus;
          console.log('HPODisorderSetStatus Length:', hpoList.length);
          
          // Analisar primeiro item
          console.log('\n🔬 ANÁLISE DO PRIMEIRO ITEM:');
          const first = hpoList[0];
          console.log('First item keys:', Object.keys(first));
          
          if (first.Disorder) {
            console.log('\n🔬 DISORDER STRUCTURE:');
            console.log('Disorder length:', first.Disorder.length);
            const disorder = first.Disorder[0];
            console.log('Disorder keys:', Object.keys(disorder));
            
            // Mostrar todos os valores possíveis
            Object.keys(disorder).forEach(key => {
              console.log(`   ${key}:`, JSON.stringify(disorder[key], null, 2).substring(0, 100) + '...');
            });
          }
          
          // Tentar encontrar onde está o OrphaNumber
          console.log('\n🔍 PROCURANDO ORPHA NUMBERS...');
          for (let i = 0; i < Math.min(5, hpoList.length); i++) {
            const item = hpoList[i];
            console.log(`\nItem ${i + 1}:`);
            console.log('Keys:', Object.keys(item));
            
            if (item.Disorder && item.Disorder[0]) {
              const disorder = item.Disorder[0];
              console.log('  Disorder keys:', Object.keys(disorder));
              
              // Procurar por qualquer campo que tenha "Orpha" no nome
              Object.keys(disorder).forEach(key => {
                if (key.toLowerCase().includes('orpha')) {
                  console.log(`    🎯 FOUND: ${key} =`, disorder[key]);
                }
              });
              
              // Mostrar alguns valores para debug
              if (disorder.Name) {
                console.log('    Name:', disorder.Name[0]);
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

analyzeXmlStructure();
