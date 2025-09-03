const fs = require('fs');
const xml2js = require('xml2js');

async function analyzeProduct4Structure() {
  console.log('🔍 ANÁLISE DA ESTRUTURA DO PRODUCT4');
  console.log('===================================');
  
  const xmlFile = 'database/orphadata-sources/en_product4.xml';
  
  if (!fs.existsSync(xmlFile)) {
    console.log('❌ Arquivo não encontrado:', xmlFile);
    return;
  }

  try {
    const content = fs.readFileSync(xmlFile, 'utf8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);
    
    console.log('📊 ESTRUTURA ROOT:');
    console.log('Chaves principais:', Object.keys(result));
    
    // Explorar a estrutura
    const root = result[Object.keys(result)[0]];
    console.log('\n📊 NÍVEL 1:');
    if (root && typeof root === 'object') {
      console.log('Chaves do root:', Object.keys(root));
    }
    
    // Procurar por padrões comuns
    function searchKeys(obj, path = '', maxDepth = 3) {
      if (maxDepth <= 0 || !obj || typeof obj !== 'object') return;
      
      for (const [key, value] of Object.entries(obj)) {
        const newPath = path ? `${path}.${key}` : key;
        
        if (key.toLowerCase().includes('disorder') || 
            key.toLowerCase().includes('hpo') || 
            key.toLowerCase().includes('phenotype') ||
            key.toLowerCase().includes('association')) {
          console.log(`🎯 Encontrado: ${newPath}`);
          
          if (Array.isArray(value) && value.length > 0) {
            console.log(`   📊 Array com ${value.length} elementos`);
            if (value[0] && typeof value[0] === 'object') {
              console.log(`   🔑 Chaves do primeiro elemento:`, Object.keys(value[0]).slice(0, 5));
            }
          } else if (value && typeof value === 'object') {
            console.log(`   🔑 Chaves:`, Object.keys(value).slice(0, 5));
          }
        }
        
        if (Array.isArray(value) && value.length > 0) {
          searchKeys(value[0], newPath + '[0]', maxDepth - 1);
        } else if (value && typeof value === 'object') {
          searchKeys(value, newPath, maxDepth - 1);
        }
      }
    }
    
    console.log('\n🔍 BUSCA POR TERMOS RELEVANTES:');
    searchKeys(root);
    
    // Tentar encontrar a estrutura correta
    console.log('\n🎯 TENTANDO ESTRUTURAS COMUNS:');
    
    const possiblePaths = [
      'HPOPhenotypes',
      'HPODisorderSetStatusList',
      'HPODisorderSetStatus', 
      'Disorder',
      'DisorderList',
      'HPODisorderAssociationList',
      'HPODisorderAssociation'
    ];
    
    function findPath(obj, targetKey, currentPath = '') {
      if (!obj || typeof obj !== 'object') return [];
      
      const results = [];
      
      for (const [key, value] of Object.entries(obj)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (key === targetKey) {
          results.push({
            path: newPath,
            isArray: Array.isArray(value),
            length: Array.isArray(value) ? value.length : 'N/A',
            sample: Array.isArray(value) && value.length > 0 ? 
              (typeof value[0] === 'object' ? Object.keys(value[0]).slice(0, 3) : value[0]) : 
              (typeof value === 'object' ? Object.keys(value).slice(0, 3) : value)
          });
        }
        
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            results.push(...findPath(item, targetKey, `${newPath}[${index}]`));
          });
        } else if (value && typeof value === 'object') {
          results.push(...findPath(value, targetKey, newPath));
        }
      }
      
      return results;
    }
    
    for (const pathKey of possiblePaths) {
      const found = findPath(result, pathKey);
      if (found.length > 0) {
        console.log(`\n✅ ${pathKey}:`);
        found.forEach(f => {
          console.log(`   📍 ${f.path} (${f.isArray ? `Array[${f.length}]` : 'Object'})`);
          console.log(`   📋 Sample:`, f.sample);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeProduct4Structure();
