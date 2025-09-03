const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function completeHpoAssociations() {
  console.log('\n🔥 FINALIZANDO HPO ASSOCIATIONS (ROBUSTO)');
  console.log('==========================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const filePath = 'database/hpo-official/genes_to_phenotype.txt';
  
  try {
    // Verificar quantos já temos
    const currentCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    console.log(`📊 Registros atuais: ${currentCount[0].count}`);
    
    // Ler arquivo
    console.log('🔄 Carregando dados...');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('ncbi_gene_id'));
    const orphaLines = lines.filter(line => line.includes('ORPHA:'));
    
    console.log(`📊 Total ORPHA disponível: ${orphaLines.length}`);
    console.log(`📊 Restam processar: ${orphaLines.length - Number(currentCount[0].count)}`);
    
    // Carregar mapeamentos
    console.log('🔄 Carregando mapeamentos...');
    const orphaMapping = await prisma.$queryRaw`SELECT id, orpha_code FROM orpha_diseases`;
    const hpoMapping = await prisma.$queryRaw`SELECT id, hpoId FROM hpo_terms`;
    
    const orphaMap = new Map();
    orphaMapping.forEach(disease => orphaMap.set(disease.orpha_code, disease.id));
    
    const hpoMap = new Map();
    hpoMapping.forEach(term => hpoMap.set(term.hpoId, term.id));
    
    console.log(`📊 Orphanet: ${orphaMapping.length} | HPO Terms: ${hpoMapping.length}`);
    
    // Processar do ponto onde parou
    let inserted = 0;
    let processed = 0;
    const startFrom = Number(currentCount[0].count);
    
    console.log(`\n🚀 Continuando do registro ${startFrom + 1}...\n`);
    
    for (let i = startFrom; i < orphaLines.length; i++) {
      const line = orphaLines[i];
      const fields = line.split('\t');
      
      if (fields.length < 6) continue;
      
      processed++;
      
      const hpoId = fields[2]?.trim();
      const frequency = fields[4]?.trim();
      const diseaseId = fields[5]?.trim();
      
      if (!diseaseId.startsWith('ORPHA:')) continue;
      
      const orphaCode = diseaseId.replace('ORPHA:', '');
      const orphaDiseaseId = orphaMap.get(orphaCode);
      const hpoTermId = hpoMap.get(hpoId);
      
      if (!orphaDiseaseId || !hpoTermId) continue;
      
      try {
        await prisma.hpo_phenotype_associations.create({
          data: {
            id: crypto.randomUUID(),
            orphaDiseaseId: orphaDiseaseId,
            hpoTermId: hpoTermId,
            frequencyTerm: frequency || null,
            evidence: 'genes_to_phenotype',
            reference: diseaseId,
            frequency: frequency || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        inserted++;
        
        if (inserted % 1000 === 0) {
          console.log(`🔄 ${inserted} inseridas | Progresso: ${((startFrom + inserted)/orphaLines.length*100).toFixed(1)}%`);
        }
        
      } catch (error) {
        // Ignorar duplicatas silenciosamente
        if (!error.message.includes('UNIQUE')) {
          console.log(`❌ Erro: ${error.message.substring(0, 60)}`);
        }
      }
    }
    
    // Verificação final
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hpo_phenotype_associations`;
    
    console.log(`\n🎉 QUINTA MISSÃO FINALIZADA!`);
    console.log(`✅ Registros inseridos nesta execução: ${inserted}`);
    console.log(`📊 Total final na tabela: ${finalCount[0].count}`);
    console.log(`🎯 Progresso: ${(finalCount[0].count/orphaLines.length*100).toFixed(1)}% (${finalCount[0].count}/${orphaLines.length})`);
    
    if (finalCount[0].count >= orphaLines.length * 0.95) {
      console.log(`\n🏆 HPO ASSOCIATIONS COMPLETA!`);
      console.log(`✅ hpo_phenotype_associations: ${finalCount[0].count} registros`);
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeHpoAssociations();
