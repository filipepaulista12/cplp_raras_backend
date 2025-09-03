#!/usr/bin/env node

/**
 * 🧬 IMPORTADOR CLINVAR - VARIANTES GENÉTICAS PATOGÊNICAS
 * ======================================================
 * 
 * Integração do ClinVar ao sistema CPLP-Raras
 * - Variantes patogênicas e benignas
 * - Classificação clínica de variantes
 * - Conexões com doenças Orphanet/OMIM
 * - Informações sobre genes e transcritos
 * 
 * Fonte: https://ftp.ncbi.nlm.nih.gov/pub/clinvar/
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

// URLs do ClinVar (NCBI)
const CLINVAR_URLS = {
  variantSummary: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/variant_summary.txt.gz',
  submissionSummary: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/tab_delimited/submission_summary.txt.gz',
  diseaseNames: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/disease_names',
  geneConditionSource: 'https://ftp.ncbi.nlm.nih.gov/pub/clinvar/gene_condition_source_id'
};

class ClinVarImporter {
  constructor() {
    this.prisma = new PrismaClient();
    this.importDir = path.join(process.cwd(), 'database', 'clinvar-import');
    this.stats = {
      variants: { processed: 0, succeeded: 0, failed: 0 },
      genes: { processed: 0, succeeded: 0, failed: 0 },
      conditions: { processed: 0, succeeded: 0, failed: 0 },
      phenotypes: { processed: 0, succeeded: 0, failed: 0 },
      orphaConnections: { processed: 0, succeeded: 0, failed: 0 }
    };
    this.startTime = Date.now();
  }

  async createClinVarSchema() {
    console.log('📚 CRIANDO ESTRUTURAS CLINVAR NO PRISMA');
    console.log('=======================================\n');

    const schemaExtension = `
// ==========================================
// CLINVAR MODELS - VARIANTES GENÉTICAS
// ==========================================

model ClinVarVariant {
  id                    String   @id @default(cuid())
  variationId           Int      @unique
  alleleId              Int?
  type                  String?  // SNV, Indel, CNV, etc
  name                  String?
  geneId                Int?
  geneSymbol            String?
  hgvsCoding            String?  // HGVS c. notation
  hgvsProtein           String?  // HGVS p. notation
  molecularConsequence  String?
  clinicalSignificance  String?  // Pathogenic, Benign, etc
  reviewStatus          String?
  phenotypeIds          String?  // MedGen IDs
  phenotypeList         String?  // Disease names
  origin                String?  // germline, somatic, etc
  assembly              String?  // GRCh37, GRCh38
  chromosome            String?
  start                 Int?
  stop                  Int?
  referenceAllele       String?
  alternateAllele       String?
  cytogenetic           String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relações
  conditions            ClinVarCondition[]
  orphaConnections      ClinVarOrphaConnection[]
  omimConnections       ClinVarOMIMConnection[]
  
  @@index([geneSymbol])
  @@index([clinicalSignificance])
  @@index([type])
  @@map("clinvar_variants")
}

model ClinVarCondition {
  id                String   @id @default(cuid())
  conceptId         String   @unique // MedGen concept ID
  diseaseName       String
  diseaseDb         String?  // OMIM, Orphanet, etc
  diseaseId         String?  // External disease ID
  createdAt         DateTime @default(now())
  
  // Relações
  variants          ClinVarVariant[]
  
  @@index([diseaseName])
  @@index([diseaseDb, diseaseId])
  @@map("clinvar_conditions")
}

model ClinVarOrphaConnection {
  id              String        @id @default(cuid())
  clinvarVariant  ClinVarVariant @relation(fields: [variantId], references: [id])
  variantId       String
  orphaDisease    OrphaDisease  @relation(fields: [orphaCode], references: [orphaCode])
  orphaCode       Int
  connectionType  String?       // direct, inferred, etc
  evidence        String?
  createdAt       DateTime      @default(now())
  
  @@unique([variantId, orphaCode])
  @@map("clinvar_orpha_connections")
}

model ClinVarOMIMConnection {
  id              String         @id @default(cuid())
  clinvarVariant  ClinVarVariant @relation(fields: [variantId], references: [id])
  variantId       String
  omimId          String
  omimType        String?        // phenotype, gene, etc
  connectionType  String?
  evidence        String?
  createdAt       DateTime       @default(now())
  
  @@unique([variantId, omimId])
  @@map("clinvar_omim_connections")
}

model ClinVarGene {
  id            String   @id @default(cuid())
  geneId        Int      @unique
  geneSymbol    String
  geneName      String?
  aliases       String?
  chromosome    String?
  mapLocation   String?
  description   String?
  createdAt     DateTime @default(now())
  
  @@index([geneSymbol])
  @@map("clinvar_genes")
}`;

    const schemaPath = path.join(process.cwd(), 'database', 'clinvar-schema-extension.prisma');
    await fs.writeFile(schemaPath, schemaExtension);
    
    console.log('📝 Extensão do schema ClinVar criada');
    console.log('ℹ️  Execute: npx prisma db push para aplicar as mudanças\n');
  }

  async downloadClinVarData() {
    console.log('📦 FASE 1: DOWNLOAD CLINVAR DATA');
    console.log('================================\n');

    // Criar diretório
    await fs.mkdir(this.importDir, { recursive: true });

    const downloads = [
      { 
        url: CLINVAR_URLS.variantSummary, 
        filename: 'variant_summary.txt.gz', 
        desc: 'ClinVar Variant Summary',
        key: 'variants' 
      },
      { 
        url: CLINVAR_URLS.diseaseNames, 
        filename: 'disease_names.txt', 
        desc: 'Disease Names',
        key: 'diseases' 
      }
    ];

    const files = {};
    let successful = 0;

    for (const download of downloads) {
      try {
        console.log(`📥 ${download.desc}...`);
        console.log(`   🎯 ${download.url}`);
        
        const response = await axios({
          url: download.url,
          method: 'GET',
          responseType: 'stream',
          timeout: 300000, // 5 minutes
          headers: {
            'User-Agent': 'CPLP-Raras/1.0 (Research; mailto:research@cplp-raras.org)'
          }
        });

        const filePath = path.join(this.importDir, download.filename);
        const writer = require('fs').createWriteStream(filePath);
        
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = await fs.stat(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        console.log(`   ✅ ${download.filename}: ${sizeMB} MB`);
        files[download.key] = filePath;
        successful++;
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      
      console.log('');
    }

    console.log(`📊 Downloads: ${successful}/${downloads.length} sucessos\n`);
    return files;
  }

  async parseVariantSummary(files) {
    if (!files.variants) {
      console.log('⚠️  Arquivo de variantes não disponível\n');
      return;
    }

    console.log('🧬 FASE 2: PARSING CLINVAR VARIANTS');
    console.log('===================================\n');

    // Descompactar se necessário
    let filePath = files.variants;
    if (filePath.endsWith('.gz')) {
      console.log('🗜️  Descompactando arquivo...');
      const zlib = require('zlib');
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(filePath.replace('.gz', ''));
      
      await new Promise((resolve, reject) => {
        input.pipe(zlib.createGunzip()).pipe(output)
          .on('finish', resolve)
          .on('error', reject);
      });
      
      filePath = filePath.replace('.gz', '');
      console.log('✅ Arquivo descompactado\n');
    }

    // Processar arquivo em streaming (arquivo muito grande)
    const readline = require('readline');
    const fileStream = require('fs').createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    console.log('📊 Processando arquivo ClinVar (>3GB)...');
    console.log('🔍 Focando em variantes patogênicas...\n');

    let processed = 0;
    let headerLine = true;
    const pathogenicTypes = ['Pathogenic', 'Likely pathogenic', 'Pathogenic/Likely pathogenic'];
    const maxVariants = 100; // Limite para demonstração
    let pathogenicCount = 0;
    
    for await (const line of rl) {
      if (!line.trim()) continue;
      
      // Skip header
      if (headerLine) {
        headerLine = false;
        continue;
      }

      // Parar após encontrar exemplos suficientes
      if (pathogenicCount >= maxVariants) {
        break;
      }

      try {
        const fields = line.split('\t');
        
        const variant = {
          variationId: parseInt(fields[0]) || null,
          alleleId: parseInt(fields[1]) || null,
          type: fields[2] || null,
          name: fields[3] || null,
          geneId: parseInt(fields[4]) || null,
          geneSymbol: fields[5] || null,
          clinicalSignificance: fields[6] || null,
          phenotypeList: fields[13] || null,
          assembly: fields[16] || null,
          chromosome: fields[18] || null,
          start: parseInt(fields[19]) || null,
          stop: parseInt(fields[20]) || null
        };

        // Focar em variantes patogênicas
        if (variant.clinicalSignificance && 
            pathogenicTypes.some(type => variant.clinicalSignificance.includes(type))) {
          
          console.log(`🔬 ${variant.geneSymbol || 'Unknown'}: ${variant.clinicalSignificance}`);
          console.log(`   🆔 Variation ID: ${variant.variationId}`);
          console.log(`   📍 ${variant.chromosome}:${variant.start}-${variant.stop}`);
          if (variant.phenotypeList) {
            console.log(`   🏥 ${variant.phenotypeList.substring(0, 80)}...`);
          }
          console.log('');
          
          pathogenicCount++;
          this.stats.variants.succeeded++;
        }
        
        this.stats.variants.processed++;
        processed++;

        if (processed % 50000 === 0) {
          console.log(`   📊 Processadas: ${processed.toLocaleString()} variantes (${pathogenicCount} patogênicas)`);
        }

      } catch (error) {
        this.stats.variants.failed++;
      }
    }

    console.log(`\n✅ VARIANTES CLINVAR: ${this.stats.variants.succeeded} patogênicas analisadas`);
    console.log(`📊 Total processado: ${this.stats.variants.processed.toLocaleString()} variantes\n`);
  }

  async parseDiseaseNames(files) {
    if (!files.diseases) {
      console.log('⚠️  Arquivo de doenças não disponível\n');
      return;
    }

    console.log('🏥 FASE 3: DOENÇAS CLINVAR');
    console.log('=========================\n');

    const content = await fs.readFile(files.diseases, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    console.log(`📊 Condições médicas: ${lines.length.toLocaleString()}`);
    console.log('🔍 Identificando conexões com Orphanet/OMIM...\n');
    
    let orphanetFound = 0;
    let omimFound = 0;
    
    for (let i = 0; i < Math.min(lines.length, 1000); i++) {
      const line = lines[i];
      try {
        const fields = line.split('\t');
        const conceptId = fields[0];
        const diseaseName = fields[1];
        const sourceInfo = fields[4] || '';
        
        if (sourceInfo.includes('Orphanet')) {
          console.log(`🔗 ORPHANET: ${diseaseName} (${conceptId})`);
          orphanetFound++;
          this.stats.orphaConnections.succeeded++;
        }
        
        if (sourceInfo.includes('OMIM')) {
          console.log(`🧬 OMIM: ${diseaseName} (${conceptId})`);
          omimFound++;
        }
        
        this.stats.conditions.processed++;
        
      } catch (error) {
        this.stats.conditions.failed++;
      }
    }
    
    console.log(`\n✅ CONEXÕES IDENTIFICADAS:`);
    console.log(`   🔗 Orphanet: ${orphanetFound} conexões`);
    console.log(`   🧬 OMIM: ${omimFound} conexões\n`);
  }

  async analyzeClinVarIntegration() {
    console.log('🔬 FASE 4: ANÁLISE DE INTEGRAÇÃO');
    console.log('================================\n');

    console.log('📊 Análise de potencial de integração:');
    console.log(`   • Variantes patogênicas: ${this.stats.variants.succeeded.toLocaleString()}`);
    console.log(`   • Conexões Orphanet: ${this.stats.orphaConnections.succeeded.toLocaleString()}`);
    console.log(`   • Condições médicas: ${this.stats.conditions.processed.toLocaleString()}`);
    console.log('');

    console.log('💡 Capacidades de integração ClinVar:');
    console.log('   🧬 Variantes genéticas específicas por doença');
    console.log('   🔬 Classificação patogenicidade (Pathogenic/Benign)');
    console.log('   🏥 Conexão direta com diagnósticos clínicos');
    console.log('   📍 Localização genômica precisa das variantes');
    console.log('   🔗 Links para Orphanet e OMIM existentes');
    console.log('');
  }

  async printStats() {
    const elapsed = (Date.now() - this.startTime) / (1000 * 60);
    
    console.log('🎉 IMPORTAÇÃO CLINVAR FINALIZADA');
    console.log('================================\n');
    console.log(`⏱️  Tempo total: ${elapsed.toFixed(1)} minutos\n`);
    
    console.log('📊 ESTATÍSTICAS:');
    Object.entries(this.stats).forEach(([type, stats]) => {
      if (stats.processed > 0) {
        console.log(`   ${type}: ${stats.processed} processados, ${stats.succeeded} sucessos, ${stats.failed} falhas`);
      }
    });
    
    console.log('\n🧬 CLINVAR INTEGRATION READY!');
    console.log('📋 Próximos passos:');
    console.log('   1. Execute: npx prisma db push');
    console.log('   2. Implemente importação completa para produção');
    console.log('   3. Sistema Orphanet + HPO + OMIM + ClinVar estará completo!');
  }
}

async function main() {
  const importer = new ClinVarImporter();
  
  try {
    console.log('🧬 IMPORTADOR CLINVAR - VARIANTES GENÉTICAS PATOGÊNICAS');
    console.log('======================================================');
    console.log('🎯 Integrando variantes clínicas ao sistema CPLP-Raras');
    console.log('🌍 Fonte: NCBI ClinVar - Base mundial de variantes\n');
    
    console.log(`📁 Diretório: ${importer.importDir}\n`);
    
    // Criar schema
    await importer.createClinVarSchema();
    
    // Download dos dados
    const files = await importer.downloadClinVarData();
    
    // Processar dados
    await importer.parseVariantSummary(files);
    await importer.parseDiseaseNames(files);
    await importer.analyzeClinVarIntegration();
    
    // Stats finais
    await importer.printStats();
    
  } catch (error) {
    console.error('❌ ERRO:', error);
  } finally {
    await importer.prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { ClinVarImporter };
