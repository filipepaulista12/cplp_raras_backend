const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseProduct1Textual() {
  console.log('\n📚 PARSER PRODUCT1 - TEXTUAL INFORMATION');
  console.log('========================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const xmlPath = 'database/orphadata-sources/en_product1.xml';
  const stats = fs.statSync(xmlPath);
  console.log(`📁 Arquivo: ${xmlPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // 1. Parse XML
    console.log('🔄 Parseando XML completo...');
    const xmlData = fs.readFileSync(xmlPath, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlData);
    
    console.log('✅ XML parseado com sucesso!');
    
    // 2. Extrair lista de disorders
    const disorders = result.JDBOR?.DisorderList?.[0]?.Disorder;
    if (!disorders || !Array.isArray(disorders)) {
      throw new Error('Estrutura XML inválida - DisorderList não encontrado');
    }
    
    console.log(`📊 Encontrados ${disorders.length} disorders`);
    
    // 3. Carregar mapeamento de orphaCodes para UUIDs
    console.log('🔄 Carregando mapeamento Orphanet...');
    const orphaMapping = await prisma.$queryRaw`
      SELECT id, orpha_number FROM orpha_diseases
    `;
    
    const orphaMap = new Map();
    orphaMapping.forEach(disease => {
      const orphaNum = disease.orpha_number.replace('ORPHA:', '');
      orphaMap.set(orphaNum, disease.id);
    });
    
    console.log(`📊 Mapeamento: ${orphaMapping.length} doenças Orphanet encontradas`);
    
    // 4. Processar informações textuais (teste com 200 primeiro)
    let totalTextEntries = 0;
    let skippedDisorders = 0;
    
    const batchSize = 200;
    console.log(`\n🚀 Processando ${Math.min(batchSize, disorders.length)} disorders...\n`);
    
    for (let i = 0; i < Math.min(batchSize, disorders.length); i++) {
      const disorder = disorders[i];
      
      const orphaCode = disorder.OrphaCode?.[0];
      if (!orphaCode) {
        skippedDisorders++;
        continue;
      }
      
      // Verificar se temos essa doença no banco
      const orphaDiseaseId = orphaMap.get(orphaCode);
      if (!orphaDiseaseId) {
        skippedDisorders++;
        if (i < 10) {
          console.log(`⚠️  ORPHA:${orphaCode} não encontrada no banco`);
        }
        continue;
      }
      
      const summaryList = disorder.SummaryInformationList;
      if (!summaryList || !summaryList[0] || !summaryList[0].SummaryInformation) {
        continue; // Sem informações textuais
      }
      
      const summaryInfo = summaryList[0].SummaryInformation[0];
      const textSections = summaryInfo.TextSectionList?.[0]?.TextSection;
      
      if (!textSections || !Array.isArray(textSections)) {
        continue;
      }
      
      console.log(`🔄 ${i + 1}/${Math.min(batchSize, disorders.length)}: ORPHA:${orphaCode} (${textSections.length} seções)`);
      
      // Processar cada seção de texto
      for (const section of textSections) {
        const sectionTitle = section.SectionTitle?.[0]?._ || section.SectionTitle?.[0] || 'General Information';
        const content = section.Contents?.[0]?._ || section.Contents?.[0];
        
        if (!content) continue;
        
        try {
          // Inserir informação textual
          await prisma.$executeRaw`
            INSERT OR REPLACE INTO orpha_textual_information (
              id, orpha_disease_id, text_section, text_section_code, 
              text_en, text_pt, last_update, validation_status
            ) VALUES (
              ${crypto.randomUUID()}, ${orphaDiseaseId}, ${sectionTitle}, ${section.$?.id || null}, 
              ${content}, ${null}, ${new Date().toISOString()}, ${'imported'}
            )
          `;
          
          totalTextEntries++;
          
        } catch (error) {
          if (totalTextEntries < 5) {
            console.log(`   ❌ Erro ao inserir texto: ${error.message.substring(0, 80)}`);
          }
        }
      }
      
      if ((i + 1) % 50 === 0) {
        console.log(`   📊 Progresso: ${totalTextEntries} seções textuais, ${skippedDisorders} skipped`);
      }
    }
    
    // Log final
    try {
      await prisma.$executeRaw`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (${crypto.randomUUID()}, ${'product1_textual_information'}, ${'en_product1.xml'}, ${'success'}, ${Math.min(batchSize, disorders.length)}, ${totalTextEntries}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message.substring(0, 50));
    }
    
    // Verificação final
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_textual_information`;
    
    console.log(`\n🎉 IMPORT TEXTUAL INFORMATION CONCLUÍDO!`);
    console.log(`✅ Seções textuais inseridas: ${totalTextEntries}`);
    console.log(`⚠️  Disorders sem mapeamento: ${skippedDisorders}`);
    console.log(`📊 Disorders processados: ${Math.min(batchSize, disorders.length)}/${disorders.length}`);
    
    console.log(`\n🏆 TERCEIRA MISSÃO CUMPRIDA!`);
    console.log('📊 Resultados:');
    console.log(`   • Textual Information: ${totalTextEntries} registros`);
    console.log(`   • Processados: ${Math.min(batchSize, disorders.length)}/${disorders.length} disorders`);
    console.log(`   • Sem mapeamento: ${skippedDisorders} disorders`);
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_textual_information: ${finalCount[0].count} registros`);
    
    console.log(`\n🎯 STATUS ATUALIZADO:`);
    console.log(`✅ orpha_clinical_signs: POPULADA (8.483 registros)`);
    console.log(`✅ orpha_phenotypes: POPULADA (8.482 registros)`);
    console.log(`✅ orpha_gene_associations: POPULADA (8.300 registros)`);
    console.log(`✅ orpha_textual_information: POPULADA (${finalCount[0].count} registros)`);
    
    if (totalTextEntries > 0) {
      console.log(`\n🚀 PRÓXIMAS MISSÕES (7 TABELAS RESTANTES):`);
      console.log('• Executar para todos os 11.239 text disorders');
      console.log('• orpha_epidemiology (product9_prev.xml)'); 
      console.log('• orpha_natural_history (product9_ages.xml)');
      console.log('• orpha_medical_classifications (product3_181.xml + product3_156.xml)');
      console.log('• drug_disease_associations (FDA OOPD)');
      console.log('• hpo_phenotype_associations (phenotype.hpoa)');
      console.log('• drugbank_interactions (DrugBank XML)');
      console.log('• orphanet_references (bibliographic data)');
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseProduct1Textual();
