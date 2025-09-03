/**
 * ANÁLISE COMPLETA DE ARQUIVOS DE BANCO DE DADOS
 * Script para identificar TODOS os arquivos relacionados a BD, scripts, dados, etc.
 * SEM EXECUTAR NADA - APENAS ANÁLISE E ORGANIZAÇÃO
 */

const fs = require('fs');
const path = require('path');

function analisarProjeto() {
  console.log('🔍 ANÁLISE COMPLETA DO PROJETO CPLP-RARAS\n');
  console.log('==========================================\n');
  
  const arquivosBD = {
    // Banco de dados principais
    bancos: [],
    
    // Schemas e configurações
    schemas: [],
    
    // Scripts de população/importação
    scriptsPopulacao: [],
    
    // Scripts de análise/relatórios
    scriptsAnalise: [],
    
    // Dados fonte (XML, JSON, CSV, etc)
    dadosFonte: [],
    
    // Backups e exports
    backups: [],
    
    // Configurações de conexão
    configuracoes: [],
    
    // Outros relacionados a BD
    outros: []
  };

  // Função para categorizar arquivo
  function categorizarArquivo(filePath, fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const nameUpper = fileName.toUpperCase();
    
    // Bancos de dados
    if (ext === '.db' || ext === '.sqlite' || ext === '.sqlite3') {
      arquivosBD.bancos.push(filePath);
    }
    // Schemas
    else if (fileName.includes('schema') || fileName.includes('prisma') || ext === '.prisma') {
      arquivosBD.schemas.push(filePath);
    }
    // Scripts de população
    else if (nameUpper.includes('POPULATE') || nameUpper.includes('IMPORT') || 
             nameUpper.includes('PROCESS') || nameUpper.includes('PARSE') ||
             nameUpper.includes('SETUP') || nameUpper.includes('MIGRATION') ||
             fileName.includes('populate') || fileName.includes('import') ||
             fileName.includes('process') || fileName.includes('parse')) {
      arquivosBD.scriptsPopulacao.push(filePath);
    }
    // Scripts de análise
    else if (nameUpper.includes('REPORT') || nameUpper.includes('ANALYS') ||
             nameUpper.includes('CHECK') || nameUpper.includes('VERIFY') ||
             fileName.includes('report') || fileName.includes('analys') ||
             fileName.includes('check') || fileName.includes('verify')) {
      arquivosBD.scriptsAnalise.push(filePath);
    }
    // Dados fonte
    else if (ext === '.xml' || ext === '.json' || ext === '.csv' || 
             ext === '.txt' || ext === '.tsv' || ext === '.sql') {
      if (!nameUpper.includes('CONFIG') && !nameUpper.includes('README')) {
        arquivosBD.dadosFonte.push(filePath);
      }
    }
    // Backups
    else if (nameUpper.includes('BACKUP') || nameUpper.includes('EXPORT') ||
             ext === '.zip' || ext === '.bak') {
      arquivosBD.backups.push(filePath);
    }
    // Configurações
    else if (nameUpper.includes('.ENV') || nameUpper.includes('CONFIG') ||
             fileName.includes('connection') || fileName.includes('database')) {
      arquivosBD.configuracoes.push(filePath);
    }
    // Outros relacionados
    else if (nameUpper.includes('DATABASE') || nameUpper.includes('PRISMA') ||
             nameUpper.includes('SQL') || nameUpper.includes('DB') ||
             nameUpper.includes('GARD') || nameUpper.includes('ORPHA') ||
             nameUpper.includes('HPO') || nameUpper.includes('DRUG')) {
      arquivosBD.outros.push(filePath);
    }
  }

  // Escanear diretórios
  function escanearDiretorio(dirPath, baseDir = '') {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.join(baseDir, item);
        
        try {
          const stats = fs.statSync(fullPath);
          
          if (stats.isDirectory()) {
            // Pular node_modules, .next, etc
            if (!item.startsWith('.') || 
                item === '.env' || 
                item.startsWith('.env')) {
              escanearDiretorio(fullPath, relativePath);
            }
          } else if (stats.isFile()) {
            categorizarArquivo(relativePath, item);
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
  
  return arquivosBD;
}

function exibirAnalise(arquivosBD) {
  console.log('📊 RESULTADO DA ANÁLISE:\n');
  
  console.log('💾 BANCOS DE DADOS:');
  arquivosBD.bancos.forEach(file => console.log(`   📁 ${file}`));
  console.log(`   Total: ${arquivosBD.bancos.length} arquivos\n`);
  
  console.log('📋 SCHEMAS E CONFIGURAÇÕES:');
  arquivosBD.schemas.forEach(file => console.log(`   📄 ${file}`));
  console.log(`   Total: ${arquivosBD.schemas.length} arquivos\n`);
  
  console.log('⚙️ SCRIPTS DE POPULAÇÃO/IMPORTAÇÃO:');
  arquivosBD.scriptsPopulacao.forEach(file => console.log(`   🔧 ${file}`));
  console.log(`   Total: ${arquivosBD.scriptsPopulacao.length} arquivos\n`);
  
  console.log('📊 SCRIPTS DE ANÁLISE/RELATÓRIOS:');
  arquivosBD.scriptsAnalise.forEach(file => console.log(`   📈 ${file}`));
  console.log(`   Total: ${arquivosBD.scriptsAnalise.length} arquivos\n`);
  
  console.log('📦 DADOS FONTE (XML, JSON, CSV, etc):');
  arquivosBD.dadosFonte.forEach(file => console.log(`   📄 ${file}`));
  console.log(`   Total: ${arquivosBD.dadosFonte.length} arquivos\n`);
  
  console.log('💾 BACKUPS E EXPORTS:');
  arquivosBD.backups.forEach(file => console.log(`   💾 ${file}`));
  console.log(`   Total: ${arquivosBD.backups.length} arquivos\n`);
  
  console.log('⚙️ CONFIGURAÇÕES:');
  arquivosBD.configuracoes.forEach(file => console.log(`   ⚙️ ${file}`));
  console.log(`   Total: ${arquivosBD.configuracoes.length} arquivos\n`);
  
  console.log('📁 OUTROS RELACIONADOS:');
  arquivosBD.outros.forEach(file => console.log(`   📁 ${file}`));
  console.log(`   Total: ${arquivosBD.outros.length} arquivos\n`);
  
  // Total
  const total = Object.values(arquivosBD).reduce((acc, arr) => acc + arr.length, 0);
  console.log(`🎯 TOTAL DE ARQUIVOS RELACIONADOS A BD: ${total}\n`);
}

function gerarScriptCopia(arquivosBD) {
  console.log('📝 SCRIPT PARA COPIAR TODOS OS ARQUIVOS:\n');
  console.log('# Execute estes comandos para copiar tudo para uma pasta separada:\n');
  console.log('mkdir cplp_raras_backend');
  console.log('mkdir cplp_raras_backend\\database');
  console.log('mkdir cplp_raras_backend\\scripts');
  console.log('mkdir cplp_raras_backend\\schemas');
  console.log('mkdir cplp_raras_backend\\backups');
  console.log('mkdir cplp_raras_backend\\configs');
  console.log('mkdir cplp_raras_backend\\dados_fonte');
  console.log('mkdir cplp_raras_backend\\relatorios\n');
  
  console.log('# Copiar bancos de dados:');
  arquivosBD.bancos.forEach(file => {
    console.log(`copy "${file}" "cplp_raras_backend\\database\\"`);
  });
  
  console.log('\n# Copiar schemas:');
  arquivosBD.schemas.forEach(file => {
    console.log(`copy "${file}" "cplp_raras_backend\\schemas\\"`);
  });
  
  console.log('\n# Copiar scripts de população:');
  arquivosBD.scriptsPopulacao.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\scripts\\${fileName}"`);
  });
  
  console.log('\n# Copiar scripts de análise:');
  arquivosBD.scriptsAnalise.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\relatorios\\${fileName}"`);
  });
  
  console.log('\n# Copiar dados fonte:');
  arquivosBD.dadosFonte.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\dados_fonte\\${fileName}"`);
  });
  
  console.log('\n# Copiar backups:');
  arquivosBD.backups.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\backups\\${fileName}"`);
  });
  
  console.log('\n# Copiar configurações:');
  arquivosBD.configuracoes.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\configs\\${fileName}"`);
  });
  
  console.log('\n# Copiar outros:');
  arquivosBD.outros.forEach(file => {
    const fileName = path.basename(file);
    console.log(`copy "${file}" "cplp_raras_backend\\scripts\\${fileName}"`);
  });
}

