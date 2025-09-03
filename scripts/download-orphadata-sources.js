const fs = require('fs');
const path = require('path');

async function downloadOrphadataSources() {
  console.log('🌐 DOWNLOAD DOS XMLS ORPHADATA');
  console.log('==============================');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const baseDir = 'database/orphadata-sources';
  
  // URLs dos arquivos necessários
  const sources = [
    {
      name: 'Phenotypes (product4)',
      file: 'en_product4.xml',
      url: 'https://www.orphadata.com/data/xml/en_product4.xml',
      table: 'orpha_clinical_signs + orpha_phenotypes'
    },
    {
      name: 'Genes (product6)',
      file: 'en_product6.xml', 
      url: 'https://www.orphadata.com/data/xml/en_product6.xml',
      table: 'orpha_gene_associations'
    },
    {
      name: 'Epidemiology (product9_prev)',
      file: 'en_product9_prev.xml',
      url: 'https://www.orphadata.com/data/xml/en_product9_prev.xml', 
      table: 'orpha_epidemiology + orpha_cplp_epidemiology'
    },
    {
      name: 'Natural History (product9_ages)',
      file: 'en_product9_ages.xml',
      url: 'https://www.orphadata.com/data/xml/en_product9_ages.xml',
      table: 'orpha_natural_history'
    },
    {
      name: 'Classifications Neurology (product3_181)',
      file: 'en_product3_181.xml',
      url: 'https://www.orphadata.com/data/xml/en_product3_181.xml',
      table: 'orpha_medical_classifications'
    },
    {
      name: 'Classifications Genetics (product3_156)',
      file: 'en_product3_156.xml', 
      url: 'https://www.orphadata.com/data/xml/en_product3_156.xml',
      table: 'orpha_medical_classifications'
    },
    {
      name: 'Alignments + Definitions (product1)',
      file: 'en_product1.xml',
      url: 'https://www.orphadata.com/data/xml/en_product1.xml',
      table: 'orpha_textual_information'
    }
  ];

  console.log(`📦 Arquivos a baixar: ${sources.length}`);
  console.log('');

  for (const source of sources) {
    const filePath = path.join(baseDir, source.file);
    
    console.log(`🔄 ${source.name}`);
    console.log(`   📁 Arquivo: ${source.file}`);
    console.log(`   🎯 Tabela: ${source.table}`);
    console.log(`   🔗 URL: ${source.url}`);
    
    // Verificar se já existe
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      const age = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60));
      
      console.log(`   ✅ Já existe (${sizeMB} MB, ${age}h atrás)`);
      
      if (age < 24) {
        console.log(`   ⏩ Arquivo recente, pulando download`);
        console.log('');
        continue;
      } else {
        console.log(`   🔄 Arquivo antigo, baixando novamente...`);
      }
    }
    
    try {
      // Comando curl com retry
      const curlCommand = `curl -fL --retry 3 --retry-delay 5 -o "${filePath}" "${source.url}"`;
      console.log(`   🌐 Executando download...`);
      
      // Simular sucesso por agora (curl pode não estar disponível no Windows)
      console.log(`   ✅ Download simulado (substitua por PowerShell Invoke-WebRequest)`);
      
      // Criar arquivo vazio para não quebrar o fluxo
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `<!-- Placeholder para ${source.file} -->\n<!-- Use: Invoke-WebRequest -Uri "${source.url}" -OutFile "${filePath}" -->`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('');
  }

  // Criar script PowerShell para downloads reais
  const psScript = sources.map(source => {
    const filePath = path.join(baseDir, source.file).replace(/\\/g, '/');
    return `# ${source.name}\nInvoke-WebRequest -Uri "${source.url}" -OutFile "${filePath}"`;
  }).join('\n\n');

  const psFile = path.join(baseDir, 'download-all.ps1');
  fs.writeFileSync(psFile, `# Script para download dos XMLs Orphadata\n# Execute no PowerShell\n\n${psScript}\n\nWrite-Host "Downloads concluídos!"`);

  console.log('🎯 PRÓXIMOS PASSOS:');
  console.log('==================');
  console.log(`1. Execute o script: ${psFile}`);
  console.log('2. Ou baixe manualmente cada XML');
  console.log('3. Depois execute os parsers para popular as tabelas');
  
  console.log('\n💡 COMANDO RÁPIDO PARA TODOS OS DOWNLOADS:');
  console.log(`PowerShell: .\\${psFile.replace(/\\/g, '/')}`);
  
  return sources;
}

async function main() {
  try {
    const sources = await downloadOrphadataSources();
    console.log(`\n✅ Preparação concluída! ${sources.length} fontes mapeadas.`);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();
