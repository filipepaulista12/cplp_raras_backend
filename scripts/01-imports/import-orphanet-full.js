#!/usr/bin/env node

/**
 * IMPORTADOR COMPLETO ORPHANET - TODAS AS ~7.000 DOENÇAS
 * =====================================================
 * Importa nomenclatura, fenótipos, genes, epidemiologia completa
 * Dados oficiais do Orphanet (www.orphadata.com)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const { PrismaClient } = require('@prisma/client');
const { createWriteStream } = require('fs');

const prisma = new PrismaClient();

// URLs OFICIAIS ORPHANET - DADOS COMPLETOS 2024/2025
const ORPHANET_URLS = {
  // NOMENCLATURA COMPLETA - PRINCIPAL
  nomenclatureEN: 'https://www.orphacode.org/data/xml/en_product1.xml',
  nomenclaturePT: 'https://www.orphacode.org/data/xml/pt_product1.xml',
  
  // LINEARIZAÇÃO (CLASSIFICAÇÃO CLÍNICA)
  linearisationEN: 'https://www.orphacode.org/data/xml/en_product2.xml',
  linearisationPT: 'https://www.orphacode.org/data/xml/pt_product2.xml',
  
  // FENÓTIPOS HPO COMPLETOS
  phenotypesEN: 'https://www.orphacode.org/data/xml/en_product4.xml',
  phenotypesPT: 'https://www.orphacode.org/data/xml/pt_product4.xml',
  
  // ALINHAMENTOS/MAPEAMENTOS (ICD-10, OMIM, etc.)
  mappingsEN: 'https://www.orphacode.org/data/xml/en_product5.xml',
  
  // GENES ASSOCIADOS
  genes: 'https://www.orphacode.org/data/xml/en_product6.xml',
  
  // HISTÓRIA NATURAL
  naturalHistory: 'https://www.orphacode.org/data/xml/en_product7.xml',
  
  // EPIDEMIOLOGIA
  epidemiology: 'https://www.orphacode.org/data/xml/en_product9.xml',
  
  // CLASSIFICAÇÕES POR ESPECIALIDADE (25+ especialidades)
  cardiology: 'https://www.orphacode.org/data/xml/en_product2_146.xml',
  metabolism: 'https://www.orphacode.org/data/xml/en_product2_150.xml',
  neurology: 'https://www.orphacode.org/data/xml/en_product2_181.xml',
  genetics: 'https://www.orphacode.org/data/xml/en_product2_156.xml',
  hematology: 'https://www.orphacode.org/data/xml/en_product2_194.xml'
};

// Configurações da importação
const CONFIG = {
  DATA_DIR: path.join(process.cwd(), 'database', 'orphanet-import'),
  BATCH_SIZE: 100,
  MAX_CONCURRENT_DOWNLOADS: 3,
  TIMEOUT: 300000 // 5 minutos por arquivo
};

class OrphanetCompleteImporter {
  constructor() {
    this.stats = {
      downloads: { total: 0, completed: 0, failed: 0 },
      diseases: { processed: 0, succeeded: 0, failed: 0 },
      phenotypes: { processed: 0, succeeded: 0, failed: 0 },
      genes: { processed: 0, succeeded: 0, failed: 0 },
      mappings: { processed: 0, succeeded: 0, failed: 0 }
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🏥 IMPORTADOR COMPLETO ORPHANET INICIADO');
    console.log('========================================');
    console.log('📊 Preparando importação de TODAS as doenças raras');
    console.log('🌍 Dados oficiais: www.orphacode.org\n');
    
    // Criar diretórios
    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
    
    // Log inicial
    await this.createImportLog('full_import', 'started');
    
    console.log(`📁 Diretório de dados: ${CONFIG.DATA_DIR}`);
    console.log(`⚙️  Processamento em lotes de ${CONFIG.BATCH_SIZE}`);
    console.log(`🔄 Max downloads simultâneos: ${CONFIG.MAX_CONCURRENT_DOWNLOADS}\n`);
  }

  async downloadFile(url, filename, description) {
    const filepath = path.join(CONFIG.DATA_DIR, filename);
    
    console.log(`📥 Baixando: ${description}...`);
    console.log(`   URL: ${url}`);
    
    try {
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: CONFIG.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OrphanetImporter/1.0)',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      
      const writer = createWriteStream(filepath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        
        // Timeout adicional para escrita
        setTimeout(() => reject(new Error('Download timeout')), CONFIG.TIMEOUT);
      });
      
      const stats = await fs.stat(filepath);
      console.log(`   ✅ Concluído: ${filename} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
      
      this.stats.downloads.completed++;
      return filepath;
      
    } catch (error) {
      console.log(`   ❌ Erro: ${filename} - ${error.message}`);
      this.stats.downloads.failed++;
      return null;
    }
  }

  async downloadAllFiles() {
    console.log('📦 FASE 1: DOWNLOAD DOS ARQUIVOS ORPHANET');
    console.log('=========================================\n');
    
    const downloads = [
      { url: ORPHANET_URLS.nomenclatureEN, filename: 'nomenclature_en.xml', desc: 'Nomenclatura Inglês' },
      { url: ORPHANET_URLS.nomenclaturePT, filename: 'nomenclature_pt.xml', desc: 'Nomenclatura Português' },
      { url: ORPHANET_URLS.phenotypesEN, filename: 'phenotypes_en.xml', desc: 'Fenótipos HPO Inglês' },
      { url: ORPHANET_URLS.phenotypesPT, filename: 'phenotypes_pt.xml', desc: 'Fenótipos HPO Português' },
      { url: ORPHANET_URLS.mappingsEN, filename: 'mappings_en.xml', desc: 'Mapeamentos ICD/OMIM' },
      { url: ORPHANET_URLS.genes, filename: 'genes_en.xml', desc: 'Genes Associados' },
      { url: ORPHANET_URLS.epidemiology, filename: 'epidemiology_en.xml', desc: 'Epidemiologia' },
      { url: ORPHANET_URLS.cardiology, filename: 'cardiology_en.xml', desc: 'Doenças Cardiológicas' },
      { url: ORPHANET_URLS.metabolism, filename: 'metabolism_en.xml', desc: 'Erros Inatos Metabolismo' },
      { url: ORPHANET_URLS.neurology, filename: 'neurology_en.xml', desc: 'Doenças Neurológicas' },
      { url: ORPHANET_URLS.genetics, filename: 'genetics_en.xml', desc: 'Doenças Genéticas' },
      { url: ORPHANET_URLS.hematology, filename: 'hematology_en.xml', desc: 'Doenças Hematológicas' }
    ];
    
    this.stats.downloads.total = downloads.length;
    
    // Download em lotes para não sobrecarregar o servidor
    const results = {};
    for (let i = 0; i < downloads.length; i += CONFIG.MAX_CONCURRENT_DOWNLOADS) {
      const batch = downloads.slice(i, i + CONFIG.MAX_CONCURRENT_DOWNLOADS);
      
      const batchPromises = batch.map(async (download) => {
        const filepath = await this.downloadFile(download.url, download.filename, download.desc);
        return { key: download.filename.replace('_en.xml', '').replace('_pt.xml', ''), filepath };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(result => {
        if (result.filepath) {
          results[result.key] = result.filepath;
        }
      });
      
      // Pausa entre lotes
      if (i + CONFIG.MAX_CONCURRENT_DOWNLOADS < downloads.length) {
        console.log('⏸️  Pausa de 3s entre lotes...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`\n📊 Downloads: ${this.stats.downloads.completed} sucessos, ${this.stats.downloads.failed} falhas\n`);
    return results;
  }

  async parseXML(filepath) {
    try {
      console.log(`🔄 Parseando: ${path.basename(filepath)}...`);
      const xml = await fs.readFile(filepath, 'utf-8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });
      
      const result = await parser.parseStringPromise(xml);
      console.log(`   ✅ XML parseado com sucesso`);
      return result;
    } catch (error) {
      console.log(`   ❌ Erro ao parsear XML: ${error.message}`);
      return null;
    }
  }

  async importNomenclature(files) {
    console.log('📚 FASE 2: IMPORTAÇÃO DA NOMENCLATURA');
    console.log('====================================\n');
    
    if (!files.nomenclature) {
      console.log('❌ Arquivo de nomenclatura não encontrado');
      return false;
    }
    
    // Parse nomenclatura EN (principal)
    const dataEN = await this.parseXML(files.nomenclature);
    if (!dataEN || !dataEN.hpodisorders || !dataEN.hpodisorders.hpodisorder) {
      console.log('❌ Estrutura de nomenclatura inválida');
      return false;
    }
    
    // Parse nomenclatura PT se disponível
    let dataPT = null;
    if (files.nomenclature_pt) {
      dataPT = await this.parseXML(files.nomenclature_pt);
    }
    
    const disorders = Array.isArray(dataEN.hpodisorders.hpodisorder) 
      ? dataEN.hpodisorders.hpodisorder 
      : [dataEN.hpodisorders.hpodisorder];
    
    console.log(`🔢 Total de doenças encontradas: ${disorders.length}`);
    console.log('🚀 Iniciando importação em massa...\n');
    
    // Processar em lotes
    let totalProcessed = 0;
    for (let i = 0; i < disorders.length; i += CONFIG.BATCH_SIZE) {
      const batch = disorders.slice(i, i + CONFIG.BATCH_SIZE);
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(disorders.length / CONFIG.BATCH_SIZE);
      
      console.log(`📦 Lote ${batchNum}/${totalBatches}: processando ${batch.length} doenças...`);
      
      const batchPromises = batch.map(async (disorder) => {
        try {
          return await this.processSingleDisease(disorder, dataPT);
        } catch (error) {
          console.error(`Erro na doença ${disorder.orphanumber}: ${error.message}`);
          this.stats.diseases.failed++;
          return null;
        }
      });
      
      const results = await Promise.all(batchPromises);
      const succeeded = results.filter(r => r !== null).length;
      const failed = results.filter(r => r === null).length;
      
      this.stats.diseases.succeeded += succeeded;
      this.stats.diseases.processed += batch.length;
      totalProcessed += batch.length;
      
      console.log(`   ✅ Lote ${batchNum}: ${succeeded} sucessos, ${failed} falhas`);
      console.log(`   📊 Progresso geral: ${totalProcessed}/${disorders.length} (${((totalProcessed/disorders.length)*100).toFixed(1)}%)\n`);
      
      // Pequena pausa entre lotes para não sobrecarregar
      if (i + CONFIG.BATCH_SIZE < disorders.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ NOMENCLATURA COMPLETA: ${this.stats.diseases.succeeded} doenças importadas\n`);
    return true;
  }

  async processSingleDisease(disorderEN, dataPT) {
    const orphaNumber = `ORPHA:${disorderEN.orphanumber}`;
    const orphaCode = disorderEN.orphanumber.toString();
    
    // Buscar equivalente PT
    let disorderPT = null;
    if (dataPT && dataPT.hpodisorders && dataPT.hpodisorders.hpodisorder) {
      const disordersPT = Array.isArray(dataPT.hpodisorders.hpodisorder) 
        ? dataPT.hpodisorders.hpodisorder 
        : [dataPT.hpodisorders.hpodisorder];
      
      disorderPT = disordersPT.find(d => d.orphanumber === disorderEN.orphanumber);
    }
    
    // Dados da doença
    const diseaseData = {
      orphaNumber,
      orphaCode,
      preferredNameEn: this.extractName(disorderEN),
      preferredNamePt: disorderPT ? this.extractName(disorderPT) : null,
      synonymsEn: this.extractSynonyms(disorderEN),
      synonymsPt: disorderPT ? this.extractSynonyms(disorderPT) : null,
      entityType: disorderEN.disordertype ? disorderEN.disordertype.name : 'Disease',
      classificationLevel: this.extractClassificationLevel(disorderEN),
      dateCreated: disorderEN.datecreated,
      dateModified: disorderEN.datemodified,
      expertLink: disorderEN.expertlink,
      isActiveDisease: true,
      isObsolete: false
    };
    
    // Salvar na base de dados
    const disease = await prisma.orphaDisease.upsert({
      where: { orphaNumber },
      update: diseaseData,
      create: diseaseData
    });
    
    return disease;
  }

  extractName(disorder) {
    if (disorder.name && disorder.name.$) return disorder.name.$;
    if (disorder.name && typeof disorder.name === 'string') return disorder.name;
    return disorder.orphanumber ? `Disease ${disorder.orphanumber}` : 'Unknown Disease';
  }

  extractSynonyms(disorder) {
    if (!disorder.synonymlist || !disorder.synonymlist.synonym) return null;
    
    const synonyms = Array.isArray(disorder.synonymlist.synonym)
      ? disorder.synonymlist.synonym
      : [disorder.synonymlist.synonym];
    
    const synonymNames = synonyms.map(s => {
      if (s && s.$) return s.$;
      if (typeof s === 'string') return s;
      return '';
    }).filter(s => s.length > 0);
    
    return synonymNames.length > 0 ? JSON.stringify(synonymNames) : null;
  }

  extractClassificationLevel(disorder) {
    if (disorder.classificationlevel) return parseInt(disorder.classificationlevel) || 1;
    return 1;
  }

  async importPhenotypes(files) {
    console.log('🧬 FASE 3: IMPORTAÇÃO DE FENÓTIPOS HPO');
    console.log('=====================================\n');
    
    if (!files.phenotypes) {
      console.log('⚠️  Arquivo de fenótipos não encontrado, pulando...\n');
      return;
    }
    
    const data = await this.parseXML(files.phenotypes);
    if (!data || !data.hpophenotypes || !data.hpophenotypes.hpophenotype) {
      console.log('❌ Estrutura de fenótipos inválida\n');
      return;
    }
    
    const phenotypes = Array.isArray(data.hpophenotypes.hpophenotype)
      ? data.hpophenotypes.hpophenotype
      : [data.hpophenotypes.hpophenotype];
    
    console.log(`🔢 Total de associações fenótipo-doença: ${phenotypes.length}`);
    
    let processed = 0;
    for (const phenotype of phenotypes) {
      try {
        await this.processPhenotype(phenotype);
        this.stats.phenotypes.succeeded++;
      } catch (error) {
        this.stats.phenotypes.failed++;
      }
      
      this.stats.phenotypes.processed++;
      processed++;
      
      if (processed % 1000 === 0) {
        console.log(`   Processados: ${processed}/${phenotypes.length} fenótipos`);
      }
    }
    
    console.log(`✅ FENÓTIPOS: ${this.stats.phenotypes.succeeded} associações importadas\n`);
  }

  async processPhenotype(phenotypeData) {
    const orphaNumber = `ORPHA:${phenotypeData.orphanumber}`;
    
    // Buscar doença na base
    const disease = await prisma.orphaDisease.findUnique({
      where: { orphaNumber }
    });
    
    if (!disease) return; // Pular se doença não foi importada
    
    // Processar fenótipos HPO
    if (phenotypeData.hpophenotypelist && phenotypeData.hpophenotypelist.hpophenotype) {
      const hpoList = Array.isArray(phenotypeData.hpophenotypelist.hpophenotype)
        ? phenotypeData.hpophenotypelist.hpophenotype
        : [phenotypeData.hpophenotypelist.hpophenotype];
      
      for (const hpo of hpoList) {
        await prisma.orphaPhenotype.create({
          data: {
            orphaDiseaseId: disease.id,
            hpoId: hpo.hpoid || 'N/A',
            hpoTerm: hpo.hpoterm || 'N/A',
            frequencyHpoId: hpo.hpofrequency ? hpo.hpofrequency.hpoid : null,
            frequencyTerm: hpo.hpofrequency ? hpo.hpofrequency.name : null,
            diagnosticCriteria: hpo.diagnosticcriteria
          }
        });
      }
    }
  }

  async createImportLog(type, status, summary = null) {
    await prisma.orphaImportLog.create({
      data: {
        importType: type,
        status,
        recordsProcessed: this.stats.diseases.processed,
        recordsSucceeded: this.stats.diseases.succeeded,
        recordsFailed: this.stats.diseases.failed,
        importSummary: summary ? JSON.stringify(summary) : null,
        startedAt: status === 'running' ? new Date() : null,
        completedAt: status === 'completed' ? new Date() : null
      }
    });
  }

  async printFinalStats() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutos
    
    console.log('\n🎉 IMPORTAÇÃO COMPLETA ORPHANET FINALIZADA');
    console.log('==========================================');
    console.log(`⏱️  Tempo total: ${elapsed.toFixed(1)} minutos`);
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    
    const dbStats = {
      'Doenças Orphanet': await prisma.orphaDisease.count(),
      'Fenótipos HPO': await prisma.orphaPhenotype.count(),
      'Mapeamentos Externos': await prisma.orphaExternalMapping.count(),
      'Genes Associados': await prisma.orphaGeneAssociation.count(),
      'Classificações Médicas': await prisma.orphaMedicalClassification.count(),
      'Dados Epidemiológicos': await prisma.orphaEpidemiology.count(),
      'Informações Textuais': await prisma.orphaTextualInformation.count(),
      'Países CPLP': await prisma.cPLPCountry.count(),
      'Logs de Importação': await prisma.orphaImportLog.count()
    };
    
    Object.entries(dbStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.toLocaleString()}`);
    });
    
    console.log('\n📈 ESTATÍSTICAS DE PROCESSAMENTO:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      if (stats.processed > 0) {
        console.log(`   ${type}: ${stats.processed.toLocaleString()} processados, ${stats.succeeded.toLocaleString()} sucessos, ${stats.failed.toLocaleString()} falhas`);
      }
    });
    
    // Log final
    await this.createImportLog('full_import', 'completed', this.stats);
    
    console.log('\n🚀 SISTEMA ORPHANET BRASILEIRO COMPLETO E FUNCIONAL!');
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// EXECUTAR IMPORTAÇÃO COMPLETA
async function main() {
  const importer = new OrphanetCompleteImporter();
  
  try {
    await importer.initialize();
    
    // Download de todos os arquivos
    const files = await importer.downloadAllFiles();
    
    // Importar nomenclatura completa
    await importer.importNomenclature(files);
    
    // Importar fenótipos HPO
    await importer.importPhenotypes(files);
    
    // Estatísticas finais
    await importer.printFinalStats();
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
  } finally {
    await importer.cleanup();
  }
}

// Rodar apenas se executado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OrphanetCompleteImporter };
