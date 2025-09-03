const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDiseases() {
  console.log('🔍 VERIFICAÇÃO DA TABELA ORPHA_DISEASES');
  console.log('====================================\n');
  
  try {
    // 1. Ver primeiras 5 doenças com estrutura correta
    console.log('📋 PRIMEIRAS 5 DOENÇAS:');
    const diseases = await prisma.$queryRaw`
      SELECT id, orpha_code, orpha_number, preferred_name_en 
      FROM orpha_diseases 
      LIMIT 5
    `;
    console.table(diseases);
    
    // 2. Verificar foreign keys das tabelas HPO
    console.log('\n🔗 FOREIGN KEYS orpha_clinical_signs:');
    const fkClinical = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_clinical_signs)`;
    console.table(fkClinical);
    
    console.log('\n🔗 FOREIGN KEYS orpha_phenotypes:');
    const fkPhenotypes = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_phenotypes)`;
    console.table(fkPhenotypes);
    
    // 3. Testar inserção com ID válido
    console.log('\n🧪 TESTE DE INSERÇÃO com ID válido:');
    const firstDisease = diseases[0];
    
    try {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO orpha_clinical_signs 
        (id, orpha_disease_id, sign_name, sign_name_pt, frequency, frequency_value, sign_category) 
        VALUES ('test-456', ${firstDisease.id}, 'Test Sign', NULL, 'Frequent', NULL, 'HPO_Phenotype')
      `;
      console.log('✅ Inserção de teste funcionou!');
      
      // Verificar se foi inserido
      const inserted = await prisma.$queryRaw`
        SELECT * FROM orpha_clinical_signs WHERE id = 'test-456'
      `;
      console.log('📊 Registro inserido:', inserted[0]);
      
      // Remover teste
      await prisma.$executeRaw`DELETE FROM orpha_clinical_signs WHERE id = 'test-456'`;
      console.log('🧹 Teste removido');
      
    } catch (error) {
      console.log('❌ Erro na inserção de teste:', error.message);
    }
    
    // 4. Verificar se phenotypes tabela funciona também
    console.log('\n🧪 TESTE orpha_phenotypes:');
    try {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO orpha_phenotypes 
        (id, orpha_disease_id, hpo_id, hpo_term, frequency_hpo_id, frequency_term, frequency_value, diagnostic_criteria) 
        VALUES ('test-789', ${firstDisease.id}, 'HP:0000123', 'Test Phenotype', NULL, 'Frequent', NULL, NULL)
      `;
      console.log('✅ orpha_phenotypes inserção funcionou!');
      
      // Remover teste
      await prisma.$executeRaw`DELETE FROM orpha_phenotypes WHERE id = 'test-789'`;
      console.log('🧹 Teste removido');
      
    } catch (error) {
      console.log('❌ Erro na inserção phenotypes:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiseases();
