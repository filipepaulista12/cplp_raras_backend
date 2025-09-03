const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const prisma = new PrismaClient();

async function debugProduct4() {
  console.log('\n🔍 DEBUG PRODUCT4 - INVESTIGAÇÃO');
  console.log('====================================\n');
  
  try {
    // 1. Parse XML
    const xmlPath = 'database/orphadata-sources/en_product4.xml';
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    const hpoList = result.JDBOR?.HPODisorderSetStatusList?.[0]?.HPODisorderSetStatus;
    console.log(`📊 Encontrados ${hpoList.length} disorders no XML`);
    
    // 2. Verificar mapeamento
    const orphaMapping = await prisma.$queryRaw`
      SELECT id, orpha_number FROM orpha_diseases LIMIT 10
    `;
    console.log('\n📋 AMOSTRA DE DOENÇAS NO BANCO:');
    orphaMapping.forEach(disease => {
      const orphaNum = disease.orpha_number.replace('ORPHA:', '');
      console.log(`   ${disease.orpha_number} -> ${orphaNum} (UUID: ${disease.id.substring(0, 8)}...)`);
    });
    
    const orphaMap = new Map();
    const fullMapping = await prisma.$queryRaw`SELECT id, orpha_number FROM orpha_diseases`;
    fullMapping.forEach(disease => {
      const orphaNum = disease.orpha_number.replace('ORPHA:', '');
      orphaMap.set(orphaNum, disease.id);
    });
    
    console.log(`\n🔗 Mapeamento criado com ${orphaMap.size} doenças`);
    
    // 3. Analisar primeiros 10 disorders do XML
    console.log('\n📋 ANÁLISE DOS PRIMEIROS 10 DISORDERS:');
    for (let i = 0; i < Math.min(10, hpoList.length); i++) {
      const hpoStatus = hpoList[i];
      const disorder = hpoStatus.Disorder?.[0];
      
      if (!disorder) {
        console.log(`   ${i + 1}. ❌ Disorder null`);
        continue;
      }
      
      const orphaNumber = disorder.OrphaNumber?.[0];
      if (!orphaNumber) {
        console.log(`   ${i + 1}. ❌ OrphaNumber null`);
        continue;
      }
      
      const orphaDiseaseId = orphaMap.get(orphaNumber);
      const mapped = orphaDiseaseId ? '✅' : '❌';
      console.log(`   ${i + 1}. ORPHA:${orphaNumber} ${mapped} ${orphaDiseaseId ? orphaDiseaseId.substring(0, 8) + '...' : 'NÃO MAPEADO'}`);
      
      const hpoAssociations = disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation;
      if (hpoAssociations && Array.isArray(hpoAssociations)) {
        console.log(`      📊 ${hpoAssociations.length} HPO associations`);
        
        // Mostrar primeira associação como exemplo
        if (hpoAssociations.length > 0) {
          const firstAssoc = hpoAssociations[0];
          const hpo = firstAssoc.HPO?.[0];
          if (hpo) {
            const hpoId = hpo.HPOId?.[0];
            const hpoTerm = hpo.HPOTerm?.[0];
            const frequency = firstAssoc.HPOFrequency?.[0]?.Name?.[0] || null;
            console.log(`      🧬 Exemplo: ${hpoId} - ${hpoTerm} (${frequency})`);
          }
        }
      } else {
        console.log(`      ❌ Sem HPO associations`);
      }
    }
    
    // 4. Teste de inserção manual
    console.log('\n🧪 TESTE DE INSERÇÃO MANUAL:');
    const testDisorder = hpoList.find(hpoStatus => {
      const disorder = hpoStatus.Disorder?.[0];
      const orphaNumber = disorder?.OrphaNumber?.[0];
      return orphaNumber && orphaMap.has(orphaNumber) && disorder.HPODisorderAssociationList?.[0]?.HPODisorderAssociation?.length > 0;
    });
    
    if (testDisorder) {
      const disorder = testDisorder.Disorder[0];
      const orphaNumber = disorder.OrphaNumber[0];
      const orphaDiseaseId = orphaMap.get(orphaNumber);
      const hpoAssoc = disorder.HPODisorderAssociationList[0].HPODisorderAssociation[0];
      const hpo = hpoAssoc.HPO[0];
      const hpoId = hpo.HPOId[0];
      const hpoTerm = hpo.HPOTerm[0];
      const frequency = hpoAssoc.HPOFrequency?.[0]?.Name?.[0] || null;
      
      console.log(`🎯 Teste com: ORPHA:${orphaNumber} -> ${hpoId} (${hpoTerm})`);
      
      try {
        // Tentar inserir um registro
        const testId = `test-${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO orpha_clinical_signs 
          (id, orpha_disease_id, sign_name, sign_name_pt, frequency, frequency_value, sign_category) 
          VALUES (${testId}, ${orphaDiseaseId}, ${hpoTerm}, ${null}, ${frequency}, ${null}, ${'HPO_Phenotype'})
        `;
        
        console.log('✅ Inserção de teste bem-sucedida!');
        
        // Verificar se foi inserido
        const inserted = await prisma.$queryRaw`
          SELECT * FROM orpha_clinical_signs WHERE id = ${testId}
        `;
        console.log('📊 Registro inserido:', inserted[0]);
        
        // Limpar teste
        await prisma.$executeRaw`DELETE FROM orpha_clinical_signs WHERE id = ${testId}`;
        
      } catch (error) {
        console.log('❌ Erro na inserção:', error.message);
      }
      
    } else {
      console.log('❌ Não encontrado disorder válido para teste');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProduct4();
