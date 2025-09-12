/**
 * Teste do Prisma Studio - Verificação dos dados
 */

const { PrismaClient } = require('@prisma/client');

async function testPrismaData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 TESTANDO ACESSO AOS DADOS VIA PRISMA');
    console.log('=' .repeat(50));
    
    // Teste 1: Contar OrphaDisease
    console.log('\n📊 Contando OrphaDisease:');
    const orphaCount = await prisma.orphaDisease.count();
    console.log(`✅ Total: ${orphaCount} doenças Orphanet`);
    
    // Teste 2: Contar HpoTerms  
    console.log('\n📊 Contando HpoTerms:');
    const hpoCount = await prisma.hpoTerm.count();
    console.log(`✅ Total: ${hpoCount} termos HPO`);
    
    // Teste 3: Contar HpoPhenotypeAssociation
    console.log('\n📊 Contando HpoPhenotypeAssociation:');
    const phenotypeCount = await prisma.hpoPhenotypeAssociation.count();
    console.log(`✅ Total: ${phenotypeCount} associações fenótipo`);
    
    // Teste 4: Primeiras 3 doenças Orphanet
    console.log('\n🔍 Primeiras 3 doenças Orphanet:');
    const firstDiseases = await prisma.orphaDisease.findMany({
      take: 3,
      select: {
        orphacode: true,
        name: true,
        name_pt: true
      }
    });
    
    firstDiseases.forEach((disease, index) => {
      console.log(`${index + 1}. ${disease.orphacode}: ${disease.name || disease.name_pt}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 PRISMA STUDIO DEVE MOSTRAR TODOS ESSES DADOS!');
    console.log(`🌐 Acesse: http://localhost:5555`);
    
  } catch (error) {
    console.error('❌ Erro no teste Prisma:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaData();
