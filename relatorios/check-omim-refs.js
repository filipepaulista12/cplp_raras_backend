const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOmimReferences() {
  try {
    console.log('🔍 VERIFICAÇÃO REFERÊNCIAS OMIM');
    console.log('===============================');
    
    // Contar doenças com OMIM
    const omimCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM orpha_diseases 
      WHERE external_references LIKE '%OMIM%'
    `;
    
    console.log(`📊 Doenças Orphanet com referências OMIM: ${omimCount[0].count}`);
    
    if (omimCount[0].count > 0) {
      // Amostras de referências OMIM
      const samples = await prisma.$queryRaw`
        SELECT orpha_code, name_en, external_references 
        FROM orpha_diseases 
        WHERE external_references LIKE '%OMIM%' 
        LIMIT 5
      `;
      
      console.log('\n📋 Amostras de referências OMIM:');
      samples.forEach((sample, index) => {
        console.log(`${index + 1}. ORPHA:${sample.orpha_code}`);
        console.log(`   Nome: ${sample.name_en?.substring(0, 60)}...`);
        console.log(`   Refs: ${sample.external_references?.substring(0, 80)}...`);
        console.log('');
      });
      
      // Extrair alguns códigos OMIM para teste
      console.log('🔍 EXTRAÇÃO CÓDIGOS OMIM:');
      samples.forEach((sample, index) => {
        const refs = sample.external_references || '';
        const omimMatch = refs.match(/OMIM:\s*(\d+)/);
        if (omimMatch) {
          console.log(`   ORPHA:${sample.orpha_code} -> OMIM:${omimMatch[1]}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOmimReferences();
