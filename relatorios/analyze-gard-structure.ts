/**
 * Script de Análise da Estrutura do GARD Original
 * Analisa o site rarediseases.info.nih.gov para mapear estrutura de dados
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

interface GARDAnalysis {
  totalDiseases: number;
  sampleUrls: string[];
  dataStructure: {
    commonFields: string[];
    variableFields: string[];
    dataTypes: Record<string, string>;
  };
  categories: string[];
  urlPatterns: string[];
}

class GARDAnalyzer {
  private browser: puppeteer.Browser | null = null;
  private analysis: GARDAnalysis = {
    totalDiseases: 0,
    sampleUrls: [],
    dataStructure: {
      commonFields: [],
      variableFields: [],
      dataTypes: {}
    },
    categories: [],
    urlPatterns: []
  };

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async analyzeBrowsePage() {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const page = await this.browser.newPage();
    
    try {
      console.log('🔍 Analisando página de browse...');
      await page.goto('https://rarediseases.info.nih.gov/diseases/browse', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Analisar estrutura da listagem
      const diseaseLinks = await page.$$eval('a[href*="/diseases/"]', links => 
        links.map(link => ({
          href: link.getAttribute('href'),
          text: link.textContent?.trim()
        })).filter(link => link.href && link.text)
      );

      this.analysis.sampleUrls = diseaseLinks
        .slice(0, 100)
        .map(link => `https://rarediseases.info.nih.gov${link.href}`);

      console.log(`📊 Encontrados ${diseaseLinks.length} links de doenças`);

      // Detectar padrões de URL
      const urlPatterns = new Set<string>();
      diseaseLinks.forEach(link => {
        const pattern = link.href?.replace(/\d+/g, '{id}');
        if (pattern) urlPatterns.add(pattern);
      });

      this.analysis.urlPatterns = Array.from(urlPatterns);

    } catch (error) {
      console.error('❌ Erro ao analisar página de browse:', error);
    } finally {
      await page.close();
    }
  }

  async analyzeDiseasePages() {
    if (!this.browser) throw new Error('Browser not initialized');
    
    console.log('🔍 Analisando páginas individuais de doenças...');
    
    const sampleSize = Math.min(10, this.analysis.sampleUrls.length);
    const fieldsFound = new Map<string, number>();
    const dataTypes = new Map<string, Set<string>>();

    for (let i = 0; i < sampleSize; i++) {
      const url = this.analysis.sampleUrls[i];
      const page = await this.browser.newPage();
      
      try {
        console.log(`📄 Analisando ${i + 1}/${sampleSize}: ${url}`);
        
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Extrair dados estruturados
        const pageData = await page.evaluate(() => {
          const data: Record<string, any> = {};

          // Extrair título
          const titleElement = document.querySelector('h1');
          if (titleElement) {
            data.title = titleElement.textContent?.trim();
          }

          // Extrair GARD ID
          const gardIdElement = document.querySelector('[data-field="gard-id"], .gard-id, #gard-id');
          if (gardIdElement) {
            data.gardId = gardIdElement.textContent?.trim();
          }

          // Extrair sinônimos
          const synonymsElement = document.querySelector('[data-field="synonyms"], .synonyms, #synonyms');
          if (synonymsElement) {
            data.synonyms = synonymsElement.textContent?.trim();
          }

          // Extrair resumo/definição
          const summaryElement = document.querySelector('[data-field="definition"], .definition, #definition, .summary');
          if (summaryElement) {
            data.summary = summaryElement.textContent?.trim();
          }

          // Extrair sintomas
          const symptomsElement = document.querySelector('[data-field="symptoms"], .symptoms, #symptoms');
          if (symptomsElement) {
            data.symptoms = symptomsElement.textContent?.trim();
          }

          // Extrair causas
          const causesElement = document.querySelector('[data-field="cause"], .cause, #cause, [data-field="causes"], .causes');
          if (causesElement) {
            data.causes = causesElement.textContent?.trim();
          }

          // Extrair tratamento
          const treatmentElement = document.querySelector('[data-field="treatment"], .treatment, #treatment');
          if (treatmentElement) {
            data.treatment = treatmentElement.textContent?.trim();
          }

          // Extrair códigos externos
          const orphaElement = document.querySelector('[data-field="orpha"], .orpha, #orpha');
          if (orphaElement) {
            data.orphaCode = orphaElement.textContent?.trim();
          }

          const icdElement = document.querySelector('[data-field="icd"], .icd, #icd');
          if (icdElement) {
            data.icdCode = icdElement.textContent?.trim();
          }

          // Extrair metadados
          const metaElements = document.querySelectorAll('meta[property], meta[name]');
          metaElements.forEach(meta => {
            const property = meta.getAttribute('property') || meta.getAttribute('name');
            const content = meta.getAttribute('content');
            if (property && content) {
              data[`meta_${property}`] = content;
            }
          });

          return data;
        });

        // Contar campos encontrados
        Object.keys(pageData).forEach(field => {
          const count = fieldsFound.get(field) || 0;
          fieldsFound.set(field, count + 1);

          // Analisar tipos de dados
          const value = pageData[field];
          const type = typeof value;
          if (!dataTypes.has(field)) {
            dataTypes.set(field, new Set());
          }
          dataTypes.get(field)?.add(type);
        });

        // Delay para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erro ao analisar ${url}:`, error);
      } finally {
        await page.close();
      }
    }

    // Processar resultados
    const totalSamples = sampleSize;
    this.analysis.dataStructure.commonFields = Array.from(fieldsFound.entries())
      .filter(([_, count]) => count >= totalSamples * 0.8) // Campos em 80%+ das páginas
      .map(([field, _]) => field);

    this.analysis.dataStructure.variableFields = Array.from(fieldsFound.entries())
      .filter(([_, count]) => count < totalSamples * 0.8)
      .map(([field, _]) => field);

    // Mapear tipos de dados
    dataTypes.forEach((types, field) => {
      this.analysis.dataStructure.dataTypes[field] = Array.from(types).join(' | ');
    });

    console.log(`✅ Análise completa: ${fieldsFound.size} campos únicos encontrados`);
  }

  async saveAnalysis() {
    const outputPath = path.join(process.cwd(), 'analysis', 'gard-structure-analysis.json');
    
    // Criar diretório se não existir
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    await fs.writeFile(
      outputPath,
      JSON.stringify(this.analysis, null, 2),
      'utf8'
    );

    console.log(`💾 Análise salva em: ${outputPath}`);
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'analysis', 'gard-analysis-report.md');
    
    const report = `# Relatório de Análise do GARD Original

## 📊 Resumo Executivo
- **URLs Analisadas**: ${this.analysis.sampleUrls.length}
- **Padrões de URL**: ${this.analysis.urlPatterns.length}
- **Campos Comuns**: ${this.analysis.dataStructure.commonFields.length}
- **Campos Variáveis**: ${this.analysis.dataStructure.variableFields.length}

## 🔗 Padrões de URL Identificados
${this.analysis.urlPatterns.map(pattern => `- \`${pattern}\``).join('\n')}

## 📋 Campos Comuns (80%+ das páginas)
${this.analysis.dataStructure.commonFields.map(field => 
  `- **${field}**: ${this.analysis.dataStructure.dataTypes[field] || 'string'}`
).join('\n')}

## 📝 Campos Variáveis (<80% das páginas)
${this.analysis.dataStructure.variableFields.map(field => 
  `- **${field}**: ${this.analysis.dataStructure.dataTypes[field] || 'string'}`
).join('\n')}

## 🎯 Mapeamento Recomendado GARD → GARD-BR

\`\`\`typescript
interface GARDMapping {
  // Campos obrigatórios
  title → name_en: string
  gardId → gard_id_original: string
  
  // Campos principais
  synonyms → synonyms: string[]
  summary → summary: string (EN)
  symptoms → symptoms: string[]
  causes → causes: string (EN)
  treatment → treatment: string (EN)
  
  // Códigos externos
  orphaCode → orpha_code: string
  icdCode → icd10_code: string
  
  // Campos bilíngues (para tradução)
  '' → name_pt: string (vazio inicialmente)
  '' → summary_pt: string (vazio inicialmente)
  '' → causes_pt: string (vazio inicialmente)
  '' → treatment_pt: string (vazio inicialmente)
}
\`\`\`

## ⚡ Próximos Passos
1. Implementar scraper baseado nos padrões identificados
2. Criar pipeline de transformação de dados
3. Desenvolver sistema de validação
4. Implementar importação em lotes

---
*Gerado em: ${new Date().toISOString()}*
`;

    await fs.writeFile(reportPath, report, 'utf8');
    console.log(`📋 Relatório salvo em: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Executar análise se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new GARDAnalyzer();
  
  analyzer.initialize()
    .then(() => analyzer.analyzeBrowsePage())
    .then(() => analyzer.analyzeDiseasePages())
    .then(() => analyzer.saveAnalysis())
    .then(() => analyzer.generateReport())
    .then(() => {
      console.log('✅ Análise do GARD concluída com sucesso!');
      return analyzer.cleanup();
    })
    .catch(error => {
      console.error('❌ Erro na análise:', error);
      return analyzer.cleanup();
    });
}

export default GARDAnalyzer;
