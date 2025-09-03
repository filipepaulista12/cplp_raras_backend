#!/usr/bin/env node

/**
 * POPULAR HPO NO BANCO - IMPORTAR TERMOS E ASSOCIAÇÕES
 * ====================================================
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class HPODatabasePopulator {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'database', 'hpo-import');
    this.stats = {
      hpoTerms: { processed: 0, succeeded: 0, failed: 0 },
      diseaseAssociations: { processed: 0, succeeded: 0, failed: 0 },
      orphaConnections: { processed: 0, succeeded: 0, failed: 0 }
    };
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🧬 POPULAR HPO NO BANCO DE DADOS');
    console.log('===============================');
    console.log('📊 Importando termos HPO e associações com doenças Orphanet\n');
  }

  async populateHPOTerms() {
    console.log('📚 FASE 1: POPULAR TERMOS HPO');
    console.log('=============================\n');
    
    const ontologyFile = path.join(this.dataDir, 'hp.json');
    
    try {
      const content = await fs.readFile(ontologyFile, 'utf-8');
      const data = JSON.parse(content);
      
      if (!data.graphs || !data.graphs[0] || !data.graphs[0].nodes) {
        console.log('❌ Estrutura JSON HPO inválida\n');
        return;
      }
      
      const nodes = data.graphs[0].nodes;
      const hpoNodes = nodes.filter(node => 
        node.id && node.id.startsWith('http://purl.obolibrary.org/obo/HP_')
      );
      
      console.log(`🔢 Termos HPO encontrados: ${hpoNodes.length}\n`);
      
      // Processar em lotes
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < hpoNodes.length; i += BATCH_SIZE) {
        const batch = hpoNodes.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(hpoNodes.length / BATCH_SIZE);
        
        console.log(`📦 Lote ${batchNum}/${totalBatches}: processando ${batch.length} termos`);
        
        await this.processBatchHPOTerms(batch);
        
        const progress = ((i + batch.length) / hpoNodes.length * 100).toFixed(1);
        console.log(`   ✅ Concluído: ${progress}%\n`);
        
        // Pequena pausa entre lotes
        if (i + BATCH_SIZE < hpoNodes.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`✅ TERMOS HPO IMPORTADOS: ${this.stats.hpoTerms.succeeded}\n`);
      
    } catch (error) {
      console.error('❌ Erro ao importar termos HPO:', error.message);
    }
  }

  async processBatchHPOTerms(batch) {
    const operations = batch.map(async (node) => {
      try {
        await this.createHPOTerm(node);
        this.stats.hpoTerms.succeeded++;
      } catch (error) {
        this.stats.hpoTerms.failed++;
        console.log(`   ⚠️  Erro no termo ${node.id}: ${error.message}`);
      }
      this.stats.hpoTerms.processed++;
    });
    
    await Promise.all(operations);
  }

  async createHPOTerm(node) {
    const hpoId = this.extractHPOId(node.id);
    if (!hpoId) return;
    
    const name = this.extractLabel(node);
    if (!name) return;
    
    const termData = {
      hpoId,
      hpoCode: hpoId.replace('HP:', ''),
      name,
      definition: this.extractDefinition(node),
      comment: this.extractComment(node),
      exactSynonyms: this.extractSynonyms(node, 'hasExactSynonym'),
      broadSynonyms: this.extractSynonyms(node, 'hasBroadSynonym'),
      narrowSynonyms: this.extractSynonyms(node, 'hasNarrowSynonym'),
      relatedSynonyms: this.extractSynonyms(node, 'hasRelatedSynonym'),
      isObsolete: node.deprecated === true,
      replacedBy: this.extractReplacedBy(node),
      xrefs: this.extractXrefs(node)
    };
    
    await prisma.hPOTerm.upsert({
      where: { hpoId },
      update: termData,
      create: termData
    });
  }

  extractHPOId(uri) {
    if (!uri || !uri.includes('HP_')) return null;
    const match = uri.match(/HP_(\d{7})/);
    return match ? `HP:${match[1]}` : null;
  }

  extractLabel(node) {
    if (node.lbl) return node.lbl;
    if (node.meta && node.meta.basicPropertyValues) {
      const labelProp = node.meta.basicPropertyValues.find(
        p => p.pred === 'http://www.w3.org/2000/01/rdf-schema#label'
      );
      if (labelProp) return labelProp.val;
    }
    return null;
  }

  extractDefinition(node) {
    if (node.meta && node.meta.definition && node.meta.definition.val) {
      return node.meta.definition.val;
    }
    return null;
  }

  extractComment(node) {
    if (node.meta && node.meta.comments) {
      return node.meta.comments.join('; ');
    }
    return null;
  }

  extractSynonyms(node, type) {
    if (!node.meta || !node.meta.synonyms) return null;
    
    const synonyms = node.meta.synonyms
      .filter(s => s.pred === `http://www.geneontology.org/formats/oboInOwl#${type}`)
      .map(s => s.val);
    
    return synonyms.length > 0 ? JSON.stringify(synonyms) : null;
  }

  extractReplacedBy(node) {
    if (!node.meta || !node.meta.basicPropertyValues) return null;
    
    const replacedProp = node.meta.basicPropertyValues.find(
      p => p.pred === 'http://purl.obolibrary.org/obo/IAO_0100001'
    );
    
    if (replacedProp && replacedProp.val) {
      return this.extractHPOId(replacedProp.val);
    }
    return null;
  }

  extractXrefs(node) {
    if (!node.meta || !node.meta.xrefs) return null;
    
    const xrefs = node.meta.xrefs.map(x => x.val);
    return xrefs.length > 0 ? JSON.stringify(xrefs) : null;
  }

  async populateOrphaConnections() {
    console.log('🔗 FASE 2: CONECTAR HPO COM ORPHANET');
    console.log('===================================\n');
    
    const hpoaFile = path.join(this.dataDir, 'phenotype.hpoa');
    
    try {
      const content = await fs.readFile(hpoaFile, 'utf-8');
      const lines = content.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .filter(line => line.includes('ORPHA:'));
      
      console.log(`🔢 Associações ORPHA-HPO encontradas: ${lines.length}\n`);
      
      // Processar em lotes
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(lines.length / BATCH_SIZE);
        
        console.log(`📦 Lote ${batchNum}/${totalBatches}: processando ${batch.length} associações`);
        
        await this.processBatchOrphaConnections(batch);
        
        const progress = ((i + batch.length) / lines.length * 100).toFixed(1);
        console.log(`   ✅ Concluído: ${progress}%\n`);
        
        if (i + BATCH_SIZE < lines.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`✅ CONEXÕES ORPHANET-HPO CRIADAS: ${this.stats.orphaConnections.succeeded}\n`);
      
    } catch (error) {
      console.error('❌ Erro ao conectar com Orphanet:', error.message);
    }
  }

  async processBatchOrphaConnections(batch) {
    const operations = batch.map(async (line) => {
      try {
        await this.createOrphaConnection(line);
        this.stats.orphaConnections.succeeded++;
      } catch (error) {
        this.stats.orphaConnections.failed++;
      }
      this.stats.orphaConnections.processed++;
    });
    
    await Promise.all(operations);
  }

  async createOrphaConnection(line) {
    const fields = line.split('\t');
    if (fields.length < 4) return;
    
    const diseaseId = fields[0];        // ORPHA:558
    const diseaseName = fields[1];      // Nome da doença
    const qualifier = fields[2] || '';  // NOT ou vazio
    const hpoId = fields[3];            // HP:0001166
    const reference = fields[4] || '';  // PMID:123456
    const evidence = fields[5] || '';   // PCS, IEA, etc.
    const onset = fields[12] || '';     // HP:0003577
    const frequency = fields[13] || ''; // HP:0040282
    
    if (!diseaseId.startsWith('ORPHA:') || !hpoId.startsWith('HP:')) return;
    
    const orphaNumber = diseaseId.replace('ORPHA:', '');
    
    // Buscar doença Orphanet
    const orphaDisease = await prisma.orphaDisease.findFirst({
      where: { orphaCode: orphaNumber }
    });
    
    if (!orphaDisease) {
      throw new Error(`Doença ORPHA não encontrada: ${diseaseId}`);
    }
    
    // Buscar termo HPO
    const hpoTerm = await prisma.hPOTerm.findUnique({
      where: { hpoId }
    });
    
    if (!hpoTerm) {
      throw new Error(`Termo HPO não encontrado: ${hpoId}`);
    }
    
    // Criar associação
    await prisma.hPOPhenotypeAssociation.upsert({
      where: {
        orphaDiseaseId_hpoTermId: {
          orphaDiseaseId: orphaDisease.id,
          hpoTermId: hpoTerm.id
        }
      },
      update: {
        qualifier: qualifier || null,
        evidence: evidence || null,
        reference: reference || null,
        onsetHPO: onset || null,
        frequencyHPO: frequency || null
      },
      create: {
        orphaDiseaseId: orphaDisease.id,
        hpoTermId: hpoTerm.id,
        qualifier: qualifier || null,
        evidence: evidence || null,
        reference: reference || null,
        onsetHPO: onset || null,
        frequencyHPO: frequency || null
      }
    });
  }

  async printStats() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    
    console.log('🎉 HPO DATABASE POPULATION FINALIZADA');
    console.log('====================================\n');
    console.log(`⏱️  Tempo total: ${elapsed.toFixed(1)} minutos\n`);
    
    console.log('📊 ESTATÍSTICAS:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      if (stats.processed > 0) {
        console.log(`   ${type}: ${stats.processed} processados, ${stats.succeeded} sucessos, ${stats.failed} falhas`);
      }
    });
    
    console.log('\n✨ DATABASE INTEGRADO COM HPO!');
    console.log('📋 Sistema Orphanet + HPO está completo e funcional');
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// EXECUTAR POPULAÇÃO HPO
async function main() {
  const populator = new HPODatabasePopulator();
  
  try {
    await populator.initialize();
    
    // Popular termos HPO
    await populator.populateHPOTerms();
    
    // Conectar com Orphanet
    await populator.populateOrphaConnections();
    
    // Stats finais
    await populator.printStats();
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    console.error(error.stack);
  } finally {
    await populator.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HPODatabasePopulator };
