#!/usr/bin/env node

/**
 * IMPORTADOR ORPHANET 2025 - URLS ATUALIZADOS
 * ===========================================
 * Importação completa com URLs corretos do orphacode.org
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// URLs CORRETOS ORPHANET 2025
const ORPHANET_URLS = {
  // Base URL do Orphacode
  base: 'https://www.orphacode.org/data/xml/2025',
  
  // Nomenclatura Principal (EN/PT)
  nomenclatureEN: 'https://www.orphacode.org/data/xml/2025/en_ORPHAnomenclature.xml',
  nomenclaturePT: 'https://www.orphacode.org/data/xml/2025/pt_ORPHAnomenclature.xml',
  
  // Classificações por Especialidade
  linearisationEN: 'https://www.orphacode.org/data/xml/2025/en_ORPHAlinearisation.xml',
  
  // Mapeamentos ICD
  mappingICD10: 'https://www.orphacode.org/data/xml/2025/en_ORPHA_ICD10_mapping.xml',
  mappingICD11: 'https://www.orphacode.org/data/xml/2025/en_ORPHA_ICD11_mapping.xml',
  
  // Classificações médicas principais
  cardiologyClass: 'https://www.orphacode.org/data/xml/2025/en_ORPHAclassification_146.xml',
  metabolismClass: 'https://www.orphacode.org/data/xml/2025/en_ORPHAclassification_150.xml',
  neurologyClass: 'https://www.orphacode.org/data/xml/2025/en_ORPHAclassification_181.xml',
  geneticsClass: 'https://www.orphacode.org/data/xml/2025/en_ORPHAclassification_156.xml',
  hematologyClass: 'https://www.orphacode.org/data/xml/2025/en_ORPHAclassification_194.xml'
};

// Alternativas se os URLs 2025 não existirem
const FALLBACK_URLS = {
  nomenclatureEN: 'https://www.orphacode.org/data/xml/2024/en_ORPHAnomenclature.xml',
  nomenclaturePT: 'https://www.orphacode.org/data/xml/2024/pt_ORPHAnomenclature.xml',
  linearisationEN: 'https://www.orphacode.org/data/xml/2024/en_ORPHAlinearisation.xml',
  mappingICD10: 'https://www.orphacode.org/data/xml/2024/en_ORPHA_ICD10_mapping.xml',
  mappingICD11: 'https://www.orphacode.org/data/xml/2024/en_ORPHA_ICD11_mapping.xml'
};

class OrphanetImporter2025 {
  constructor() {
    this.stats = {
      diseases: { processed: 0, succeeded: 0, failed: 0 },
      classifications: { processed: 0, succeeded: 0, failed: 0 },
      mappings: { processed: 0, succeeded: 0, failed: 0 }
    };
    this.dataDir = path.join(process.cwd(), 'database', 'orphanet-2025');
  }

  async initialize() {
    console.log('🏥 IMPORTADOR ORPHANET 2025 - DADOS OFICIAIS');
    console.log('============================================');
    console.log('🌍 Fonte: www.orphacode.org');
    console.log('📅 Versão: 2025 (com fallback para 2024)\n');
    
    await fs.mkdir(this.dataDir, { recursive: true });
    console.log(`📁 Diretório: ${this.dataDir}\n`);
  }

  async downloadWithFallback(primaryUrl, fallbackUrl, filename) {
    console.log(`📥 Tentando: ${filename}...`);
    
    // Tentar URL primário (2025)
    try {
      console.log(`   🎯 URL 2025: ${primaryUrl}`);
      const response = await axios.get(primaryUrl, {
        timeout: 60000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OrphanetImporter/2025)',
          'Accept': 'application/xml, text/xml'
        }
      });
      
      const filepath = path.join(this.dataDir, filename);
      await fs.writeFile(filepath, response.data);
      
      console.log(`   ✅ Sucesso 2025: ${filename} (${response.data.length} bytes)`);
      return filepath;
      
    } catch (error2025) {
      console.log(`   ⚠️  2025 falhou: ${error2025.message}`);
      
      // Tentar URL fallback (2024)
      if (fallbackUrl) {
        try {
          console.log(`   🎯 URL 2024: ${fallbackUrl}`);
          const response = await axios.get(fallbackUrl, {
            timeout: 60000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; OrphanetImporter/2024)',
              'Accept': 'application/xml, text/xml'
            }
          });
          
          const filepath = path.join(this.dataDir, filename);
          await fs.writeFile(filepath, response.data);
          
          console.log(`   ✅ Sucesso 2024: ${filename} (${response.data.length} bytes)`);
          return filepath;
          
        } catch (error2024) {
          console.log(`   ❌ 2024 também falhou: ${error2024.message}`);
        }
      }
    }
    
    return null;
  }

  async downloadAll() {
    console.log('📦 FASE 1: DOWNLOAD ARQUIVOS ORPHANET');
    console.log('=====================================\n');
    
    const downloads = [
      {
        primary: ORPHANET_URLS.nomenclatureEN,
        fallback: FALLBACK_URLS.nomenclatureEN,
        filename: 'nomenclature_en.xml',
        key: 'nomenclature'
      },
      {
        primary: ORPHANET_URLS.nomenclaturePT,
        fallback: FALLBACK_URLS.nomenclaturePT,
        filename: 'nomenclature_pt.xml',
        key: 'nomenclature_pt'
      },
      {
        primary: ORPHANET_URLS.linearisationEN,
        fallback: FALLBACK_URLS.linearisationEN,
        filename: 'linearisation_en.xml',
        key: 'linearisation'
      },
      {
        primary: ORPHANET_URLS.mappingICD10,
        fallback: FALLBACK_URLS.mappingICD10,
        filename: 'mapping_icd10.xml',
        key: 'mapping_icd10'
      },
      {
        primary: ORPHANET_URLS.mappingICD11,
        fallback: FALLBACK_URLS.mappingICD11,
        filename: 'mapping_icd11.xml',
        key: 'mapping_icd11'
      }
    ];
    
    const files = {};
    
    for (const download of downloads) {
      const filepath = await this.downloadWithFallback(
        download.primary,
        download.fallback,
        download.filename
      );
      
      if (filepath) {
        files[download.key] = filepath;
      }
      
      // Pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log();
    }
    
    console.log(`📊 Downloads completados: ${Object.keys(files).length}/${downloads.length}\n`);
    return files;
  }

  async parseXML(filepath) {
    console.log(`🔄 Parseando: ${path.basename(filepath)}...`);
    
    try {
      const xml = await fs.readFile(filepath, 'utf-8');
      const parser = new xml2js.Parser({ 
        explicitArray: false,
        mergeAttrs: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });
      
      const result = await parser.parseStringPromise(xml);
      console.log(`   ✅ XML parseado`);
      return result;
      
    } catch (error) {
      console.log(`   ❌ Erro no parse: ${error.message}`);
      return null;
    }
  }

  async importNomenclature(files) {
    console.log('📚 FASE 2: IMPORTAÇÃO NOMENCLATURA');
    console.log('==================================\n');
    
    if (!files.nomenclature) {
      console.log('❌ Nomenclatura não disponível\n');
      return false;
    }
    
    // Parse nomenclatura principal
    const dataEN = await this.parseXML(files.nomenclature);
    if (!dataEN) return false;
    
    // Encontrar estrutura de doenças no XML
    let disorders = null;
    
    // Tentar diferentes estruturas XML
    if (dataEN.hpodisorders && dataEN.hpodisorders.hpodisorder) {
      disorders = Array.isArray(dataEN.hpodisorders.hpodisorder) 
        ? dataEN.hpodisorders.hpodisorder 
        : [dataEN.hpodisorders.hpodisorder];
    } else if (dataEN.orphadata && dataEN.orphadata.disorderlist) {
      disorders = Array.isArray(dataEN.orphadata.disorderlist.disorder)
        ? dataEN.orphadata.disorderlist.disorder
        : [dataEN.orphadata.disorderlist.disorder];
    } else if (dataEN.disorders && dataEN.disorders.disorder) {
      disorders = Array.isArray(dataEN.disorders.disorder)
        ? dataEN.disorders.disorder
        : [dataEN.disorders.disorder];
    }
    
    if (!disorders || disorders.length === 0) {
      console.log('❌ Nenhuma doença encontrada na estrutura XML');
      console.log('Estruturas encontradas:');
      console.log(Object.keys(dataEN));
      return false;
    }
    
    console.log(`🔢 Doenças encontradas: ${disorders.length}`);
    console.log('🚀 Importando...\n');
    
    // Importar em lotes
    const BATCH_SIZE = 50;
    let processed = 0;
    
    for (let i = 0; i < disorders.length; i += BATCH_SIZE) {
      const batch = disorders.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(disorders.length / BATCH_SIZE);
      
      console.log(`📦 Lote ${batchNum}/${totalBatches}: ${batch.length} doenças`);
      
      for (const disorder of batch) {
        try {
          await this.processDisorder(disorder);
          this.stats.diseases.succeeded++;
        } catch (error) {
          console.error(`Erro na doença: ${error.message}`);
          this.stats.diseases.failed++;
        }
        
        this.stats.diseases.processed++;
        processed++;
      }
      
      console.log(`   ✅ Lote ${batchNum}: processado`);
      console.log(`   📊 Total: ${processed}/${disorders.length} (${((processed/disorders.length)*100).toFixed(1)}%)\n`);
    }
    
    console.log(`✅ NOMENCLATURA COMPLETA: ${this.stats.diseases.succeeded} doenças importadas\n`);
    return true;
  }

  async processDisorder(disorder) {
    // Extrair número Orpha
    const orphaNumber = disorder.orphanumber || disorder.orphacode || disorder.id;
    if (!orphaNumber) return;
    
    const orphaCode = `ORPHA:${orphaNumber}`;
    
    // Nome da doença
    const name = this.extractName(disorder);
    if (!name) return;
    
    // Dados para salvar
    const diseaseData = {
      orphaNumber: orphaCode,
      orphaCode: orphaNumber.toString(),
      preferredNameEn: name,
      preferredNamePt: null,
      synonymsEn: this.extractSynonyms(disorder),
      synonymsPt: null,
      entityType: disorder.disordertype ? disorder.disordertype.name : 'Disease',
      classificationLevel: this.extractClassificationLevel(disorder),
      dateCreated: disorder.datecreated,
      dateModified: disorder.datemodified,
      expertLink: disorder.expertlink,
      isActiveDisease: true,
      isObsolete: false
    };
    
    // Salvar
    await prisma.orphaDisease.upsert({
      where: { orphaNumber: orphaCode },
      update: diseaseData,
      create: diseaseData
    });
  }

  extractName(disorder) {
    if (disorder.name) {
      if (disorder.name.$) return disorder.name.$;
      if (typeof disorder.name === 'string') return disorder.name;
    }
    
    if (disorder.preferredname) return disorder.preferredname;
    if (disorder.title) return disorder.title;
    
    return null;
  }

  extractSynonyms(disorder) {
    if (!disorder.synonymlist || !disorder.synonymlist.synonym) return null;
    
    const synonyms = Array.isArray(disorder.synonymlist.synonym)
      ? disorder.synonymlist.synonym
      : [disorder.synonymlist.synonym];
    
    const names = synonyms.map(s => {
      if (s && s.$) return s.$;
      if (typeof s === 'string') return s;
      return '';
    }).filter(s => s.length > 0);
    
    return names.length > 0 ? JSON.stringify(names) : null;
  }

  extractClassificationLevel(disorder) {
    if (disorder.classificationlevel) {
      return parseInt(disorder.classificationlevel) || 1;
    }
    return 1;
  }

  async printStats() {
    console.log('🎉 IMPORTAÇÃO FINALIZADA');
    console.log('========================\n');
    
    // Stats do banco
    const dbStats = {
      'Doenças Orphanet': await prisma.orphaDisease.count(),
      'Fenótipos HPO': await prisma.orphaPhenotype.count(),
      'Mapeamentos': await prisma.orphaExternalMapping.count(),
      'Genes': await prisma.orphaGeneAssociation.count(),
      'Classificações': await prisma.orphaMedicalClassification.count()
    };
    
    console.log('📊 BASE DE DADOS:');
    Object.entries(dbStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value.toLocaleString()}`);
    });
    
    console.log('\n📈 PROCESSAMENTO:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      if (stats.processed > 0) {
        console.log(`   ${type}: ${stats.processed} processados, ${stats.succeeded} sucessos, ${stats.failed} falhas`);
      }
    });
    
    console.log('\n🚀 SISTEMA ORPHANET BRASILEIRO ATUALIZADO!');
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// EXECUTAR
async function main() {
  const importer = new OrphanetImporter2025();
  
  try {
    await importer.initialize();
    
    // Download
    const files = await importer.downloadAll();
    
    if (Object.keys(files).length === 0) {
      console.log('❌ Nenhum arquivo baixado. Verifique conexão e URLs.');
      return;
    }
    
    // Importar nomenclatura
    await importer.importNomenclature(files);
    
    // Stats finais
    await importer.printStats();
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    console.error('Stack:', error.stack);
  } finally {
    await importer.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { OrphanetImporter2025 };
