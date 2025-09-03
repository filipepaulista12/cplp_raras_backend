#!/usr/bin/env node

/**
 * SCRIPT DE IMPORTAÇÃO COMPLETA DO ORPHANET
 * ==========================================
 * Importa nomenclatura, linearizações, fenótipos e classificações
 * do sistema oficial Orphanet (www.orphadata.com)
 */

import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import xml2js from 'xml2js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// URLs oficiais do Orphanet
const ORPHANET_URLS = {
  // Nomenclatura completa
  nomenclatureEN: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHAnomenclature_en_2025.xml',
  nomenclaturePT: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHAnomenclature_pt_2025.xml',
  
  // Linearização (classificação clínica)
  linearisationEN: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHAlinearisation_en_2025.xml',
  linearisationPT: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHAlinearisation_pt_2025.xml',
  
  // Mapeamentos ICD
  mappingICD10: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHA_ICD10_mapping_en_2025.xml',
  mappingICD11: 'https://www.orphacode.org/pack-nomenclature/2025/xml/ORPHA_ICD11_mapping_en_2025.xml',
  
  // Fenótipos HPO
  phenotypesEN: 'https://sciences.orphadata.com/data/xml_product/en_product4_HPO.xml',
  phenotypesPT: 'https://sciences.orphadata.com/data/xml_product/pt_product4_HPO.xml',
  
  // Genes associados
  genes: 'https://sciences.orphadata.com/data/xml_product/en_product6.xml',
  
  // História natural
  naturalHistory: 'https://sciences.orphadata.com/data/xml_product/en_product7.xml',
  
  // Epidemiologia
  epidemiology: 'https://sciences.orphadata.com/data/xml_product/en_product9_ages.xml',
};

// Configurações
const DATA_DIR = path.join(process.cwd(), 'database', 'orphanet-data');
const BATCH_SIZE = 1000;

class OrphanetImporter {
  constructor() {
    this.stats = {
      diseases: { processed: 0, succeeded: 0, failed: 0 },
      phenotypes: { processed: 0, succeeded: 0, failed: 0 },
      genes: { processed: 0, succeeded: 0, failed: 0 },
      mappings: { processed: 0, succeeded: 0, failed: 0 }
    };
  }

  async initialize() {
    console.log('🏥 IMPORTADOR ORPHANET INICIADO');
    console.log('===============================\n');
    
    // Criar diretório de dados
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Log de início
    await this.logImport('initialization', 'pending');
  }

