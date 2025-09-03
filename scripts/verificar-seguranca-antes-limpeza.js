/**
 * VERIFICAÇÃO DE SEGURANÇA ANTES DA LIMPEZA
 * Compara arquivos aqui com os copiados no backend
 */

const fs = require('fs');
const path = require('path');

const BACKEND_PATH = 'C:\\Users\\up739088\\Desktop\\aplicaçoes,sites,etc\\cplp_raras_backend';

function verificarSeguranca() {
  console.log('🔍 VERIFICAÇÃO DE SEGURANÇA ANTES DA LIMPEZA\n');
  
  const arquivosParaVerificar = [
    // Bancos críticos
    'database/gard_dev.db',
    
    // Schemas
    'prisma/schema.prisma',
    
    // Scripts principais de importação
    'scripts/01-imports/import-orphanet-official.js',
    'scripts/01-imports/import-gard-complete.js',
    'scripts/04-hpo-system/massive-hpo-population.js',
    'scripts/04-hpo-system/process-official-hpo-complete.js',
    
    // Scripts de análise
    'scripts/05-analysis-reports/ultimate-final-report.js',
    'scripts/check-tables-simple.js',
    
    // Dados fonte críticos
    'database/orphadata-sources/en_product1.xml',
    'database/hpo-official/phenotype.hpoa',
    'database/hpo-official/genes_to_phenotype.txt',
    
    // Backups
    'backups/gard-database-1612.db',
    'backups/cplp_raras_backup_20250901_155331.zip',
    
    // Configs
    '.env',
    'package.json'
  ];
  
  let tudoOK = true;
  let arquivosVerificados = 0;
  let arquivosFaltando = [];
  
  console.log('📋 VERIFICANDO ARQUIVOS CRÍTICOS:\n');
  
  for (const arquivo of arquivosParaVerificar) {
    const arquivoOriginal = arquivo;
    const arquivoBackend = path.join(BACKEND_PATH, arquivo);
    
    const existeOriginal = fs.existsSync(arquivoOriginal);
    const existeBackend = fs.existsSync(arquivoBackend);
    
    if (existeOriginal) {
      if (existeBackend) {
        console.log(`✅ ${arquivo} - COPIADO OK`);
        arquivosVerificados++;
      } else {
        console.log(`❌ ${arquivo} - NÃO COPIADO!`);
        arquivosFaltando.push(arquivo);
        tudoOK = false;
      }
    } else {
      console.log(`⚪ ${arquivo} - NÃO EXISTE AQUI`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESUMO DA VERIFICAÇÃO:`);
  console.log(`✅ Arquivos verificados: ${arquivosVerificados}`);
  console.log(`❌ Arquivos faltando: ${arquivosFaltando.length}`);
  console.log(`🎯 Status: ${tudoOK ? '✅ SEGURO PARA LIMPEZA' : '❌ PERIGOSO - NÃO LIMPAR!'}`);
  
  if (arquivosFaltando.length > 0) {
    console.log('\n🚨 ARQUIVOS QUE NÃO FORAM COPIADOS:');
    arquivosFaltando.forEach(arquivo => console.log(`   - ${arquivo}`));
    console.log('\n⚠️ NÃO EXECUTE LIMPEZA ATÉ COPIAR ESTES ARQUIVOS!');
  }
  
  // Verificar se há outros arquivos importantes
  console.log('\n🔍 PROCURANDO OUTROS ARQUIVOS IMPORTANTES...\n');
  
  verificarDiretorio('scripts');
  verificarDiretorio('database');
  verificarDiretorio('prisma');
  verificarDiretorio('backups');
  
  return tudoOK;
}

function verificarDiretorio(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  let arquivosImportantes = 0;
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (ext === '.js' || ext === '.ts' || ext === '.db' || ext === '.xml' || ext === '.json' || ext === '.zip') {
        const backendPath = path.join(BACKEND_PATH, fullPath);
        const existeBackend = fs.existsSync(backendPath);
        
        if (!existeBackend) {
          console.log(`⚠️ IMPORTANTE NÃO COPIADO: ${fullPath}`);
          arquivosImportantes++;
        }
      }
    } else if (stats.isDirectory() && !item.startsWith('.')) {
      verificarDiretorio(fullPath);
    }
  }
  
  return arquivosImportantes;
}

// EXECUTAR VERIFICAÇÃO
const seguro = verificarSeguranca();

if (seguro) {
  console.log('\n🎯 CONCLUSÃO: ✅ SEGURO PARA PROSSEGUIR COM LIMPEZA');
  console.log('   Todos os arquivos críticos foram copiados com sucesso!');
} else {
  console.log('\n🚨 CONCLUSÃO: ❌ NÃO EXECUTE LIMPEZA AINDA!');
  console.log('   Alguns arquivos importantes não foram copiados!');
}