function salvarListaCompleta(arquivosBD) {
  const lista = {
    timestamp: new Date().toISOString(),
    projeto: 'CPLP-RARAS',
    proposito: 'Separar backend de dados do projeto Next.js',
    arquivos: arquivosBD,
    resumo: {
      bancos: arquivosBD.bancos.length,
      schemas: arquivosBD.schemas.length,
      scriptsPopulacao: arquivosBD.scriptsPopulacao.length,
      scriptsAnalise: arquivosBD.scriptsAnalise.length,
      dadosFonte: arquivosBD.dadosFonte.length,
      backups: arquivosBD.backups.length,
      configuracoes: arquivosBD.configuracoes.length,
      outros: arquivosBD.outros.length
    }
  };
  
  fs.writeFileSync('LISTA_ARQUIVOS_BD_COMPLETA.json', JSON.stringify(lista, null, 2));
  console.log('\n💾 Lista completa salva em: LISTA_ARQUIVOS_BD_COMPLETA.json\n');
}

// EXECUTAR ANÁLISE
const arquivos = analisarProjeto();
exibirAnalise(arquivos);
gerarScriptCopia(arquivos);
salvarListaCompleta(arquivos);

console.log('✅ ANÁLISE COMPLETA FINALIZADA!');
console.log('🎯 TODOS os arquivos relacionados a BD foram identificados!');
console.log('📋 Use os comandos acima para copiar tudo para pasta separada!');
