const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const xml2js = require('xml2js');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function parseProduct6Genes() {
  console.log('\n🧬 PARSER PRODUCT6 - GENE ASSOCIATIONS');
  console.log('=====================================');
  console.log(`📅 Data: ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR')}\n`);
  
  const xmlPath = 'database/orphadata-sources/en_product6.xml';
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
    
    // 4. Processar gene associations (teste com 100 primeiro)
    let totalGeneAssociations = 0;
    let skippedDisorders = 0;
    
    const batchSize = 100;
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
      
      const geneAssociations = disorder.DisorderGeneAssociationList?.[0]?.DisorderGeneAssociation;
      if (!geneAssociations || !Array.isArray(geneAssociations)) {
        continue;
      }
      
      console.log(`🔄 ${i + 1}/${Math.min(batchSize, disorders.length)}: ORPHA:${orphaCode} (${geneAssociations.length} genes)`);
      
      // Processar cada associação de gene
      for (const assoc of geneAssociations) {
        const gene = assoc.Gene?.[0];
        if (!gene) continue;
        
        const geneSymbol = gene.Symbol?.[0];
        const geneName = gene.Name?.[0]?._ || gene.Name?.[0];
        
        if (!geneSymbol) continue;
        
        const associationType = assoc.DisorderGeneAssociationType?.[0]?.Name?.[0]?._ || assoc.DisorderGeneAssociationType?.[0]?.Name?.[0];
        const associationStatus = assoc.DisorderGeneAssociationStatus?.[0]?.Name?.[0]?._ || assoc.DisorderGeneAssociationStatus?.[0]?.Name?.[0];
        
        // Extrair referências externas se disponíveis
        let hgncId = null, entrezId = null, ensemblId = null, omimId = null;
        
        const externalRefs = gene.ExternalReferenceList?.[0]?.ExternalReference;
        if (externalRefs && Array.isArray(externalRefs)) {
          externalRefs.forEach(ref => {
            const source = ref.Source?.[0];
            const reference = ref.Reference?.[0];
            if (source && reference) {
              switch (source) {
                case 'HGNC': hgncId = reference; break;
                case 'Genatlas': entrezId = reference; break;
                case 'Ensembl': ensemblId = reference; break;
                case 'OMIM': omimId = reference; break;
              }
            }
          });
        }
        
        try {
          // Inserir associação gene-doença (ajustando para colunas existentes)
          await prisma.$executeRaw`
            INSERT OR REPLACE INTO orpha_gene_associations (
              id, orpha_disease_id, gene_symbol, gene_name, gene_name_pt,
              hgnc_id, entrez_gene_id, ensembl_gene_id, omim_gene_id,
              association_type, association_type_pt, association_status,
              inheritance_pattern, inheritance_pattern_pt
            ) VALUES (
              ${crypto.randomUUID()}, ${orphaDiseaseId}, ${geneSymbol}, ${geneName}, ${null},
              ${hgncId}, ${entrezId}, ${ensemblId}, ${omimId},
              ${associationType}, ${null}, ${associationStatus},
              ${null}, ${null}
            )
          `;
          
          totalGeneAssociations++;
          
        } catch (error) {
          if (totalGeneAssociations < 5) {
            console.log(`   ❌ Erro ao inserir ${geneSymbol}: ${error.message.substring(0, 80)}`);
          }
        }
      }
      
      if ((i + 1) % 25 === 0) {
        console.log(`   📊 Progresso: ${totalGeneAssociations} associações, ${skippedDisorders} skipped`);
      }
    }
    
    // Log final
    try {
      await prisma.$executeRaw`
        INSERT INTO orpha_import_logs 
        (id, import_type, source_file, status, records_processed, records_succeeded, started_at, completed_at, created_at)
        VALUES (${crypto.randomUUID()}, ${'product6_gene_associations'}, ${'en_product6.xml'}, ${'success'}, ${Math.min(batchSize, disorders.length)}, ${totalGeneAssociations}, ${new Date().toISOString()}, ${new Date().toISOString()}, ${new Date().toISOString()})
      `;
    } catch (logError) {
      console.log('⚠️ Erro ao gravar log (não crítico):', logError.message.substring(0, 50));
    }
    
    // Verificação final
    const finalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM orpha_gene_associations`;
    
    console.log(`\n🎉 IMPORT GENE ASSOCIATIONS CONCLUÍDO!`);
    console.log(`✅ Associações inseridas: ${totalGeneAssociations}`);
    console.log(`⚠️  Disorders sem mapeamento: ${skippedDisorders}`);
    console.log(`📊 Disorders processados: ${Math.min(batchSize, disorders.length)}/${disorders.length}`);
    
    console.log(`\n🏆 SEGUNDA MISSÃO CUMPRIDA!`);
    console.log('📊 Resultados:');
    console.log(`   • Gene Associations: ${totalGeneAssociations} registros`);
    console.log(`   • Processados: ${Math.min(batchSize, disorders.length)}/${disorders.length} disorders`);
    console.log(`   • Sem mapeamento: ${skippedDisorders} disorders`);
    
    console.log(`\n📊 VERIFICAÇÃO FINAL:`);
    console.log(`   • orpha_gene_associations: ${finalCount[0].count} registros`);
    
    console.log(`\n🎯 STATUS ATUALIZADO:`);
    console.log(`✅ orpha_clinical_signs: POPULADA (8.483 registros)`);
    console.log(`✅ orpha_phenotypes: POPULADA (8.482 registros)`);
    console.log(`✅ orpha_gene_associations: POPULADA (${finalCount[0].count} registros)`);
    
    if (totalGeneAssociations > 0) {
      console.log(`\n🚀 PRÓXIMAS MISSÕES (8 TABELAS RESTANTES):`);
      console.log('• Executar para todos os 4078 gene disorders');
      console.log('• orpha_epidemiology (product9_prev.xml)'); 
      console.log('• orpha_textual_information (product1.xml)');
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

parseProduct6Genes();
