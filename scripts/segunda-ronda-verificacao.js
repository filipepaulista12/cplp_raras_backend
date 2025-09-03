/**
 * SEGUNDA RONDA - VERIFICAÇÃO COMPLETA
 * Busca por QUALQUER arquivo relacionado a BD que possa ter ficado para trás
 */

const fs = require('fs');
const path = require('path');

function segundaRondaVerificacao() {
  console.log('🔍 SEGUNDA RONDA - VERIFICAÇÃO COMPLETA\n');
  console.log('==========================================\n');
  
  const arquivosRestantes = {
    bancos: [],
    schemas: [],
    scriptsbd: [],
    dadosbd: [],
    configs: [],
    outros: []
  };

  // Função para verificar se arquivo é relacionado a BD
  function isRelacionadoBD(filePath, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const nameUpper = fileName.toUpperCase();
    
    // Bancos de dados
    if (ext === '.db' || ext === '.sqlite' || ext === '.sqlite3') {
      return 'bancos';
    }
    
    // Schemas
    if (fileName.includes('schema') || fileName.includes('prisma') || ext === '.prisma') {
      return 'schemas';
    }
    
    // Scripts BD
    if (nameUpper.includes('POPULATE') || nameUpper.includes('IMPORT') || 
        nameUpper.includes('PROCESS') || nameUpper.includes('PARSE') ||
        nameUpper.includes('GARD') || nameUpper.includes('ORPHA') ||
        nameUpper.includes('HPO') || nameUpper.includes('DRUG') ||
        nameUpper.includes('DATABASE') || nameUpper.includes('SQL') ||
        nameUpper.includes('PRISMA') || nameUpper.includes('MIGRATION')) {
      return 'scriptsbd';
    }
    
    // Dados BD
    if ((ext === '.xml' || ext === '.json' || ext === '.csv' || ext === '.txt' || ext === '.tsv') &&
        (nameUpper.includes('ORPHAN') || nameUpper.includes('HPO') || 
         nameUpper.includes('DRUG') || nameUpper.includes('GARD') ||
         nameUpper.includes('PHENOTYPE') || nameUpper.includes('GENE'))) {
      return 'dadosbd';
    }
    
    // Configs BD
    if (nameUpper.includes('DATABASE') || nameUpper.includes('DB_') ||
        nameUpper.includes('PRISMA') || fileName.includes('connection')) {
      return 'configs';
    }
    
    return null;
  }

  // Escanear diretórios
  function escanearDiretorio(dirPath, baseDir = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(baseDir, item);
        
        // Pular pastas que sabemos que são do Next.js
        if (item === 'node_modules' || item === '.next' || 
            item === '.git' || item.startsWith('cplp_raras_backend') ||
            item === 'temp_restore' || item === 'temp_restore2') {
          continue;
        }
        
        try {
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            escanearDiretorio(fullPath, relativePath);
          } else if (stats.isFile()) {
            const categoria = isRelacionadoBD(relativePath, item);
            if (categoria) {
              arquivosRestantes[categoria].push(relativePath);
            }
          }
        } catch (e) {
          // Ignorar erros de acesso
        }
      }
    } catch (e) {
      console.log(`⚠️ Erro acessando ${dirPath}`);
    }
  }

  // Iniciar escaneamento
  escanearDiretorio('./');
  
  return arquivosRestantes;
}

function exibirResultados(arquivos) {
  let totalRestante = 0;
  
  console.log('📊 RESULTADO DA SEGUNDA RONDA:\n');
  
  console.log('💾 BANCOS DE DADOS RESTANTES:');
  if (arquivos.bancos.length > 0) {
    arquivos.bancos.forEach(file => console.log(`   ❌ ${file}`));
    totalRestante += arquivos.bancos.length;
  } else {
    console.log('   ✅ Nenhum banco de dados encontrado!');
  }
  console.log(`   Total: ${arquivos.bancos.length} arquivos\n`);
  
  console.log('📋 SCHEMAS RESTANTES:');
  if (arquivos.schemas.length > 0) {
    arquivos.schemas.forEach(file => console.log(`   ❌ ${file}`));
    totalRestante += arquivos.schemas.length;
  } else {
    console.log('   ✅ Nenhum schema encontrado!');
  }
  console.log(`   Total: ${arquivos.schemas.length} arquivos\n`);
  
  console.log('⚙️ SCRIPTS BD RESTANTES:');
  if (arquivos.scriptsbd.length > 0) {
    arquivos.scriptsbd.forEach(file => console.log(`   ❌ ${file}`));
    totalRestante += arquivos.scriptsbd.length;
  } else {
    console.log('   ✅ Nenhum script BD encontrado!');
  }
  console.log(`   Total: ${arquivos.scriptsbd.length} arquivos\n`);
  
  console.log('📦 DADOS BD RESTANTES:');
  if (arquivos.dadosbd.length > 0) {
    arquivos.dadosbd.forEach(file => console.log(`   ❌ ${file}`));
    totalRestante += arquivos.dadosbd.length;
  } else {
    console.log('   ✅ Nenhum dado BD encontrado!');
  }
  console.log(`   Total: ${arquivos.dadosbd.length} arquivos\n`);
  
  console.log('⚙️ CONFIGS BD RESTANTES:');
  if (arquivos.configs.length > 0) {
    arquivos.configs.forEach(file => console.log(`   ❌ ${file}`));
    totalRestante += arquivos.configs.length;
  } else {
    console.log('   ✅ Nenhuma config BD encontrada!');
  }
  console.log(`   Total: ${arquivos.configs.length} arquivos\n`);
  
  if (totalRestante === 0) {
    console.log('🎉 ================================');
    console.log('🎉 LIMPEZA 100% COMPLETA!');
    console.log('🎉 ================================\n');
    console.log('✅ NENHUM arquivo de BD foi encontrado!');
    console.log('✅ Projeto Next.js está LIMPO!');
    console.log('✅ Separação foi PERFEITA!');
  } else {
    console.log('⚠️ ================================');
    console.log(`⚠️ ${totalRestante} ARQUIVOS RESTANTES!`);
    console.log('⚠️ ================================\n');
    console.log('📋 Estes arquivos precisam ser removidos:');
  }
}

// EXECUTAR VERIFICAÇÃO
const arquivosRestantes = segundaRondaVerificacao();
exibirResultados(arquivosRestantes);

console.log('\n🔍 Verificação concluída!');
