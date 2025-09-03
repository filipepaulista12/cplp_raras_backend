/**
 * Script de Transformação de Dados GARD
 * Converte dados brutos do scraping para o formato do banco GARD-BR
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import _ from 'lodash';

// Schemas de validação
const RawDiseaseSchema = z.object({
  gardId: z.string().optional(),
  title: z.string(),
  synonyms: z.array(z.string()).optional(),
  summary: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  causes: z.string().optional(),
  treatment: z.string().optional(),
  frequency: z.string().optional(),
  inheritance: z.string().optional(),
  orphaCode: z.string().optional(),
  icdCode: z.string().optional(),
  sources: z.array(z.string()).optional(),
  url: z.string(),
  scrapedAt: z.string()
});

const TransformedDiseaseSchema = z.object({
  id: z.string(),
  gard_br_id: z.string(),
  gard_id_original: z.string().optional(),
  name_en: z.string(),
  name_pt: z.string().optional(),
  synonyms: z.array(z.string()),
  category: z.string(),
  orpha_code: z.string().optional(),
  icd10_code: z.string().optional(),
  prevalence: z.string().optional(),
  inheritance_pattern: z.string().optional(),
  age_of_onset: z.string().optional(),
  last_updated: z.string(),
  summary: z.string().optional(),
  symptoms: z.array(z.string()),
  causes: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  prognosis: z.string().optional(),
  support_organizations: z.array(z.string()),
  clinical_trials: z.array(z.string()),
  recent_articles: z.array(z.string()),
  patient_resources: z.array(z.string()),
  expert_reviewers: z.array(z.string()),
  sources: z.array(z.string())
});

type RawDisease = z.infer<typeof RawDiseaseSchema>;
type TransformedDisease = z.infer<typeof TransformedDiseaseSchema>;

class GARDDataTransformer {
  private categoryMappings = new Map<string, string>();
  private transformationStats = {
    totalProcessed: 0,
    totalTransformed: 0,
    totalFailed: 0,
    fieldCompleteness: {} as Record<string, number>
  };

  constructor() {
    this.initializeCategoryMappings();
  }

  private initializeCategoryMappings() {
    // Mapeamento de palavras-chave para categorias
    const mappings = [
      { keywords: ['syndrome', 'síndrome'], category: 'Síndromes Genéticas' },
      { keywords: ['dystrophy', 'muscular'], category: 'Doenças Neuromusculares' },
      { keywords: ['anemia', 'blood', 'hematologic'], category: 'Doenças do Sangue' },
      { keywords: ['cancer', 'tumor', 'carcinoma', 'sarcoma'], category: 'Neoplasias Raras' },
      { keywords: ['metabolic', 'enzyme', 'deficiency'], category: 'Doenças Metabólicas' },
      { keywords: ['neurological', 'brain', 'neural'], category: 'Doenças Neurológicas' },
      { keywords: ['cardiac', 'heart', 'cardiovascular'], category: 'Doenças Cardiovasculares' },
      { keywords: ['skeletal', 'bone', 'osteo'], category: 'Doenças Ósseas' },
      { keywords: ['skin', 'dermatologic'], category: 'Doenças Dermatológicas' },
      { keywords: ['eye', 'ocular', 'vision'], category: 'Doenças Oftalmológicas' },
      { keywords: ['kidney', 'renal'], category: 'Doenças Renais' },
      { keywords: ['liver', 'hepatic'], category: 'Doenças Hepáticas' },
      { keywords: ['lung', 'pulmonary', 'respiratory'], category: 'Doenças Respiratórias' },
      { keywords: ['immune', 'immunodeficiency'], category: 'Imunodeficiências' },
      { keywords: ['connective tissue'], category: 'Doenças do Tecido Conjuntivo' }
    ];

    mappings.forEach(mapping => {
      mapping.keywords.forEach(keyword => {
        this.categoryMappings.set(keyword.toLowerCase(), mapping.category);
      });
    });
  }

  async loadRawData(inputDir: string): Promise<RawDisease[]> {
    console.log(`📥 Carregando dados brutos de: ${inputDir}`);
    
    const files = await fs.readdir(inputDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && file.startsWith('batch-'));
    
    const allData: RawDisease[] = [];
    
    for (const file of jsonFiles) {
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      
      try {
        const batchData = JSON.parse(content) as RawDisease[];
        const validatedData = batchData.map(item => RawDiseaseSchema.parse(item));
        allData.push(...validatedData);
        console.log(`   ✅ ${file}: ${validatedData.length} registros`);
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${file}:`, error);
      }
    }

    console.log(`📊 Total de registros carregados: ${allData.length}`);
    return allData;
  }

  transformDisease(raw: RawDisease, index: number): TransformedDisease | null {
    try {
      // Gerar ID único
      const id = this.generateId(raw.title, index);
      const gardBrId = `GARD-BR-${String(index + 1000).padStart(4, '0')}`;

      // Determinar categoria
      const category = this.determineCategory(raw);

      // Processar sintomas
      const symptoms = this.processSymptoms(raw.symptoms);

      // Processar sinônimos
      const synonyms = raw.synonyms || [];

      // Determinar idade de início baseada no conteúdo
      const ageOfOnset = this.determineAgeOfOnset(raw);

      // Padronizar códigos
      const orphaCode = this.standardizeOrphaCode(raw.orphaCode);
      const icd10Code = this.standardizeIcd10Code(raw.icdCode);

      // Extrair informações de herança mais detalhadas
      const inheritancePattern = this.processInheritancePattern(raw.inheritance);

      const transformed: TransformedDisease = {
        id,
        gard_br_id: gardBrId,
        gard_id_original: raw.gardId,
        name_en: raw.title,
        name_pt: undefined, // Para preenchimento posterior por IA
        synonyms,
        category,
        orpha_code: orphaCode,
        icd10_code: icd10Code,
        prevalence: this.standardizePrevalence(raw.frequency),
        inheritance_pattern: inheritancePattern,
        age_of_onset: ageOfOnset,
        last_updated: new Date().toISOString().split('T')[0],
        summary: raw.summary,
        symptoms,
        causes: raw.causes,
        diagnosis: undefined, // Campo novo, não disponível nos dados brutos
        treatment: raw.treatment,
        prognosis: undefined, // Campo novo, não disponível nos dados brutos
        support_organizations: [],
        clinical_trials: [],
        recent_articles: [],
        patient_resources: [],
        expert_reviewers: [],
        sources: raw.sources || []
      };

      // Validar dados transformados
      return TransformedDiseaseSchema.parse(transformed);

    } catch (error) {
      console.error(`❌ Erro ao transformar doença ${raw.title}:`, error);
      this.transformationStats.totalFailed++;
      return null;
    }
  }

  private generateId(title: string, index: number): string {
    // Criar ID baseado no título limpo
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    return `gard-br-${String(index + 1000).padStart(4, '0')}-${cleanTitle}`.substring(0, 100);
  }

  private determineCategory(raw: RawDisease): string {
    const text = `${raw.title} ${raw.summary || ''} ${raw.causes || ''}`.toLowerCase();
    
    for (const [keyword, category] of this.categoryMappings) {
      if (text.includes(keyword)) {
        return category;
      }
    }
    
    // Categoria padrão
    return 'Doenças Genéticas';
  }

  private processSymptoms(symptoms?: string[]): string[] {
    if (!symptoms || symptoms.length === 0) {
      return [];
    }

    return symptoms
      .map(symptom => symptom.trim())
      .filter(symptom => symptom.length > 0)
      .filter(symptom => symptom.length < 200) // Filtrar sintomas muito longos
      .slice(0, 20); // Limitar a 20 sintomas
  }

  private determineAgeOfOnset(raw: RawDisease): string {
    const text = `${raw.summary || ''} ${raw.causes || ''}`.toLowerCase();
    
    if (text.includes('birth') || text.includes('neonatal') || text.includes('congenital')) {
      return 'Nascimento';
    } else if (text.includes('infancy') || text.includes('infant')) {
      return 'Infância';
    } else if (text.includes('childhood') || text.includes('child')) {
      return 'Infância';
    } else if (text.includes('adolescent') || text.includes('teenage')) {
      return 'Adolescência';
    } else if (text.includes('adult') || text.includes('middle age')) {
      return 'Idade adulta';
    } else if (text.includes('elderly') || text.includes('late onset')) {
      return 'Idade avançada';
    }
    
    return 'Variável';
  }

  private standardizeOrphaCode(code?: string): string | undefined {
    if (!code) return undefined;
    
    const match = code.match(/ORPHA[:\s]*(\d+)/i);
    return match ? `ORPHA${match[1]}` : undefined;
  }

  private standardizeIcd10Code(code?: string): string | undefined {
    if (!code) return undefined;
    
    const match = code.match(/([A-Z]\d{2}(?:\.\d{1,2})?)/);
    return match ? match[1] : undefined;
  }

  private standardizePrevalence(frequency?: string): string | undefined {
    if (!frequency) return undefined;
    
    const text = frequency.toLowerCase();
    
    if (text.includes('rare') || text.includes('ultra-rare')) {
      return 'Ultra-rara (< 1 em 50.000)';
    } else if (text.includes('common')) {
      return 'Rara (1 em 2.000)';
    }
    
    return frequency;
  }

  private processInheritancePattern(inheritance?: string): string | undefined {
    if (!inheritance) return undefined;
    
    const text = inheritance.toLowerCase();
    
    if (text.includes('autosomal dominant')) {
      return 'Autossómica dominante';
    } else if (text.includes('autosomal recessive')) {
      return 'Autossómica recessiva';
    } else if (text.includes('x-linked') || text.includes('x linked')) {
      return 'Ligada ao X';
    } else if (text.includes('mitochondrial')) {
      return 'Mitocondrial';
    } else if (text.includes('sporadic')) {
      return 'Esporádica';
    }
    
    return inheritance;
  }

  async transformAll(inputDir: string, outputDir: string): Promise<void> {
    console.log('🔄 Iniciando transformação de dados...');
    
    // Carregar dados brutos
    const rawData = await this.loadRawData(inputDir);
    this.transformationStats.totalProcessed = rawData.length;

    // Criar diretório de saída
    await fs.mkdir(outputDir, { recursive: true });

    // Transformar dados
    const transformedData: TransformedDisease[] = [];
    const batchSize = 500;
    const batches = _.chunk(rawData, batchSize);

    console.log(`🔄 Transformando ${rawData.length} registros em ${batches.length} lotes...`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults: TransformedDisease[] = [];

      console.log(`📦 Processando lote ${i + 1}/${batches.length}...`);

      batch.forEach((raw, index) => {
        const globalIndex = i * batchSize + index;
        const transformed = this.transformDisease(raw, globalIndex);
        
        if (transformed) {
          batchResults.push(transformed);
          transformedData.push(transformed);
          this.transformationStats.totalTransformed++;
        }
      });

      // Salvar lote transformado
      const batchFileName = `transformed-batch-${String(i + 1).padStart(3, '0')}.json`;
      const batchPath = path.join(outputDir, batchFileName);
      
      await fs.writeFile(
        batchPath,
        JSON.stringify(batchResults, null, 2),
        'utf8'
      );

      console.log(`   ✅ Lote ${i + 1}: ${batchResults.length}/${batch.length} transformados`);
    }

    // Salvar dados completos
    const completePath = path.join(outputDir, 'all-transformed-diseases.json');
    await fs.writeFile(
      completePath,
      JSON.stringify(transformedData, null, 2),
      'utf8'
    );

    // Gerar relatório de transformação
    await this.generateTransformationReport(transformedData, outputDir);

    console.log('✅ Transformação concluída!');
  }

  private async generateTransformationReport(data: TransformedDisease[], outputDir: string) {
    // Analisar completude dos campos
    const fieldStats: Record<string, number> = {};
    const fields = Object.keys(TransformedDiseaseSchema.shape);

    fields.forEach(field => {
      const completedCount = data.filter(item => {
        const value = (item as any)[field];
        return value !== undefined && value !== null && value !== '' &&
               (Array.isArray(value) ? value.length > 0 : true);
      }).length;
      
      fieldStats[field] = Math.round((completedCount / data.length) * 100);
    });

    // Analisar distribuição de categorias
    const categoryStats = _.countBy(data, 'category');
    const sortedCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    const report = {
      summary: {
        totalProcessed: this.transformationStats.totalProcessed,
        totalTransformed: this.transformationStats.totalTransformed,
        totalFailed: this.transformationStats.totalFailed,
        successRate: `${((this.transformationStats.totalTransformed / this.transformationStats.totalProcessed) * 100).toFixed(2)}%`,
        transformedAt: new Date().toISOString()
      },
      fieldCompleteness: fieldStats,
      topCategories: Object.fromEntries(sortedCategories),
      statistics: {
        avgSynonyms: _.meanBy(data, d => d.synonyms.length).toFixed(1),
        avgSymptoms: _.meanBy(data, d => d.symptoms.length).toFixed(1),
        withOrphaCode: data.filter(d => d.orpha_code).length,
        withIcd10Code: data.filter(d => d.icd10_code).length,
        withInheritancePattern: data.filter(d => d.inheritance_pattern).length
      }
    };

    const reportPath = path.join(outputDir, 'transformation-report.json');
    await fs.writeFile(
      reportPath,
      JSON.stringify(report, null, 2),
      'utf8'
    );

    console.log('\n📊 RELATÓRIO DE TRANSFORMAÇÃO');
    console.log('==============================');
    console.log(`Registros Processados: ${report.summary.totalProcessed}`);
    console.log(`Transformações Bem-sucedidas: ${report.summary.totalTransformed}`);
    console.log(`Falhas: ${report.summary.totalFailed}`);
    console.log(`Taxa de Sucesso: ${report.summary.successRate}`);
    console.log(`\nTop 5 Categorias:`);
    sortedCategories.slice(0, 5).forEach(([category, count]) => {
      console.log(`  - ${category}: ${count}`);
    });
    console.log(`\n📋 Relatório completo salvo em: ${reportPath}`);
  }
}

// Executar transformação se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const inputDir = path.join(process.cwd(), 'data', 'scraped');
  const outputDir = path.join(process.cwd(), 'data', 'transformed');

  const transformer = new GARDDataTransformer();
  
  transformer.transformAll(inputDir, outputDir)
    .then(() => {
      console.log('🎉 Transformação de dados concluída com sucesso!');
    })
    .catch(error => {
      console.error('❌ Erro durante a transformação:', error);
    });
}

export default GARDDataTransformer;
