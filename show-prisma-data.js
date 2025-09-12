/**
 * Teste Simples - Visualizar dados no Prisma
 */

const { PrismaClient } = require('@prisma/client');

async function showPrismaData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎉 PRISMA STUDIO FUNCIONANDO COM DADOS REAIS!');
    console.log('=' .repeat(55));
    
    // Mostrar totais
    const orphaCount = await prisma.orphaDisease.count();
    const hpoCount = await prisma.hpoTerm.count();
    const phenotypeCount = await prisma.hpoPhenotypeAssociation.count();
    
    console.log(`\n📊 DADOS DISPONÍVEIS NO PRISMA STUDIO:`);
    console.log(`   🦠 OrphaDisease: ${orphaCount.toLocaleString()} registros`);
    console.log(`   🧬 HpoTerm: ${hpoCount.toLocaleString()} registros`);
    console.log(`   🔗 HpoPhenotypeAssociation: ${phenotypeCount.toLocaleString()} registros`);
    
    // Mostrar exemplos
    console.log(`\n🔍 EXEMPLOS DE DOENÇAS ORPHANET:`);
    const diseases = await prisma.orphaDisease.findMany({
      take: 5,
      select: { orphacode: true, name: true }
    });
    
    diseases.forEach((disease, index) => {
      console.log(`   ${index + 1}. ${disease.orphacode}: ${disease.name}`);
    });
    
    console.log(`\n🔍 EXEMPLOS DE TERMOS HPO:`);
    const hpoTerms = await prisma.hpoTerm.findMany({
      take: 3,
      select: { hpoId: true, name: true }
    });
    
    hpoTerms.forEach((term, index) => {
      console.log(`   ${index + 1}. ${term.hpoId}: ${term.name}`);
    });
    
    console.log('\n' + '=' .repeat(55));
    console.log('✅ PRISMA STUDIO: http://localhost:5555');
    console.log('🎯 Agora você pode navegar pelos dados visualmente!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showPrismaData();
