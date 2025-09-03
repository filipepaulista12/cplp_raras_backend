# Plano de População Completa do GARD-BR

## 🎯 Objetivo
Implementar todas as ~7.000 doenças raras do GARD original com estrutura bilíngue PT/EN para posterior tradução por IA.

## 📊 Status Atual
- ✅ Sistema GARD-BR funcional (Prompts 1-6)
- ✅ 20 doenças raras CPLP implementadas
- ✅ Estrutura bilíngue preparada
- ✅ Schema PostgreSQL completo

## 🚀 Estratégia de População

### Fase 1: Análise e Extração GARD Original
1. **Fonte de Dados**: NIH GARD Database (rarediseases.info.nih.gov)
2. **Método de Extração**: 
   - Web scraping automatizado
   - API calls se disponível
   - Processamento de dados estruturados

### Fase 2: Estruturação dos Dados
1. **Mapeamento de Campos**:
   ```
   GARD Original → GARD-BR
   - Disease Name → name_en
   - Synonyms → synonyms
   - GARD ID → gard_id_original
   - ORPHA Code → orpha_code
   - ICD-10 → icd10_code
   - Summary → summary (EN)
   - Symptoms → symptoms
   - Causes → causes
   - Treatment → treatment
   ```

2. **Campos Bilíngues**:
   - `name_pt`: Para preenchimento posterior por IA
   - `summary_pt`: Para tradução automática
   - `symptoms_pt`: Array traduzido
   - `causes_pt`: Texto traduzido
   - `treatment_pt`: Texto traduzido

### Fase 3: Scripts de Importação
1. **Script de Scraping**: `scripts/scrape-gard-data.ts`
2. **Script de Transformação**: `scripts/transform-gard-data.ts`
3. **Script de Importação DB**: `scripts/import-all-diseases.ts`
4. **Script de Validação**: `scripts/validate-import.ts`

### Fase 4: Processamento por Lotes
- **Lote 1**: 500 doenças mais comuns
- **Lote 2**: 1000 doenças genéticas
- **Lote 3**: 1000 doenças neurológicas
- **Lote 4**: 1000 doenças metabólicas
- **Lote 5**: Restantes (~3500)

### Fase 5: Tradução Automatizada
1. **IA para Tradução**:
   - OpenAI GPT-4 para termos médicos
   - Validation manual para termos críticos
   - Glossário médico PT-BR específico

2. **Campos Prioritários**:
   - Nome da doença (`name_pt`)
   - Resumo (`summary_pt`) 
   - Sintomas principais

## 🛠️ Ferramentas Necessárias

### Scraping e Extração
```typescript
// Puppeteer para scraping dinâmico
// Cheerio para parsing HTML
// Axios para requisições HTTP
// Rate limiting para evitar bloqueio
```

### Processamento de Dados
```typescript
// Zod para validação de schemas
// Lodash para manipulação de arrays
// Date-fns para formatação de datas
// CSV-parser para import/export
```

### Base de Dados
```sql
-- Tabela temporária para import
CREATE TABLE gard_import_staging (
  raw_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  errors TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_diseases_name_en ON diseases(name_en);
CREATE INDEX idx_diseases_category ON diseases(category);
CREATE INDEX idx_diseases_orpha ON diseases(orpha_code);
```

## 📋 Checklist de Implementação

### Preparação
- [ ] Análise detalhada do site GARD original
- [ ] Identificação de padrões de URL
- [ ] Mapeamento de estrutura de dados
- [ ] Setup de ferramentas de scraping

### Desenvolvimento
- [ ] Script de scraping automatizado
- [ ] Pipeline de transformação de dados
- [ ] Validação de integridade
- [ ] Sistema de retry para falhas

### Importação
- [ ] Import do primeiro lote (500 doenças)
- [ ] Validação e correções
- [ ] Import incremental dos lotes restantes
- [ ] Verificação de duplicatas

### Pós-Processamento
- [ ] Tradução automática dos campos PT
- [ ] Revisão manual de traduções críticas
- [ ] Indexação para busca
- [ ] Otimização de performance

## 🎯 Critérios de Sucesso
1. **Completude**: 95%+ das doenças GARD importadas
2. **Qualidade**: Dados estruturados e consistentes
3. **Bilíngue**: Nomes e resumos em PT disponíveis
4. **Performance**: Busca < 200ms para qualquer query
5. **Integridade**: Validação de todos os códigos ORPHA/ICD-10

## 🚧 Riscos e Mitigações
- **Rate Limiting**: Implementar delays e rotating proxies
- **Mudança de Estrutura**: Versionamento e fallbacks
- **Qualidade dos Dados**: Validação rigorosa e rollback
- **Performance**: Processamento em chunks menores

## 📅 Timeline Estimado
- **Semana 1**: Análise e setup de scraping
- **Semana 2**: Desenvolvimento dos scripts
- **Semana 3**: Import do primeiro lote e validação
- **Semana 4**: Import incremental dos demais lotes
- **Semana 5**: Tradução automática e refinamentos
- **Semana 6**: Otimização e deploy final

---
*Branch: feature/populate-all-gard-diseases*
*Data: 30 de Agosto de 2025*
