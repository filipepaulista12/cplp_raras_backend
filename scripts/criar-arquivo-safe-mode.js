const fs = require('fs');

function criarArquivoSafeMode() {
  console.log('🔧 CRIANDO VERSÃO SAFE MODE PARA MYSQL WORKBENCH');
  console.log('===============================================');
  
  const arquivoOriginal = 'database/DADOS_COMPLETOS_MYSQL_CPLP_RARAS.sql';
  const arquivoSafe = 'database/DADOS_MYSQL_SAFE_MODE.sql';
  
  // Ler o arquivo original
  const conteudoOriginal = fs.readFileSync(arquivoOriginal, 'utf8');
  
  let conteudoSafe = '';
  
  // Header com configurações de safe mode
  conteudoSafe += `-- =====================================================\n`;
  conteudoSafe += `-- DADOS COMPLETOS CPLP RARAS - VERSÃO SAFE MODE\n`;
  conteudoSafe += `-- Data: ${new Date().toLocaleString('pt-BR')}\n`;
  conteudoSafe += `-- Compatível com MySQL Workbench Safe Update Mode\n`;
  conteudoSafe += `-- =====================================================\n\n`;
  
  // Desabilitar safe mode temporariamente
  conteudoSafe += `-- Desabilitar safe mode temporariamente\n`;
  conteudoSafe += `SET SQL_SAFE_UPDATES = 0;\n`;
  conteudoSafe += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  conteudoSafe += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
  conteudoSafe += `SET AUTOCOMMIT = 0;\n`;
  conteudoSafe += `START TRANSACTION;\n\n`;
  
  // Processar o conteúdo original removendo os DELETE problemáticos
  const linhas = conteudoOriginal.split('\n');
  let pularProximasLinhas = 0;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // Pular as linhas iniciais de configuração que já adicionamos
    if (linha.includes('SET FOREIGN_KEY_CHECKS') || 
        linha.includes('SET SQL_MODE') || 
        linha.includes('SET AUTOCOMMIT') || 
        linha.includes('START TRANSACTION')) {
      continue;
    }
    
    // Substituir DELETE por TRUNCATE (mais seguro)
    if (linha.includes('DELETE FROM')) {
      const nomeTabela = linha.match(/DELETE FROM `(.+?)`/);
      if (nomeTabela) {
        conteudoSafe += `-- Limpar tabela ${nomeTabela[1]}\n`;
        conteudoSafe += `TRUNCATE TABLE \`${nomeTabela[1]}\`;\n\n`;
      }
      continue;
    }
    
    // Manter o resto do conteúdo
    conteudoSafe += linha + '\n';
  }
  
  // Footer com restauração do safe mode
  conteudoSafe += `\n-- Restaurar configurações originais\n`;
  conteudoSafe += `COMMIT;\n`;
  conteudoSafe += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  conteudoSafe += `SET SQL_SAFE_UPDATES = 1;\n`;
  conteudoSafe += `SET AUTOCOMMIT = 1;\n`;
  
  // Salvar arquivo
  fs.writeFileSync(arquivoSafe, conteudoSafe);
  
  const tamanhoOriginal = (fs.statSync(arquivoOriginal).size / 1024 / 1024).toFixed(2);
  const tamanhoSafe = (fs.statSync(arquivoSafe).size / 1024 / 1024).toFixed(2);
  
  console.log(`✅ ARQUIVO SAFE MODE CRIADO!`);
  console.log(`📁 Original: ${arquivoOriginal} (${tamanhoOriginal} MB)`);
  console.log(`📁 Safe Mode: ${arquivoSafe} (${tamanhoSafe} MB)`);
  
  console.log(`\n🎯 INSTRUÇÕES PARA MYSQL WORKBENCH:`);
  console.log(`================================`);
  console.log(`1. USE cplp_raras;`);
  console.log(`2. Execute: ${arquivoSafe}`);
  console.log(`3. O safe mode será desabilitado automaticamente`);
  console.log(`4. Todos os dados serão importados`);
  console.log(`5. Safe mode será reabilitado no final`);
  
  console.log(`\n💡 ALTERNATIVA RÁPIDA:`);
  console.log(`No MySQL Workbench:`);
  console.log(`Edit → Preferences → SQL Editor`);
  console.log(`Desmarque: "Safe Updates"`);
  console.log(`Reconecte ao servidor`);
  
  return arquivoSafe;
}

try {
  const arquivo = criarArquivoSafeMode();
  console.log(`\n🎉 PRONTO! Use o arquivo: ${arquivo}`);
} catch (error) {
  console.error('❌ Erro:', error);
}
