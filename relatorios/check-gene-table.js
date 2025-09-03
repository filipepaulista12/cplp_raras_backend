const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGeneTableStructure() {
  console.log('🧬 VERIFICAÇÃO TABELA ORPHA_GENE_ASSOCIATIONS');
  console.log('============================================\n');
  
  try {
    // 1. Verificar estrutura da tabela
    console.log('📊 ESTRUTURA orpha_gene_associations:');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(orpha_gene_associations)`;
    console.table(tableInfo);
    
    // 2. Contar registros atuais
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_gene_associations`;
    console.log(`\n📊 Registros atuais: ${count[0].count}`);
    
    // 3. Verificar foreign keys
    console.log('\n🔗 FOREIGN KEYS:');
    const fks = await prisma.$queryRaw`PRAGMA foreign_key_list(orpha_gene_associations)`;
    console.table(fks);
    
    // 4. Testar inserção simples
    console.log('\n🧪 TESTE DE INSERÇÃO:');
    const firstDisease = await prisma.$queryRaw`
      SELECT id, orpha_code FROM orpha_diseases LIMIT 1
    `;
    
    try {
      const testId = `test-gene-${Date.now()}`;
      await prisma.$executeRaw`
        INSERT INTO orpha_gene_associations 
        (id, orpha_disease_id, gene_symbol, gene_name, association_type, association_status, pmid_reference) 
        VALUES (${testId}, ${firstDisease[0].id}, ${'TEST_GENE'}, ${'Test Gene Name'}, ${'Disease-causing germline mutation(s) in'}, ${'Assessed'}, ${'12345678[PMID]'})
      `;
      
      console.log('✅ Inserção de teste funcionou!');
      
      // Verificar
      const inserted = await prisma.$queryRaw`
        SELECT * FROM orpha_gene_associations WHERE id = ${testId}
      `;
      console.log('📊 Registro inserido:', inserted[0]);
      
      // Limpar
      await prisma.$executeRaw`DELETE FROM orpha_gene_associations WHERE id = ${testId}`;
      console.log('🧹 Teste removido');
      
    } catch (error) {
      console.log('❌ Erro na inserção:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGeneTableStructure();
