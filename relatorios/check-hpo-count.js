const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHpoCount() {
  try {
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    console.log('🧬 HPO Phenotype Associations:', count[0].count);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkHpoCount();
