// =====================================================================================
// TESTE SQLITE - CPLP-RARAS
// =====================================================================================
// Teste de conectividade e funcionalidade do SQLite temporário
// =====================================================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSQLiteConnection() {
  console.log('🔄 TESTANDO CONECTIVIDADE SQLITE');
  console.log('='.repeat(50));

  try {
    // 1. Testar conexão básica
    await prisma.$connect();
    console.log('✅ Conexão SQLite estabelecida');

    // 2. Inserir dados de teste
    console.log('\n📊 POPULANDO DADOS BÁSICOS...');
    
    // Países CPLP
    const countries = [
      { code: 'BR', name: 'Brazil', name_pt: 'Brasil', flag_emoji: '🇧🇷', population: '215000000' },
      { code: 'PT', name: 'Portugal', name_pt: 'Portugal', flag_emoji: '🇵🇹', population: '10300000' },
      { code: 'AO', name: 'Angola', name_pt: 'Angola', flag_emoji: '🇦🇴', population: '33900000' },
      { code: 'MZ', name: 'Mozambique', name_pt: 'Moçambique', flag_emoji: '🇲🇿', population: '32200000' },
      { code: 'CV', name: 'Cape Verde', name_pt: 'Cabo Verde', flag_emoji: '🇨🇻', population: '560000' }
    ];

    for (const country of countries) {
      await prisma.cplpCountry.upsert({
        where: { code: country.code },
        update: {},
        create: country
      });
    }
    console.log(`✅ ${countries.length} países CPLP inseridos`);

    // Doenças exemplo
    const diseases = [
      {
        orphacode: 'ORPHA:558',
        name: 'Maroteaux-Lamy syndrome',
        name_pt: 'Síndrome de Maroteaux-Lamy',
        definition: 'A rare mucopolysaccharidosis characterized by severe dysostosis multiplex',
        definition_pt: 'Uma mucopolissacaridose rara caracterizada por disostose múltipla severa'
      },
      {
        orphacode: 'ORPHA:1234',
        name: 'Example rare disease',
        name_pt: 'Doença rara exemplo',
        definition: 'An example rare disease for testing purposes',
        definition_pt: 'Uma doença rara exemplo para propósitos de teste'
      }
    ];

    for (const disease of diseases) {
      await prisma.orphaDisease.upsert({
        where: { orphacode: disease.orphacode },
        update: {},
        create: disease
      });
    }
    console.log(`✅ ${diseases.length} doenças exemplo inseridas`);

    // 3. Verificar dados inseridos
    console.log('\n🔍 VERIFICANDO DADOS...');
    
    const countryCount = await prisma.cplpCountry.count();
    const diseaseCount = await prisma.orphaDisease.count();
    
    console.log(`📊 Países: ${countryCount}`);
    console.log(`📊 Doenças: ${diseaseCount}`);

    // 4. Teste de consulta
    const sampleCountries = await prisma.cplpCountry.findMany({
      take: 3,
      select: { code: true, name_pt: true, flag_emoji: true }
    });
    
    console.log('\n🌍 PAÍSES DE EXEMPLO:');
    sampleCountries.forEach(country => {
      console.log(`   ${country.flag_emoji} ${country.code} - ${country.name_pt}`);
    });

    const sampleDiseases = await prisma.orphaDisease.findMany({
      take: 2,
      select: { orphacode: true, name_pt: true }
    });
    
    console.log('\n🧬 DOENÇAS DE EXEMPLO:');
    sampleDiseases.forEach(disease => {
      console.log(`   ${disease.orphacode} - ${disease.name_pt}`);
    });

    // 5. Status final
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SQLITE CONFIGURADO E FUNCIONANDO!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. npm run dev  # Iniciar API');
    console.log('   2. npx prisma studio  # Interface visual');
    console.log('   3. Testar endpoints da API');
    console.log('');
    console.log('🔄 QUANDO MYSQL ESTIVER PRONTO:');
    console.log('   1. Instalar MySQL conforme MYSQL_SETUP_INSTRUCTIONS.md');
    console.log('   2. Executar scripts/restore-mysql-schema.js');
    console.log('   3. Sincronizar dados com scripts/sync-mysql-dumps.js');

  } catch (error) {
    console.error('❌ Erro no teste SQLite:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testSQLiteConnection();
