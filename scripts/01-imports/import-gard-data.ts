#!/usr/bin/env node

/**
 * GARD DATA IMPORT SCRIPT
 * Script para importar dados completos do NIH GARD (rarediseases.info.nih.gov)
 * Inclui busca de dados, limpeza, estruturação e preparação para tradução
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';

// =====================================================================================
// CONFIGURAÇÃO E CONSTANTES
// =====================================================================================

const CONFIG = {
  // URLs base do GARD
  GARD_BASE_URL: 'https://rarediseases.info.nih.gov',
  GARD_API_URL: 'https://rarediseases.info.nih.gov/api',
  GARD_DISEASES_URL: 'https://rarediseases.info.nih.gov/diseases',
  
  // Diretórios de output
  DATA_DIR: path.join(process.cwd(), 'data', 'gard-import'),
  LOGS_DIR: path.join(process.cwd(), 'logs'),
  
  // Configurações de rate limiting
  REQUEST_DELAY: 1000, // 1 segundo entre requests
  BATCH_SIZE: 50,
  MAX_RETRIES: 3,
  
  // Configurações de tradução
  TRANSLATION_TARGET: 'pt-BR',
  AI_MODEL: 'gpt-4',
  
  // Arquivos de saída
  OUTPUT_FILES: {
    diseases: 'diseases_complete.json',
    categories: 'categories.json',
    synonyms: 'synonyms.json',
    medical_codes: 'medical_codes.json',
    import_log: 'import_log.json',
    sql_inserts: 'gard_import.sql',
    errors: 'import_errors.json'
  }
};

// Categorias conhecidas do GARD
const GARD_CATEGORIES = [
  'Birth defects',
  'Blood diseases',
  'Cancer', 
  'Endocrine diseases',
  'Gastrointestinal diseases',
  'Genetic diseases',
  'Infectious diseases',
  'Kidney diseases',
  'Liver diseases',
  'Lung diseases',
  'Neurological diseases',
  'Skin diseases',
  'Urogenital diseases'
];

// =====================================================================================
// TIPOS PARA IMPORTAÇÃO
// =====================================================================================

interface GARDDisease {
  gard_id: string;
  name: string;
  synonyms: string[];
  definition?: string;
  symptoms: string[];
  causes?: string;
  inheritance?: string;
  prevalence?: string;
  age_of_onset?: string;
  icd10_codes: string[];
  orpha_code?: string;
  omim_codes: string[];
  category: string;
  sources: string[];
  gard_url: string;
  last_updated?: string;
}

interface ImportStats {
  total_diseases: number;
  successful_imports: number;
  failed_imports: number;
  categories_found: Set<string>;
  inheritance_patterns: Set<string>;
  medical_codes: {
    icd10: Set<string>;
    orpha: Set<string>;
    omim: Set<string>;
  };
  start_time: Date;
  end_time?: Date;
  duration_minutes?: number;
}

interface ImportError {
  gard_id?: string;
  disease_name?: string;
  error_type: string;
  error_message: string;
  timestamp: Date;
  retry_count: number;
}

// =====================================================================================
// UTILITÁRIOS
// =====================================================================================

class ImportLogger {
  private logs: any[] = [];
  private errors: ImportError[] = [];
  
  log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    this.logs.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  }
  
  error(error: ImportError) {
    this.errors.push(error);
    this.log('error', `Import error: ${error.error_message}`, error);
  }
  
  async saveLogs() {
    await fs.mkdir(CONFIG.LOGS_DIR, { recursive: true });
    
    const logsFile = path.join(CONFIG.LOGS_DIR, `import_${Date.now()}.json`);
    await fs.writeFile(logsFile, JSON.stringify({
      logs: this.logs,
      errors: this.errors,
      summary: {
        total_logs: this.logs.length,
        total_errors: this.errors.length,
        error_types: [...new Set(this.errors.map(e => e.error_type))]
      }
    }, null, 2));
    
    this.log('info', `Logs saved to: ${logsFile}`);
  }
}

// Delay entre requests para evitar rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Limpeza de texto
const cleanText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Extração de códigos médicos
const extractMedicalCodes = (text: string) => {
  const codes = {
    icd10: [] as string[],
    orpha: [] as string[],
    omim: [] as string[]
  };
  
  // Padrões para diferentes códigos
  const patterns = {
    icd10: /ICD-?10[:\s]*([A-Z]\d{2}(?:\.\d{1,2})?)/gi,
    orpha: /ORPHA[:\s]*(\d+)/gi,
    omim: /OMIM[:\s]*([#*%^+]?\d{6})/gi
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      codes[type as keyof typeof codes].push(match[1]);
    }
  }
  
  return codes;
};

// =====================================================================================
// SCRAPING DO GARD
// =====================================================================================

class GARDScraper {
  private logger: ImportLogger;
  private stats: ImportStats;
  
  constructor(logger: ImportLogger) {
    this.logger = logger;
    this.stats = {
      total_diseases: 0,
      successful_imports: 0,
      failed_imports: 0,
      categories_found: new Set(),
      inheritance_patterns: new Set(),
      medical_codes: {
        icd10: new Set(),
        orpha: new Set(),
        omim: new Set()
      },
      start_time: new Date()
    };
  }
  
  async scrapeDiseasesIndex(): Promise<string[]> {
    this.logger.log('info', 'Iniciando busca do índice de doenças do GARD...');
    
    const diseaseUrls: string[] = [];
    
    try {
      // Tentar buscar através de diferentes métodos
      
      // Método 1: Scraping da página alfabética
      for (let letter = 'A'.charCodeAt(0); letter <= 'Z'.charCodeAt(0); letter++) {
        const char = String.fromCharCode(letter);
        await this.scrapeByLetter(char, diseaseUrls);
        await delay(CONFIG.REQUEST_DELAY);
      }
      
      // Método 2: Scraping por categoria
      for (const category of GARD_CATEGORIES) {
        await this.scrapeByCategory(category, diseaseUrls);
        await delay(CONFIG.REQUEST_DELAY);
      }
      
      // Remover duplicatas
      const uniqueUrls = [...new Set(diseaseUrls)];
      
      this.logger.log('info', `Encontradas ${uniqueUrls.length} doenças únicas`);
      return uniqueUrls;
      
    } catch (error: any) {
      this.logger.error({
        error_type: 'scraping_index',
        error_message: error?.message || String(error),
        timestamp: new Date(),
        retry_count: 0
      });
      throw error;
    }
  }
  
  private async scrapeByLetter(letter: string, urls: string[]) {
    this.logger.log('info', `Buscando doenças iniciadas com '${letter}'...`);
    
    try {
      const url = `${CONFIG.GARD_DISEASES_URL}?letter=${letter}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Usar regex para extrair links (sem dependência de JSDOM)
      const diseaseLinks = html.match(/href="[^"]*\/diseases\/\d+"/g) || [];
      
      for (const linkMatch of diseaseLinks) {
        const href = linkMatch.match(/href="([^"]*)"/)?.[1];
        if (href && href.includes('/diseases/') && href.match(/\d+$/)) {
          if (!href.startsWith('http')) {
            urls.push(`${CONFIG.GARD_BASE_URL}${href}`);
          } else {
            urls.push(href);
          }
        }
      }
      
    } catch (error: any) {
      this.logger.error({
        error_type: 'scraping_letter',
        error_message: `Erro buscando letra ${letter}: ${error?.message || String(error)}`,
        timestamp: new Date(),
        retry_count: 0
      });
    }
  }
  
  private async scrapeByCategory(category: string, urls: string[]) {
    this.logger.log('info', `Buscando doenças na categoria '${category}'...`);
    
    try {
      const encodedCategory = encodeURIComponent(category);
      const url = `${CONFIG.GARD_DISEASES_URL}?category=${encodedCategory}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Usar regex para extrair links (sem dependência de JSDOM)
      const diseaseLinks = html.match(/href="[^"]*\/diseases\/\d+"/g) || [];
      
      for (const linkMatch of diseaseLinks) {
        const href = linkMatch.match(/href="([^"]*)"/)?.[1];
        if (href && href.includes('/diseases/') && href.match(/\d+$/)) {
          if (!href.startsWith('http')) {
            urls.push(`${CONFIG.GARD_BASE_URL}${href}`);
          } else {
            urls.push(href);
          }
        }
      }
      
    } catch (error: any) {
      this.logger.error({
        error_type: 'scraping_category',
        error_message: `Erro buscando categoria ${category}: ${error?.message || String(error)}`,
        timestamp: new Date(),
        retry_count: 0
      });
    }
  }
  
  async scrapeDisease(url: string, retryCount = 0): Promise<GARDDisease | null> {
    try {
      await delay(CONFIG.REQUEST_DELAY);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extrair GARD ID da URL
      const gardIdMatch = url.match(/\/(\d+)$/);
      if (!gardIdMatch) {
        throw new Error('GARD ID não encontrado na URL');
      }
      
      const gard_id = gardIdMatch[1];
      
      // Extrair dados principais usando regex (sem JSDOM)
      const disease: GARDDisease = {
        gard_id,
        name: this.extractNameFromHTML(html),
        synonyms: this.extractSynonymsFromHTML(html),
        definition: this.extractDefinitionFromHTML(html),
        symptoms: this.extractSymptomsFromHTML(html),
        causes: this.extractCausesFromHTML(html),
        inheritance: this.extractInheritanceFromHTML(html),
        prevalence: this.extractPrevalenceFromHTML(html),
        age_of_onset: this.extractAgeOfOnsetFromHTML(html),
        icd10_codes: [],
        orpha_code: undefined,
        omim_codes: [],
        category: this.extractCategoryFromHTML(html),
        sources: this.extractSourcesFromHTML(html),
        gard_url: url,
        last_updated: new Date().toISOString()
      };
      
      // Extrair códigos médicos
      const medicalCodes = extractMedicalCodes(html);
      disease.icd10_codes = medicalCodes.icd10;
      disease.omim_codes = medicalCodes.omim;
      if (medicalCodes.orpha.length > 0) {
        disease.orpha_code = medicalCodes.orpha[0];
      }
      
      // Atualizar estatísticas
      this.updateStats(disease);
      
      this.logger.log('info', `✓ Importado: ${disease.name} (GARD:${gard_id})`);
      return disease;
      
    } catch (error: any) {
      if (retryCount < CONFIG.MAX_RETRIES) {
        this.logger.log('warn', `Tentativa ${retryCount + 1}/${CONFIG.MAX_RETRIES} falhou para ${url}, tentando novamente...`);
        await delay(CONFIG.REQUEST_DELAY * (retryCount + 1));
        return this.scrapeDisease(url, retryCount + 1);
      }
      
      this.logger.error({
        gard_id: url.match(/\/(\d+)$/)?.[1],
        error_type: 'scraping_disease',
        error_message: `Erro ao importar ${url}: ${error?.message || String(error)}`,
        timestamp: new Date(),
        retry_count: retryCount
      });
      
      this.stats.failed_imports++;
      return null;
    }
  }
  
  // Funções de extração usando regex (sem JSDOM)
  private extractNameFromHTML(html: string): string {
    const patterns = [
      /<h1[^>]*class="[^"]*disease[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<]+(?:Disease|Syndrome|Condition))/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim()) {
        return cleanText(match[1]);
      }
    }
    
    return 'Nome não encontrado';
  }
  
  private extractSynonymsFromHTML(html: string): string[] {
    const synonyms: string[] = [];
    
    const patterns = [
      /synonyms?[^<]*:?\s*([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /aliases?[^<]*:?\s*([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /alternative\s+names?[^<]*:?\s*([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const text = match[1].replace(/<[^>]*>/g, '');
        const parts = text.split(/[,;]/).map(s => s.trim()).filter(s => s && s.length > 2);
        synonyms.push(...parts);
      }
    }
    
    return [...new Set(synonyms)];
  }
  
  private extractDefinitionFromHTML(html: string): string | undefined {
    const patterns = [
      /definition[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /summary[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /<p[^>]*>([^<]{50,500})<\/p>/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim() && match[1].length > 50) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return undefined;
  }
  
  private extractSymptomsFromHTML(html: string): string[] {
    const symptoms: string[] = [];
    
    // Buscar seções de sintomas
    const symptomsMatch = html.match(/symptoms?[^<]*:?[^<]*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i);
    if (symptomsMatch) {
      const text = symptomsMatch[1].replace(/<[^>]*>/g, '');
      const parts = text.split(/[,;]/).map(s => s.trim()).filter(s => s && s.length > 3);
      symptoms.push(...parts);
    }
    
    return symptoms;
  }
  
  private extractCausesFromHTML(html: string): string | undefined {
    const patterns = [
      /causes?[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /etiology[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim() && match[1].length > 20) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return undefined;
  }
  
  private extractInheritanceFromHTML(html: string): string | undefined {
    const patterns = [
      /inheritance[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /pattern[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim()) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return undefined;
  }
  
  private extractPrevalenceFromHTML(html: string): string | undefined {
    const patterns = [
      /prevalence[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /frequency[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim()) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return undefined;
  }
  
  private extractAgeOfOnsetFromHTML(html: string): string | undefined {
    const patterns = [
      /age\s+of\s+onset[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /onset\s+age[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim()) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return undefined;
  }
  
  private extractCategoryFromHTML(html: string): string {
    const patterns = [
      /category[^<]*:?\s*<[^>]*>([^<]+(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/i,
      /breadcrumb[^>]*>([^<]*diseases?[^<]*)/i
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]?.trim()) {
        return cleanText(match[1].replace(/<[^>]*>/g, ''));
      }
    }
    
    return 'Não categorizada';
  }
  
  private extractSourcesFromHTML(html: string): string[] {
    const sources: string[] = [];
    
    // Buscar links para PubMed, DOI, etc.
    const linkPatterns = [
      /href="(https?:\/\/[^"]*pubmed[^"]*)">/g,
      /href="(https?:\/\/[^"]*doi\.org[^"]*)">/g,
      /href="(https?:\/\/[^"]*ncbi\.nlm[^"]*)">/g
    ];
    
    for (const pattern of linkPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          sources.push(match[1]);
        }
      }
    }
    
    return sources;
  }
  
  // Manter funções antigas para compatibilidade (não usadas mais)
  private extractName(document: Document): string {
    const selectors = [
      'h1.gard-disease-name',
      'h1',
      '.disease-title',
      '.page-title'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return cleanText(element.textContent);
      }
    }
    
    return 'Nome não encontrado';
  }
  
  private extractSynonyms(document: Document): string[] {
    const synonyms: string[] = [];
    
    // Buscar em diferentes locais possíveis
    const selectors = [
      '.synonyms',
      '.aliases',
      '.alternative-names',
      'section:contains("synonyms")',
      'section:contains("aliases")'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent) {
        const text = cleanText(element.textContent);
        const parts = text.split(/[,;]/).map(s => s.trim()).filter(s => s);
        synonyms.push(...parts);
      }
    }
    
    return [...new Set(synonyms)];
  }
  
  private extractDefinition(document: Document): string | undefined {
    const selectors = [
      '.disease-definition',
      '.summary',
      '.description',
      'section[contains-text="Definition"]',
      'p:first-of-type'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim() && element.textContent.length > 50) {
        return cleanText(element.textContent);
      }
    }
    
    return undefined;
  }
  
  private extractSymptoms(document: Document): string[] {
    const symptoms: string[] = [];
    
    // Buscar seções de sintomas
    const symptomsSection = document.querySelector('section:contains("Symptoms")') ||
                           document.querySelector('.symptoms') ||
                           document.querySelector('#symptoms');
    
    if (symptomsSection) {
      const listItems = symptomsSection.querySelectorAll('li, p');
      for (const item of listItems) {
        if (item.textContent?.trim()) {
          symptoms.push(cleanText(item.textContent));
        }
      }
    }
    
    return symptoms;
  }
  
  private extractCauses(document: Document): string | undefined {
    const selectors = [
      'section:contains("Cause")',
      '.causes',
      '#causes',
      'section:contains("Etiology")'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim() && element.textContent.length > 20) {
        return cleanText(element.textContent);
      }
    }
    
    return undefined;
  }
  
  private extractInheritance(document: Document): string | undefined {
    const selectors = [
      'section:contains("Inheritance")',
      '.inheritance',
      '#inheritance',
      'section:contains("Pattern")'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return cleanText(element.textContent);
      }
    }
    
    return undefined;
  }
  
  private extractPrevalence(document: Document): string | undefined {
    const selectors = [
      'section:contains("Prevalence")',
      '.prevalence',
      '#prevalence',
      'section:contains("Frequency")'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return cleanText(element.textContent);
      }
    }
    
    return undefined;
  }
  
  private extractAgeOfOnset(document: Document): string | undefined {
    const selectors = [
      'section:contains("Age of onset")',
      '.age-onset',
      '#age-onset'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return cleanText(element.textContent);
      }
    }
    
    return undefined;
  }
  
  private extractCategory(document: Document): string {
    // Tentar encontrar categoria na página
    const selectors = [
      '.breadcrumb a:last-child',
      '.category',
      '.disease-category',
      'nav a:contains("diseases")'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return cleanText(element.textContent);
      }
    }
    
    return 'Não categorizada';
  }
  
  private extractSources(document: Document): string[] {
    const sources: string[] = [];
    
    // Buscar referências e fontes
    const referenceLinks = document.querySelectorAll('a[href*="pubmed"], a[href*="doi.org"], a[href*="ncbi.nlm"]');
    
    for (const link of referenceLinks) {
      const href = link.getAttribute('href');
      if (href) {
        sources.push(href);
      }
    }
    
    return sources;
  }
  
  private updateStats(disease: GARDDisease) {
    this.stats.successful_imports++;
    this.stats.categories_found.add(disease.category);
    
    if (disease.inheritance) {
      this.stats.inheritance_patterns.add(disease.inheritance);
    }
    
    disease.icd10_codes.forEach(code => this.stats.medical_codes.icd10.add(code));
    disease.omim_codes.forEach(code => this.stats.medical_codes.omim.add(code));
    
    if (disease.orpha_code) {
      this.stats.medical_codes.orpha.add(disease.orpha_code);
    }
  }
  
  getStats(): ImportStats {
    return this.stats;
  }
}

// =====================================================================================
// GERADOR DE SQL
// =====================================================================================

class SQLGenerator {
  private logger: ImportLogger;
  
  constructor(logger: ImportLogger) {
    this.logger = logger;
  }
  
  async generateInserts(diseases: GARDDisease[]): Promise<string> {
    this.logger.log('info', `Gerando SQL para ${diseases.length} doenças...`);
    
    const sqlParts: string[] = [];
    
    // Header
    sqlParts.push(`-- GARD IMPORT SQL`);
    sqlParts.push(`-- Generated on: ${new Date().toISOString()}`);
    sqlParts.push(`-- Total diseases: ${diseases.length}`);
    sqlParts.push('');
    
    // Inserção das categorias
    const categories = [...new Set(diseases.map(d => d.category))];
    sqlParts.push('-- Insert categories');
    for (const category of categories) {
      sqlParts.push(`INSERT INTO disease_categories (id, name_en, name_pt, level, sort_order) VALUES `);
      sqlParts.push(`  (gen_random_uuid(), '${this.escapeSql(category)}', NULL, 1, 0) ON CONFLICT DO NOTHING;`);
    }
    sqlParts.push('');
    
    // Inserção das doenças
    sqlParts.push('-- Insert diseases');
    for (const disease of diseases) {
      const sql = this.generateDiseaseInsert(disease);
      sqlParts.push(sql);
    }
    
    return sqlParts.join('\n');
  }
  
  private generateDiseaseInsert(disease: GARDDisease): string {
    const values = {
      id: 'gen_random_uuid()',
      gard_br_id: `'gard-br-${disease.gard_id}'`,
      gard_original_id: `'${disease.gard_id}'`,
      name_en: `'${this.escapeSql(disease.name)}'`,
      name_pt: 'NULL',
      synonyms_en: `ARRAY[${disease.synonyms.map(s => `'${this.escapeSql(s)}'`).join(', ')}]`,
      synonyms_pt: 'ARRAY[]::text[]',
      category_en: `'${this.escapeSql(disease.category)}'`,
      category_pt: 'NULL',
      orpha_code: disease.orpha_code ? `'${disease.orpha_code}'` : 'NULL',
      icd10_code: disease.icd10_codes.length > 0 ? `'${disease.icd10_codes[0]}'` : 'NULL',
      omim_code: disease.omim_codes.length > 0 ? `'${disease.omim_codes[0]}'` : 'NULL',
      prevalence_en: disease.prevalence ? `'${this.escapeSql(disease.prevalence)}'` : 'NULL',
      prevalence_pt: 'NULL',
      inheritance_pattern_en: disease.inheritance ? `'${this.escapeSql(disease.inheritance)}'` : 'NULL',
      inheritance_pattern_pt: 'NULL',
      age_of_onset_en: disease.age_of_onset ? `'${this.escapeSql(disease.age_of_onset)}'` : 'NULL',
      age_of_onset_pt: 'NULL',
      translation_status: `'pending'`,
      is_active: 'true',
      created_at: 'NOW()',
      updated_at: 'NOW()'
    };
    
    return `INSERT INTO diseases (${Object.keys(values).join(', ')}) VALUES (${Object.values(values).join(', ')});`;
  }
  
  private escapeSql(text: string): string {
    return text.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }
}

// =====================================================================================
// FUNÇÃO PRINCIPAL
// =====================================================================================

async function main() {
  const logger = new ImportLogger();
  
  try {
    logger.log('info', 'Iniciando importação completa do GARD...');
    
    // Criar diretórios necessários
    await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
    await fs.mkdir(CONFIG.LOGS_DIR, { recursive: true });
    
    // Inicializar scraper
    const scraper = new GARDScraper(logger);
    
    // Buscar índice de doenças
    logger.log('info', 'Fase 1: Buscando índice de doenças...');
    const diseaseUrls = await scraper.scrapeDiseasesIndex();
    
    if (diseaseUrls.length === 0) {
      throw new Error('Nenhuma doença encontrada no índice');
    }
    
    // Scraping das doenças
    logger.log('info', `Fase 2: Importando ${diseaseUrls.length} doenças...`);
    const diseases: GARDDisease[] = [];
    
    for (let i = 0; i < diseaseUrls.length; i++) {
      const url = diseaseUrls[i];
      logger.log('info', `Progresso: ${i + 1}/${diseaseUrls.length} - ${url}`);
      
      const disease = await scraper.scrapeDisease(url);
      if (disease) {
        diseases.push(disease);
      }
      
      // Checkpoint a cada 100 doenças
      if ((i + 1) % 100 === 0) {
        logger.log('info', `Checkpoint: ${diseases.length} doenças importadas com sucesso`);
        await fs.writeFile(
          path.join(CONFIG.DATA_DIR, `checkpoint_${i + 1}.json`),
          JSON.stringify(diseases, null, 2)
        );
      }
    }
    
    // Salvar dados finais
    logger.log('info', 'Fase 3: Salvando dados importados...');
    
    const outputData = {
      metadata: {
        import_date: new Date().toISOString(),
        total_diseases: diseases.length,
        source: 'NIH GARD',
        importer_version: '1.0.0'
      },
      diseases: diseases
    };
    
    await fs.writeFile(
      path.join(CONFIG.DATA_DIR, CONFIG.OUTPUT_FILES.diseases),
      JSON.stringify(outputData, null, 2)
    );
    
    // Gerar SQL
    logger.log('info', 'Fase 4: Gerando SQL para importação...');
    const sqlGenerator = new SQLGenerator(logger);
    const sqlContent = await sqlGenerator.generateInserts(diseases);
    
    await fs.writeFile(
      path.join(CONFIG.DATA_DIR, CONFIG.OUTPUT_FILES.sql_inserts),
      sqlContent
    );
    
    // Estatísticas finais
    const stats = scraper.getStats();
    stats.end_time = new Date();
    stats.duration_minutes = (stats.end_time.getTime() - stats.start_time.getTime()) / 1000 / 60;
    
    const statsData = {
      ...stats,
      categories_found: [...stats.categories_found],
      inheritance_patterns: [...stats.inheritance_patterns],
      medical_codes: {
        icd10: [...stats.medical_codes.icd10],
        orpha: [...stats.medical_codes.orpha],
        omim: [...stats.medical_codes.omim]
      }
    };
    
    await fs.writeFile(
      path.join(CONFIG.DATA_DIR, 'import_statistics.json'),
      JSON.stringify(statsData, null, 2)
    );
    
    // Relatório final
    logger.log('info', '=== IMPORTAÇÃO CONCLUÍDA ===');
    logger.log('info', `Total de doenças: ${stats.total_diseases}`);
    logger.log('info', `Importações bem-sucedidas: ${stats.successful_imports}`);
    logger.log('info', `Importações falhas: ${stats.failed_imports}`);
    logger.log('info', `Duração: ${stats.duration_minutes?.toFixed(2)} minutos`);
    logger.log('info', `Categorias encontradas: ${stats.categories_found.size}`);
    logger.log('info', `Padrões de herança: ${stats.inheritance_patterns.size}`);
    logger.log('info', `Códigos ICD-10: ${stats.medical_codes.icd10.size}`);
    logger.log('info', `Códigos ORPHA: ${stats.medical_codes.orpha.size}`);
    logger.log('info', `Códigos OMIM: ${stats.medical_codes.omim.size}`);
    
    // Salvar logs
    await logger.saveLogs();
    
    logger.log('info', `Dados salvos em: ${CONFIG.DATA_DIR}`);
    logger.log('info', 'Próximo passo: executar o SQL gerado no banco de dados PostgreSQL');
    
  } catch (error: any) {
    logger.log('error', `Erro fatal na importação: ${error?.message || String(error)}`, error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as importGARD, GARDScraper, SQLGenerator };
