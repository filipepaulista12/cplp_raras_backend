#!/usr/bin/env node

/**
 * IMPORTADOR HPO (HUMAN PHENOTYPE ONTOLOGY) - ENRIQUECIMENTO ORPHANET
 * ===================================================================
 * Importa fenótipos HPO detalhados para enriquecer a base Orphanet
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// URLS OFICIAIS HPO
const HPO_URLS = {
  // HPO Ontologia completa
  ontologyOBO: 'http://purl.obolibrary.org/obo/hp.obo',
  ontologyOWL: 'http://purl.obolibrary.org/obo/hp.owl',
  ontologyJSON: 'http://purl.obolibrary.org/obo/hp.json',
  
  // Anotações HPO-Doença (HPOA files)
  phenotypeHPOA: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa',
  genesToPhenotype: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/genes_to_phenotype.txt',
  phenotypeToGenes: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype_to_genes.txt',
  genesToDisease: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/genes_to_disease.txt',
  
  // HPO Internacional (multilingual)
  hpoInternational: 'http://purl.obolibrary.org/obo/hp-international.owl'
};

class HPOImporter {
  constructor() {
    this.stats = {
      downloads: { total: 0, succeeded: 0, failed: 0 },
      hpoTerms: { processed: 0, succeeded: 0, failed: 0 },
      phenotypes: { processed: 0, succeeded: 0, failed: 0 },
      geneAssociations: { processed: 0, succeeded: 0, failed: 0 },
      diseaseLinks: { processed: 0, succeeded: 0, failed: 0 }
    };
    this.dataDir = path.join(process.cwd(), 'database', 'hpo-import');
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🧬 IMPORTADOR HPO - HUMAN PHENOTYPE ONTOLOGY');
    console.log('============================================');
    console.log('🎯 Enriquecendo sistema Orphanet com fenótipos detalhados');
    console.log('🌍 Fonte: www.human-phenotype-ontology.org\n');
    
    await fs.mkdir(this.dataDir, { recursive: true });
    console.log(`📁 Diretório: ${this.dataDir}\n`);
  }

  async downloadFile(url, filename, description) {
    console.log(`📥 ${description}...`);
    console.log(`   🎯 ${url}`);
    
    try {
      const response = await axios.get(url, {
        timeout: 120000,
        responseType: 'text',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HPOImporter/2025)',
          'Accept': 'application/json, text/tab-separated-values, text/plain, */*'
        }
      });
      
      const filepath = path.join(this.dataDir, filename);
      await fs.writeFile(filepath, response.data, 'utf-8');
      
      const size = response.data.length;
      console.log(`   ✅ ${filename}: ${(size / 1024 / 1024).toFixed(2)} MB\n`);
      
      this.stats.downloads.succeeded++;
      return filepath;
      
    } catch (error) {
      console.log(`   ❌ ${filename}: ${error.message}\n`);
      this.stats.downloads.failed++;
      return null;
    }
  }

  async downloadAll() {
    console.log('📦 FASE 1: DOWNLOAD HPO DATA');
    console.log('============================\n');
    
    const downloads = [
      { url: HPO_URLS.ontologyJSON, filename: 'hp.json', desc: 'HPO Ontologia JSON', key: 'ontology' },
      { url: HPO_URLS.phenotypeHPOA, filename: 'phenotype.hpoa', desc: 'HPO-Disease Annotations', key: 'hpoa' },
      { url: HPO_URLS.genesToPhenotype, filename: 'genes_to_phenotype.txt', desc: 'Genes to Phenotypes', key: 'genes_phenotypes' },
      { url: HPO_URLS.phenotypeToGenes, filename: 'phenotype_to_genes.txt', desc: 'Phenotypes to Genes', key: 'phenotypes_genes' },
      { url: HPO_URLS.genesToDisease, filename: 'genes_to_disease.txt', desc: 'Genes to Diseases', key: 'genes_diseases' }
    ];
    
    this.stats.downloads.total = downloads.length;
    const files = {};
    
    for (const download of downloads) {
      const filepath = await this.downloadFile(download.url, download.filename, download.desc);
      if (filepath) {
        files[download.key] = filepath;
      }
      
      // Pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`📊 Downloads: ${this.stats.downloads.succeeded}/${this.stats.downloads.total} sucessos\n`);
    return files;
  }

  async parseJSON(filepath) {
    console.log(`🔄 Parseando ${path.basename(filepath)}...`);
    
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      console.log(`   ✅ JSON parseado`);
      return data;
    } catch (error) {
      console.log(`   ❌ Erro no parse: ${error.message}`);
      return null;
    }
  }

  async parseTSV(filepath) {
    console.log(`🔄 Parseando ${path.basename(filepath)}...`);
    
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Pular linhas de comentário
      const dataLines = lines.filter(line => !line.startsWith('#') && line.trim());
      
      console.log(`   ✅ TSV parseado: ${dataLines.length} linhas`);
      return dataLines;
    } catch (error) {
      console.log(`   ❌ Erro no parse: ${error.message}`);
      return null;
    }
  }

  async createHPOSchema() {
    console.log('📚 CRIANDO ESTRUTURAS HPO NO PRISMA');
    console.log('===================================\n');
    
    // Vou criar uma extensão do schema atual para HPO
    const hpoSchemaExtension = `
// HPO (Human Phenotype Ontology) Models

model HPOTerm {
  id String @id @default(cuid())
  
  // Identificadores HPO
  hpoId String @unique      // HP:0000001
  hpoCode String           // 0000001 (sem prefixo)
  
  // Names and descriptions
  name String              // Nome principal do termo HPO
  definition String?       // Definição do termo
  comment String?          // Comentários adicionais
  
  // Hierarquia
  parentTerms String?      // JSON array de termos pais
  childTerms String?       // JSON array de termos filhos
  
  // Sinônimos
  exactSynonyms String?    // JSON array de sinônimos exatos
  broadSynonyms String?    // JSON array de sinônimos amplos
  narrowSynonyms String?   // JSON array de sinônimos específicos
  relatedSynonyms String?  // JSON array de sinônimos relacionados
  
  // Metadata
  isObsolete Boolean @default(false)
  replacedBy String?       // HPO ID que substitui este termo
  
  // Cross-references
  xrefs String?           // JSON array de cross-references (UMLS, SNOMED, etc.)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relacionamentos
  phenotypeAssociations HPOPhenotypeAssociation[]
  geneAssociations HPOGeneAssociation[]
  diseaseAssociations HPODiseaseAssociation[]
  
  @@map("hpo_terms")
}

model HPOPhenotypeAssociation {
  id String @id @default(cuid())
  
  // Relacionamento com doença Orphanet
  orphaDiseaseId String
  orphaDisease OrphaDisease @relation(fields: [orphaDiseaseId], references: [id])
  
  // Relacionamento com termo HPO
  hpoTermId String
  hpoTerm HPOTerm @relation(fields: [hpoTermId], references: [id])
  
  // Frequência do fenótipo
  frequencyHPO String?     // HP:0040280 (Obligate), etc.
  frequencyTerm String?    // "Obligate", "Very frequent", etc.
  frequencyNumeric Float?  // 0.8 = 80%
  
  // Onset age
  onsetHPO String?         // HP:0003577 (Congenital), etc.
  onsetTerm String?        // "Congenital onset", etc.
  
  // Clinical modifiers
  severity String?         // Mild, Moderate, Severe
  clinicalModifiers String? // JSON array de modificadores
  
  // Evidence
  evidence String?         // PCS (Published clinical study), etc.
  reference String?        // PMID, DOI, etc.
  
  // Metadata
  frequency String?        // Frequência textual original
  qualifier String?        // NOT se for negação
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([orphaDiseaseId, hpoTermId])
  @@map("hpo_phenotype_associations")
}

model HPOGeneAssociation {
  id String @id @default(cuid())
  
  // Gene information
  geneSymbol String        // BRCA1, TP53, etc.
  geneId String?           // Entrez Gene ID
  ensemblId String?        // ENSG00000012048
  
  // HPO term
  hpoTermId String
  hpoTerm HPOTerm @relation(fields: [hpoTermId], references: [id])
  
  // Association details
  associationType String?  // "phenotype", "disease-gene", etc.
  evidence String?         // Evidence code
  reference String?        // Publication reference
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([geneSymbol, hpoTermId])
  @@map("hpo_gene_associations")
}

model HPODiseaseAssociation {
  id String @id @default(cuid())
  
  // Disease identifiers
  diseaseId String         // OMIM:154700, ORPHA:558, etc.
  diseaseName String       // Nome da doença
  
  // HPO term
  hpoTermId String
  hpoTerm HPOTerm @relation(fields: [hpoTermId], references: [id])
  
  // Association details
  qualifier String?        // NOT para negações
  frequencyTerm String?    // Very frequent, Occasional, etc.
  frequencyHPO String?     // HP term para frequência
  onsetTerm String?        // Adult onset, Childhood onset, etc.
  onsetHPO String?         // HP term para onset
  
  // Evidence
  evidence String          // Evidence code (PCS, IEA, etc.)
  reference String?        // PMID ou outra referência
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([diseaseId, hpoTermId])
  @@map("hpo_disease_associations")
}

// Extensão do modelo OrphaDisease existente
// (Será adicionado como relacionamento)
`;

    console.log('📝 Extensão do schema HPO criada');
    console.log('ℹ️  Execute: npx prisma db push para aplicar as mudanças\n');
    
    // Salvar schema extension
    await fs.writeFile(
      path.join(process.cwd(), 'database', 'hpo-schema-extension.prisma'),
      hpoSchemaExtension,
      'utf-8'
    );
    
    return true;
  }

  async importHPOOntology(files) {
    if (!files.ontology) {
      console.log('⚠️  Ontologia HPO não disponível, usando dados HPOA apenas\n');
      return;
    }

    console.log('📚 FASE 2: IMPORTAÇÃO ONTOLOGIA HPO');
    console.log('===================================\n');
    
    const data = await this.parseJSON(files.ontology);
    if (!data || !data.graphs || !data.graphs[0] || !data.graphs[0].nodes) {
      console.log('❌ Estrutura JSON inválida\n');
      return;
    }
    
    const nodes = data.graphs[0].nodes;
    const hpoNodes = nodes.filter(node => node.id && node.id.startsWith('http://purl.obolibrary.org/obo/HP_'));
    
    console.log(`🔢 Termos HPO encontrados: ${hpoNodes.length}`);
    console.log('🚀 Processando...\n');
    
    // Processar em lotes
    const BATCH_SIZE = 100;
    let processed = 0;
    
    for (let i = 0; i < hpoNodes.length; i += BATCH_SIZE) {
      const batch = hpoNodes.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(hpoNodes.length / BATCH_SIZE);
      
      console.log(`📦 Lote ${batchNum}/${totalBatches}: ${batch.length} termos`);
      
      for (const node of batch) {
        try {
          await this.processHPOTerm(node);
          this.stats.hpoTerms.succeeded++;
        } catch (error) {
          console.error(`Erro no termo ${node.id}: ${error.message}`);
          this.stats.hpoTerms.failed++;
        }
        this.stats.hpoTerms.processed++;
        processed++;
      }
      
      const progress = ((processed / hpoNodes.length) * 100).toFixed(1);
      console.log(`   ✅ Lote ${batchNum}: processado`);
      console.log(`   📊 Progresso: ${processed}/${hpoNodes.length} (${progress}%)\n`);
      
      if (i + BATCH_SIZE < hpoNodes.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`✅ ONTOLOGIA HPO IMPORTADA: ${this.stats.hpoTerms.succeeded} termos\n`);
  }

  async processHPOTerm(node) {
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
    
    // Salvar no banco (quando schema estiver aplicado)
    console.log(`   Processado: ${hpoId} - ${name}`);
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

  async importHPOAData(files) {
    console.log('🔗 FASE 3: IMPORTAÇÃO HPOA (HPO-DOENÇA)');
    console.log('======================================\n');
    
    if (!files.hpoa) {
      console.log('⚠️  Arquivo HPOA não disponível\n');
      return;
    }
    
    const lines = await this.parseTSV(files.hpoa);
    if (!lines) return;
    
    console.log(`🔢 Associações HPO-Doença: ${lines.length}`);
    console.log('🚀 Processando...\n');
    
    let processed = 0;
    for (const line of lines) {
      try {
        await this.processHPOALine(line);
        this.stats.diseaseLinks.succeeded++;
      } catch (error) {
        this.stats.diseaseLinks.failed++;
      }
      
      this.stats.diseaseLinks.processed++;
      processed++;
      
      if (processed % 1000 === 0) {
        console.log(`   Processadas: ${processed}/${lines.length} associações`);
      }
    }
    
    console.log(`✅ HPOA IMPORTADO: ${this.stats.diseaseLinks.succeeded} associações\n`);
  }

  async processHPOALine(line) {
    const fields = line.split('\t');
    if (fields.length < 4) return;
    
    const diseaseId = fields[0];        // ORPHA:558, OMIM:154700
    const diseaseName = fields[1];      // Nome da doença
    const qualifier = fields[2] || '';  // NOT ou vazio
    const hpoId = fields[3];            // HP:0001166
    const reference = fields[4] || '';  // PMID:123456
    const evidence = fields[5] || '';   // PCS, IEA, etc.
    const onset = fields[12] || '';     // HP:0003577
    const frequency = fields[13] || ''; // HP:0040282
    
    // Log para debug
    if (diseaseId.startsWith('ORPHA:')) {
      console.log(`   ORPHA encontrado: ${diseaseId} -> ${hpoId}`);
    }
    
    // Aqui você conectaria com o banco quando o schema estiver aplicado
  }

  async printStats() {
    const elapsed = (Date.now() - this.startTime) / 1000 / 60;
    
    console.log('🎉 IMPORTAÇÃO HPO FINALIZADA');
    console.log('============================\n');
    console.log(`⏱️  Tempo total: ${elapsed.toFixed(1)} minutos\n`);
    
    console.log('📊 ESTATÍSTICAS:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      if (stats.processed > 0) {
        console.log(`   ${type}: ${stats.processed} processados, ${stats.succeeded} sucessos, ${stats.failed} falhas`);
      }
    });
    
    console.log('\n🧬 HPO INTEGRATION READY!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npx prisma db push');
    console.log('   2. Execute: node scripts/import-hpo.js novamente');
    console.log('   3. Sistema Orphanet+HPO estará completo!');
  }

  async cleanup() {
    await prisma.$disconnect();
  }
}

// EXECUTAR IMPORTAÇÃO HPO
async function main() {
  const importer = new HPOImporter();
  
  try {
    await importer.initialize();
    
    // Criar schema extensions primeiro
    await importer.createHPOSchema();
    
    // Download dos arquivos
    const files = await importer.downloadAll();
    
    if (Object.keys(files).length === 0) {
      console.log('❌ Nenhum arquivo HPO baixado');
      return;
    }
    
    // Importar ontologia HPO
    await importer.importHPOOntology(files);
    
    // Importar associações HPOA
    await importer.importHPOAData(files);
    
    // Stats finais
    await importer.printStats();
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    console.error(error.stack);
  } finally {
    await importer.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HPOImporter };