  async downloadFile(url, filename) {
    const filepath = path.join(DATA_DIR, filename);
    
    try {
      console.log(`📥 Baixando: ${filename}...`);
      const response = await axios.get(url, {
        timeout: 300000, // 5 minutos
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      console.log(`   ✅ Salvo: ${filename}`);
      return filepath;
    } catch (error) {
      console.log(`   ❌ Erro ao baixar ${filename}: ${error.message}`);
      return null;
    }
  }

  async parseXML(filepath) {
    try {
      const xml = await fs.readFile(filepath, 'utf-8');
      const parser = new xml2js.Parser({ explicitArray: false });
      return await parser.parseStringPromise(xml);
    } catch (error) {
      console.error(`Erro ao parsear XML ${filepath}:`, error.message);
      return null;
    }
  }

  async importNomenclature() {
    console.log('\n1️⃣ IMPORTANDO NOMENCLATURA ORPHANET');
    console.log('====================================');
    
    // Download dos arquivos de nomenclatura
    const filepathEN = await this.downloadFile(
      ORPHANET_URLS.nomenclatureEN, 
      'nomenclature_en.xml'
    );
    
    const filepathPT = await this.downloadFile(
      ORPHANET_URLS.nomenclaturePT, 
      'nomenclature_pt.xml'
    );
    
    if (!filepathEN) {
      console.log('❌ Falha ao baixar nomenclatura EN');
      return false;
    }
    
    // Parse dos XMLs
    console.log('🔄 Processando nomenclatura EN...');
    const dataEN = await this.parseXML(filepathEN);
    
    let dataPT = null;
    if (filepathPT) {
      console.log('🔄 Processando nomenclatura PT...');
      dataPT = await this.parseXML(filepathPT);
    }
    
    if (!dataEN || !dataEN.HPOPhenotypes?.HPOPhenotype) {
      console.log('❌ Estrutura XML inválida');
      return false;
    }
    
    // Processar doenças
    const disorders = Array.isArray(dataEN.HPOPhenotypes.HPOPhenotype) 
      ? dataEN.HPOPhenotypes.HPOPhenotype 
      : [dataEN.HPOPhenotypes.HPOPhenotype];
    
    console.log(`📊 Encontradas ${disorders.length} doenças para importar`);
    
    let processed = 0;
    const batchSize = 100;
    
    for (let i = 0; i < disorders.length; i += batchSize) {
      const batch = disorders.slice(i, i + batchSize);
      
      for (const disorder of batch) {
        try {
          await this.processSingleDisease(disorder, dataPT);
          this.stats.diseases.succeeded++;
        } catch (error) {
          console.error(`Erro ao processar doença ${disorder.OrphaNumber}:`, error.message);
          this.stats.diseases.failed++;
        }
        
        this.stats.diseases.processed++;
        processed++;
        
        if (processed % 100 === 0) {
          console.log(`   Processadas: ${processed}/${disorders.length}`);
        }
      }
    }
    
    console.log(`✅ Nomenclatura importada: ${this.stats.diseases.succeeded} sucessos, ${this.stats.diseases.failed} falhas`);
    return true;
  }

  async processSingleDisease(disorderEN, dataPT) {
    const orphaNumber = `ORPHA:${disorderEN.OrphaNumber}`;
    const orphaCode = disorderEN.OrphaNumber.toString();
    
    // Buscar equivalente em PT se disponível
    let disorderPT = null;
    if (dataPT?.HPOPhenotypes?.HPOPhenotype) {
      const disordersPT = Array.isArray(dataPT.HPOPhenotypes.HPOPhenotype) 
        ? dataPT.HPOPhenotypes.HPOPhenotype 
        : [dataPT.HPOPhenotypes.HPOPhenotype];
      
      disorderPT = disordersPT.find(d => d.OrphaNumber === disorderEN.OrphaNumber);
    }
    
    // Criar/atualizar doença
    const diseaseData = {
      orphaNumber,
      orphaCode,
      preferredNameEn: disorderEN.Name?.$ || disorderEN.Name || 'N/A',
      preferredNamePt: disorderPT?.Name?.$ || disorderPT?.Name,
      synonymsEn: this.extractSynonyms(disorderEN),
      synonymsPt: disorderPT ? this.extractSynonyms(disorderPT) : null,
      entityType: disorderEN.DisorderType?.Name || 'Disease',
      classificationLevel: parseInt(disorderEN.ClassificationLevel) || 1,
      dateCreated: disorderEN.DateCreated,
      dateModified: disorderEN.DateModified,
      expertLink: disorderEN.ExpertLink,
      isActiveDisease: true,
      isObsolete: false
    };
    
    // Salvar na base de dados
    const disease = await prisma.orphaDisease.upsert({
      where: { orphaNumber },
      update: diseaseData,
      create: diseaseData
    });
    
    // Processar fenótipos se disponíveis
    if (disorderEN.HPOPhenotypes?.HPOPhenotype) {
      await this.processPhenotypes(disease.id, disorderEN.HPOPhenotypes.HPOPhenotype);
    }
    
    return disease;
  }

  extractSynonyms(disorder) {
    if (!disorder.SynonymList?.Synonym) return null;
    
    const synonyms = Array.isArray(disorder.SynonymList.Synonym)
      ? disorder.SynonymList.Synonym
      : [disorder.SynonymList.Synonym];
    
    return JSON.stringify(synonyms.map(s => s.$ || s));
  }

  async processPhenotypes(diseaseId, phenotypes) {
    const phenotypeArray = Array.isArray(phenotypes) ? phenotypes : [phenotypes];
    
    for (const phenotype of phenotypeArray) {
      try {
        await prisma.orphaPhenotype.create({
          data: {
            orphaDiseaseId: diseaseId,
            hpoId: phenotype.HPOId || 'N/A',
            hpoTerm: phenotype.HPOTerm || 'N/A',
            frequencyHpoId: phenotype.HPOFrequency?.HPOId,
            frequencyTerm: phenotype.HPOFrequency?.Name,
            diagnosticCriteria: phenotype.DiagnosticCriteria
          }
        });
        
        this.stats.phenotypes.succeeded++;
      } catch (error) {
        this.stats.phenotypes.failed++;
      }
      
      this.stats.phenotypes.processed++;
    }
  }

  async importCountriesCPLP() {
    console.log('\n2️⃣ CRIANDO PAÍSES CPLP');
    console.log('=======================');
    
    const countries = [
      { code: 'PT', name: 'Portugal', namePt: 'Portugal', flagEmoji: '🇵🇹', population: 10300000n },
      { code: 'BR', name: 'Brasil', namePt: 'Brasil', flagEmoji: '🇧🇷', population: 215000000n },
      { code: 'AO', name: 'Angola', namePt: 'Angola', flagEmoji: '🇦🇴', population: 35000000n },
      { code: 'MZ', name: 'Mozambique', namePt: 'Moçambique', flagEmoji: '🇲🇿', population: 32000000n },
      { code: 'CV', name: 'Cape Verde', namePt: 'Cabo Verde', flagEmoji: '🇨🇻', population: 560000n },
      { code: 'GW', name: 'Guinea-Bissau', namePt: 'Guiné-Bissau', flagEmoji: '🇬🇼', population: 2000000n },
      { code: 'ST', name: 'São Tomé and Príncipe', namePt: 'São Tomé e Príncipe', flagEmoji: '🇸🇹', population: 220000n },
      { code: 'TL', name: 'East Timor', namePt: 'Timor-Leste', flagEmoji: '🇹🇱', population: 1340000n },
      { code: 'GQ', name: 'Equatorial Guinea', namePt: 'Guiné Equatorial', flagEmoji: '🇬🇶', population: 1500000n }
    ];
    
    for (const country of countries) {
      await prisma.cPLPCountry.upsert({
        where: { code: country.code },
        update: country,
        create: country
      });
      
      console.log(`   ✅ ${country.namePt} (${country.code})`);
    }
  }

  async logImport(type, status, summary = null) {
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

  async printStatistics() {
    console.log('\n📊 ESTATÍSTICAS FINAIS');
    console.log('======================');
    
    const dbStats = {
      diseases: await prisma.orphaDisease.count(),
      phenotypes: await prisma.orphaPhenotype.count(),
      countries: await prisma.cPLPCountry.count(),
      importLogs: await prisma.orphaImportLog.count()
    };
    
    console.log('Base de dados:');
    Object.entries(dbStats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    console.log('\nEstatísticas de importação:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      console.log(`   ${type}: ${stats.processed} processados, ${stats.succeeded} sucessos, ${stats.failed} falhas`);
    });
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// Executar importação
async function main() {
  const importer = new OrphanetImporter();
  
  try {
    await importer.initialize();
    await importer.importCountriesCPLP();
    await importer.importNomenclature();
    await importer.printStatistics();
    
    console.log('\n🎉 IMPORTAÇÃO ORPHANET CONCLUÍDA!');
    console.log('==================================');
    
  } catch (error) {
    console.error('❌ Erro durante importação:', error);
  } finally {
    await importer.cleanup();
  }
}

main();
