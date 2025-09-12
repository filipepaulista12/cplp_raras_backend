console.log('🧪 Testando parseRecord com dados reais...');

function parseRecord(recordStr) {
  const inner = recordStr.slice(1, -1);
  const valores = [];
  let atual = '';
  let dentroString = false;
  let charString = null;
  
  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    
    if (!dentroString && (char === '"' || char === "'")) {
      dentroString = true;
      charString = char;
      continue;
    }
    
    if (dentroString && char === charString) {
      dentroString = false;
      charString = null;
      continue;
    }
    
    if (!dentroString && char === ',') {
      valores.push(atual.trim() === 'NULL' ? null : atual);
      atual = '';
      continue;
    }
    
    atual += char;
  }
  
  if (atual.length > 0) {
    valores.push(atual.trim() === 'NULL' ? null : atual);
  }
  
  return valores;
}

// Teste com um registro real do gene association
const registro = "('cmf2kekj62i3doesono4mviie','ABCC6','368',NULL,'cmf2il0o200cxoei433q48sfz','phenotype','IEA',NULL,'2025-09-02 13:09:09','2025-09-02 13:09:09')";

console.log('📄 Registro original:', registro);

const valores = parseRecord(registro);
console.log('🔍 Valores parseados:', valores);
console.log('📊 Total de campos:', valores.length);

console.log('\n🎯 Campos extraídos:');
console.log('Campo 0 (ID):', valores[0]);
console.log('Campo 1 (Gene):', valores[1]);
console.log('Campo 2 (Chromosome):', valores[2]);
console.log('Campo 3 (NULL):', valores[3]);
console.log('Campo 4 (HPO Term):', valores[4]);
console.log('Campo 5 (Type):', valores[5]);

// Nova extração corrigida
const [id, geneSymbol, chromosomeNumber, nullField1, hpoTermId] = valores;

console.log('\n✅ Nova extração:');
console.log('ID:', id);
console.log('Gene Symbol:', geneSymbol);
console.log('Chromosome:', chromosomeNumber);
console.log('HPO Term ID:', hpoTermId);
