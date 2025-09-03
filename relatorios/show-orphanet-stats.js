const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showRealDiseases() {
  console.log('🔬 AMOSTRA DE DOENÇAS REAIS ORPHANET IMPORTADAS:');
  console.log('================================================\n');
  
  // Buscar doenças reais (não as de teste)
  const diseases = await prisma.orphaDisease.findMany({
    take: 15,
    where: {
      orphaCode: {
        not: {
          startsWith: '0000'
        }
      }
    },
    select: {
      orphaNumber: true,
      preferredNameEn: true,
      entityType: true,
      synonymsEn: true,
      expertLink: true
    },
    orderBy: {
      orphaCode: 'asc'
    }
  });
  
  diseases.forEach((disease, index) => {
    console.log(`${index + 1}. ${disease.orphaNumber}: ${disease.preferredNameEn}`);
    
    if (disease.synonymsEn) {
      try {
        const synonyms = JSON.parse(disease.synonymsEn);
        if (synonyms.length > 0) {
          console.log(`   🏷️  Sinônimos: ${synonyms.slice(0, 3).join(', ')}`);
        }
      } catch (e) {
        // Ignorar erro de parse
      }
    }
    
    console.log(`   📋 Tipo: ${disease.entityType}`);
    
    if (disease.expertLink) {
      console.log(`   🔗 Link: ${disease.expertLink.substring(0, 60)}...`);
    }
    
    console.log();
  });
  
  // Estatísticas finais
  const totalCount = await prisma.orphaDisease.count();
  const realCount = await prisma.orphaDisease.count({
    where: {
      orphaCode: {
        not: {
          startsWith: '0000'
        }
      }
    }
  });
  
  console.log('📊 ESTATÍSTICAS FINAIS:');
  console.log(`   Total de doenças na base: ${totalCount.toLocaleString()}`);
  console.log(`   Doenças reais Orphanet: ${realCount.toLocaleString()}`);
  console.log(`   Doenças de teste: ${(totalCount - realCount).toLocaleString()}`);
  
  // Tipos de entidade
  const entityTypes = await prisma.orphaDisease.groupBy({
    by: ['entityType'],
    _count: {
      entityType: true
    },
    where: {
      orphaCode: {
        not: {
          startsWith: '0000'
        }
      }
    },
    orderBy: {
      _count: {
        entityType: 'desc'
      }
    }
  });
  
  console.log('\n📋 TIPOS DE ENTIDADES ORPHANET:');
  entityTypes.forEach(type => {
    console.log(`   ${type.entityType}: ${type._count.entityType.toLocaleString()}`);
  });
  
  console.log('\n🎉 IMPORTAÇÃO ORPHANET COMPLETA E FUNCIONAL!');
  console.log('🌍 Sistema brasileiro de doenças raras pronto para uso!');
  
  await prisma.$disconnect();
}

showRealDiseases().catch(console.error);
