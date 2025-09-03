const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStructure() {
  console.log('🔍 VERIFICAÇÃO DETALHADA DAS TABELAS HPO');
  console.log('==========================================\n');
  
  try {
    // 1. Verificar estrutura da tabela orpha_clinical_signs
    console.log('📊 TABELA: orpha_clinical_signs');
    const clinicalSignsInfo = await prisma.$queryRaw`PRAGMA table_info(orpha_clinical_signs)`;
    console.log('Estrutura:');
    console.table(clinicalSignsInfo);
    
    const clinicalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_clinical_signs`;
    console.log(`Registros: ${clinicalCount[0].count}\n`);
    
    // 2. Verificar estrutura da tabela orpha_phenotypes  
    console.log('📊 TABELA: orpha_phenotypes');
    const phenotypesInfo = await prisma.$queryRaw`PRAGMA table_info(orpha_phenotypes)`;
    console.log('Estrutura:');
    console.table(phenotypesInfo);
    
    const phenotypesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_phenotypes`;
    console.log(`Registros: ${phenotypesCount[0].count}\n`);
    
    // 3. Testar inserção simples em clinical_signs
    console.log('🧪 TESTE DE INSERÇÃO: orpha_clinical_signs');
    try {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO orpha_clinical_signs 
        (id, orpha_disease_id, sign_name, sign_name_pt, frequency, frequency_value, sign_category) 
        VALUES ('test-123', 1, 'Test Sign', NULL, 'Frequent', NULL, 'HPO_Phenotype')
      `;
      console.log('✅ Inserção de teste funcionou!\n');
      
      // Remover teste
      await prisma.$executeRaw`DELETE FROM orpha_clinical_signs WHERE id = 'test-123'`;
      
    } catch (error) {
      console.log('❌ Erro na inserção de teste:', error.message);
    }
    
    // 4. Verificar algumas doenças existentes
    console.log('📊 DOENÇAS DISPONÍVEIS (primeiras 5):');
    const diseases = await prisma.$queryRaw`
      SELECT id, orpha_code, disorder_name 
      FROM orpha_diseases 
      LIMIT 5
    `;
    console.table(diseases);
    
    // 5. Verificar se existem foreign keys
    console.log('🔗 FOREIGN KEYS:');
    const fkInfo = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_clinical_signs)`;
    console.table(fkInfo);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStructure();
