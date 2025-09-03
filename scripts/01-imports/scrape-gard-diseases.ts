/**
 * Script de Scraping Avançado do GARD
 * Extrai todas as doenças raras do site oficial do GARD
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import _ from 'lodash';

// Schema de validação para dados extraídos
const RawDiseaseSchema = z.object({
  gardId: z.string().optional(),
  title: z.string().min(1),
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
  url: z.string().url(),
  scrapedAt: z.string()
});

type RawDisease = z.infer<typeof RawDiseaseSchema>;

interface ScrapingConfig {
  maxConcurrent: number;
  delayBetweenRequests: number;
  retryAttempts: number;
  batchSize: number;
  outputDir: string;
}

class GARDScraper {
  private browser: puppeteer.Browser | null = null;
  private config: ScrapingConfig;
  private scrapedUrls = new Set<string>();
  private failedUrls: string[] = [];
  private statistics = {
    totalFound: 0,
    totalScraped: 0,
    totalFailed: 0,
    totalSkipped: 0,
    startTime: Date.now()
  };

  constructor(config: Partial<ScrapingConfig> = {}) {
    this.config = {
      maxConcurrent: 3,
      delayBetweenRequests: 2000,
      retryAttempts: 3,
      batchSize: 100,
      outputDir: path.join(process.cwd(), 'data', 'scraped'),
      ...config
    };
  }

  async initialize() {
    console.log('🚀 Inicializando GARD Scraper...');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    // Criar diretório de output
    await fs.mkdir(this.config.outputDir, { recursive: true });
    
    console.log('✅ Browser inicializado');
  }

  async discoverAllDiseaseUrls(): Promise<string[]> {
    if (!this.browser) throw new Error('Browser não inicializado');

    console.log('🔍 Descobrindo todas as URLs de doenças...');
    const page = await this.browser.newPage();
    
    try {
      const allUrls: string[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const browseUrl = `https://rarediseases.info.nih.gov/diseases/browse?page=${currentPage}`;
        console.log(`📄 Processando página ${currentPage}: ${browseUrl}`);

        await page.goto(browseUrl, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Extrair links desta página
        const pageUrls = await page.$$eval('a[href*="/diseases/"]', links => 
          links
            .map(link => link.getAttribute('href'))
            .filter(href => href && href.match(/\/diseases\/\d+/))
            .map(href => `https://rarediseases.info.nih.gov${href}`)
        );

        allUrls.push(...pageUrls);
        console.log(`   📊 Encontrados ${pageUrls.length} URLs nesta página`);

        // Verificar se há próxima página
        const nextPageExists = await page.$('.pagination .next:not(.disabled)') !== null;
        
        if (!nextPageExists || currentPage > 200) { // Limite de segurança
          hasNextPage = false;
        } else {
          currentPage++;
          await this.delay(this.config.delayBetweenRequests);
        }
      }

      // Remover duplicatas e URLs inválidas
      const uniqueUrls = [...new Set(allUrls)].filter(url => 
        url.match(/\/diseases\/\d+$/) // URLs válidas do formato /diseases/{id}
      );

      console.log(`✅ Descoberta concluída: ${uniqueUrls.length} URLs únicas encontradas`);
      this.statistics.totalFound = uniqueUrls.length;

      // Salvar lista de URLs
      await this.saveUrlList(uniqueUrls);

      return uniqueUrls;

    } catch (error) {
      console.error('❌ Erro ao descobrir URLs:', error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeDisease(url: string): Promise<RawDisease | null> {
    if (!this.browser) throw new Error('Browser não inicializado');

    const page = await this.browser.newPage();
    
    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Extrair dados da página
      const rawData = await page.evaluate((pageUrl) => {
        const data: Partial<RawDisease> = {
          url: pageUrl,
          scrapedAt: new Date().toISOString()
        };

        // Extrair título
        const titleEl = document.querySelector('h1, .page-title, .disease-title');
        if (titleEl) {
          data.title = titleEl.textContent?.trim() || '';
        }

        // Extrair GARD ID
        const gardIdMatch = pageUrl.match(/\/diseases\/(\d+)/);
        if (gardIdMatch) {
          data.gardId = `GARD:${gardIdMatch[1]}`;
        }

        // Extrair sinônimos
        const synonymsEl = document.querySelector('.synonyms, [data-field="synonyms"], .alias');
        if (synonymsEl) {
          const synonymsText = synonymsEl.textContent?.trim();
          if (synonymsText) {
            data.synonyms = synonymsText
              .split(/[,;]/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
        }

        // Extrair resumo/definição
        const summaryEl = document.querySelector('.definition, .summary, .description, [data-field="definition"]');
        if (summaryEl) {
          data.summary = summaryEl.textContent?.trim();
        }

        // Extrair sintomas
        const symptomsEl = document.querySelector('.symptoms, [data-field="symptoms"], .signs-symptoms');
        if (symptomsEl) {
          const symptomsText = symptomsEl.textContent?.trim();
          if (symptomsText) {
            data.symptoms = symptomsText
              .split(/[,;]/)
              .map(s => s.trim())
              .filter(s => s.length > 0);
          }
        }

        // Extrair causas
        const causesEl = document.querySelector('.cause, .causes, [data-field="cause"], .etiology');
        if (causesEl) {
          data.causes = causesEl.textContent?.trim();
        }

        // Extrair tratamento
        const treatmentEl = document.querySelector('.treatment, [data-field="treatment"], .management');
        if (treatmentEl) {
          data.treatment = treatmentEl.textContent?.trim();
        }

        // Extrair frequência
        const frequencyEl = document.querySelector('.frequency, [data-field="frequency"], .prevalence');
        if (frequencyEl) {
          data.frequency = frequencyEl.textContent?.trim();
        }

        // Extrair herança
        const inheritanceEl = document.querySelector('.inheritance, [data-field="inheritance"], .heredity');
        if (inheritanceEl) {
          data.inheritance = inheritanceEl.textContent?.trim();
        }

        // Extrair código ORPHA
        const orphaEl = document.querySelector('.orpha, [data-field="orpha"], [href*="orpha"]');
        if (orphaEl) {
          const orphaText = orphaEl.textContent?.trim();
          const orphaMatch = orphaText?.match(/ORPHA[:\s]*(\d+)/i);
          if (orphaMatch) {
            data.orphaCode = `ORPHA:${orphaMatch[1]}`;
          }
        }

        // Extrair código ICD
        const icdEl = document.querySelector('.icd, [data-field="icd"], [href*="icd"]');
        if (icdEl) {
          const icdText = icdEl.textContent?.trim();
          const icdMatch = icdText?.match(/([A-Z]\d{2}(?:\.\d{1,2})?)/);
          if (icdMatch) {
            data.icdCode = icdMatch[1];
          }
        }

        // Extrair fontes/referências
        const sourceEls = document.querySelectorAll('.source, .reference, [data-field="source"], a[href*="pubmed"]');
        if (sourceEls.length > 0) {
          data.sources = Array.from(sourceEls)
            .map(el => el.textContent?.trim() || '')
            .filter(text => text.length > 0);
        }

        return data;
      }, url);

      // Validar dados extraídos
      const validatedData = RawDiseaseSchema.parse({
        ...rawData,
        title: rawData.title || 'Título não encontrado'
      });

      console.log(`✅ Dados extraídos: ${validatedData.title}`);
      return validatedData;

    } catch (error) {
      console.error(`❌ Erro ao processar ${url}:`, error);
      return null;
    } finally {
      await page.close();
    }
  }

  async scrapeInBatches(urls: string[]): Promise<RawDisease[]> {
    const allResults: RawDisease[] = [];
    const batches = _.chunk(urls, this.config.batchSize);

    console.log(`🔄 Iniciando scraping em ${batches.length} lotes de ${this.config.batchSize} URLs`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processando lote ${i + 1}/${batches.length} (${batch.length} URLs)`);

      const batchPromises = batch.map(async (url, index) => {
        // Delay escalonado para evitar sobrecarga
        await this.delay(index * 500);
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
          try {
            const result = await this.scrapeDisease(url);
            if (result) {
              this.statistics.totalScraped++;
              return result;
            } else {
              this.statistics.totalFailed++;
              break;
            }
          } catch (error) {
            console.error(`❌ Tentativa ${attempt} falhou para ${url}:`, error);
            if (attempt === this.config.retryAttempts) {
              this.failedUrls.push(url);
              this.statistics.totalFailed++;
            } else {
              await this.delay(this.config.delayBetweenRequests * attempt);
            }
          }
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null) as RawDisease[];
      
      allResults.push(...validResults);

      // Salvar progresso a cada lote
      await this.saveBatchProgress(i + 1, validResults);
      
      console.log(`✅ Lote ${i + 1} concluído: ${validResults.length}/${batch.length} sucessos`);

      // Delay entre lotes
      if (i < batches.length - 1) {
        await this.delay(this.config.delayBetweenRequests * 2);
      }
    }

    return allResults;
  }

  private async saveBatchProgress(batchNumber: number, results: RawDisease[]) {
    const filename = `batch-${batchNumber.toString().padStart(3, '0')}.json`;
    const filepath = path.join(this.config.outputDir, filename);
    
    await fs.writeFile(
      filepath,
      JSON.stringify(results, null, 2),
      'utf8'
    );
  }

  private async saveUrlList(urls: string[]) {
    const filepath = path.join(this.config.outputDir, 'discovered-urls.json');
    await fs.writeFile(
      filepath,
      JSON.stringify({ urls, discoveredAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  }

  async generateFinalReport(results: RawDisease[]) {
    const endTime = Date.now();
    const duration = endTime - this.statistics.startTime;

    const report = {
      summary: {
        totalFound: this.statistics.totalFound,
        totalScraped: this.statistics.totalScraped,
        totalFailed: this.statistics.totalFailed,
        successRate: ((this.statistics.totalScraped / this.statistics.totalFound) * 100).toFixed(2),
        duration: `${Math.round(duration / 1000)}s`,
        avgTimePerDisease: `${Math.round(duration / this.statistics.totalScraped)}ms`
      },
      fieldStatistics: this.analyzeFieldCompleteness(results),
      failedUrls: this.failedUrls,
      sampleData: results.slice(0, 5) // Primeiras 5 para verificação
    };

    const reportPath = path.join(this.config.outputDir, 'scraping-report.json');
    await fs.writeFile(
      reportPath,
      JSON.stringify(report, null, 2),
      'utf8'
    );

    console.log('\n📊 RELATÓRIO FINAL DE SCRAPING');
    console.log('================================');
    console.log(`URLs Descobertas: ${report.summary.totalFound}`);
    console.log(`Sucessos: ${report.summary.totalScraped}`);
    console.log(`Falhas: ${report.summary.totalFailed}`);
    console.log(`Taxa de Sucesso: ${report.summary.successRate}%`);
    console.log(`Duração Total: ${report.summary.duration}`);
    console.log(`Tempo Médio/Doença: ${report.summary.avgTimePerDisease}`);
    console.log(`\n📋 Relatório salvo em: ${reportPath}`);
  }

  private analyzeFieldCompleteness(results: RawDisease[]) {
    const fields = ['title', 'gardId', 'synonyms', 'summary', 'symptoms', 'causes', 'treatment', 'frequency', 'inheritance', 'orphaCode', 'icdCode'];
    const stats: Record<string, number> = {};

    fields.forEach(field => {
      const count = results.filter(result => {
        const value = (result as any)[field];
        return value !== undefined && value !== null && value !== '' && 
               (Array.isArray(value) ? value.length > 0 : true);
      }).length;
      
      stats[field] = Math.round((count / results.length) * 100);
    });

    return stats;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Executar scraping se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new GARDScraper({
    maxConcurrent: 2,
    delayBetweenRequests: 3000, // 3 segundos entre requests
    batchSize: 50 // Lotes menores para melhor controle
  });

  scraper.initialize()
    .then(() => scraper.discoverAllDiseaseUrls())
    .then(urls => scraper.scrapeInBatches(urls))
    .then(results => scraper.generateFinalReport(results))
    .then(() => {
      console.log('\n🎉 Scraping concluído com sucesso!');
      return scraper.cleanup();
    })
    .catch(error => {
      console.error('\n❌ Erro durante o scraping:', error);
      return scraper.cleanup();
    });
}

export default GARDScraper;
