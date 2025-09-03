const fs = require('fs');

async function debugHpoaFile() {
  console.log('🔍 DEBUG HPO ASSOCIATIONS FILE');
  console.log('==============================');
  
  const hpoaPath = 'database/hpo-official/phenotype.hpoa';
  const content = fs.readFileSync(hpoaPath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`📊 Total de linhas no arquivo: ${lines.length}`);
  
  // Contar linhas de comentário
  const commentLines = lines.filter(line => line.startsWith('#'));
  console.log(`📊 Linhas de comentário (#): ${commentLines.length}`);
  
  // Linhas válidas
  const validLines = lines.filter(line => !line.startsWith('#') && line.trim());
  console.log(`📊 Linhas válidas: ${validLines.length}`);
  
  console.log('\n🔍 AMOSTRAS DE LINHAS VÁLIDAS:');
  for (let i = 0; i < Math.min(10, validLines.length); i++) {
    const fields = validLines[i].split('\t');
    console.log(`\n${i + 1}. Database ID: "${fields[0]}" | Disease: "${fields[1]?.substring(0, 40)}..." | HPO ID: "${fields[3]}"`);
    console.log(`   Campos: ${fields.length} | ORPHANET? ${fields[0]?.startsWith('ORPHANET:')}`);
  }
  
  // Contar por tipo de database
  const orphanetCount = validLines.filter(line => line.split('\t')[0]?.startsWith('ORPHANET:')).length;
  const omimCount = validLines.filter(line => line.split('\t')[0]?.startsWith('OMIM:')).length;
  const deciperCount = validLines.filter(line => line.split('\t')[0]?.startsWith('DECIPHER:')).length;
  
  console.log(`\n📊 DISTRIBUIÇÃO POR BANCO:`);
  console.log(`   • ORPHANET: ${orphanetCount}`);
  console.log(`   • OMIM: ${omimCount}`);
  console.log(`   • DECIPHER: ${deciperCount}`);
  console.log(`   • Outros: ${validLines.length - orphanetCount - omimCount - deciperCount}`);
  
  // Verificar campos HPO
  console.log(`\n🔍 VERIFICAÇÃO HPO IDs (primeiros 5):`);
  for (let i = 0; i < Math.min(5, validLines.length); i++) {
    const fields = validLines[i].split('\t');
    const databaseId = fields[0];
    const hpoId = fields[3];
    console.log(`   ${i + 1}. ${databaseId} -> ${hpoId} (válido? ${hpoId?.startsWith('HP:')})`);
  }
}

debugHpoaFile();
