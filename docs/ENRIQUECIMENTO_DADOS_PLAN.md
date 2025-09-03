# PLANO DE ENRIQUECIMENTO - SISTEMA CPLP DOENÇAS RARAS
## Fontes de Dados Complementares para Importação

### 🧬 DADOS GENÉTICOS E GENÔMICOS
1. **Human Phenotype Ontology (HPO)** 
   - Fenótipos detalhados para cada doença
   - Termos HPO completos com hierarquia
   - GitHub: https://github.com/obophenotype/human-phenotype-ontology

2. **Online Mendelian Inheritance in Man (OMIM)**
   - Dados de herança genética
   - Mutações e variantes
   - Correlações genótipo-fenótipo

3. **ClinVar**
   - Variantes genéticas clínicamente significativas
   - Classificações patogênicas
   - GitHub: https://github.com/ncbi/clinvar

### 🏥 DADOS CLÍNICOS E DIAGNÓSTICOS
4. **GARD (Genetic and Rare Diseases)**
   - Informações clínicas detalhadas
   - Sintomas e diagnóstico
   - GitHub: https://github.com/NCATSTranslator/GARD-rare-diseases

5. **ICD-10/ICD-11 Mappings**
   - Códigos de classificação internacional
   - Mapeamentos para sistemas de saúde
   - WHO Classifications

6. **SNOMED CT**
   - Terminologia clínica estruturada
   - Conceitos médicos padronizados

### 💊 DADOS FARMACOLÓGICOS
7. **DrugBank**
   - Medicamentos para doenças raras
   - Interações medicamentosas
   - GitHub: https://github.com/dhimmel/drugbank

8. **ChEMBL**
   - Atividade bioativa de compostos
   - Alvos terapêuticos
   - GitHub: https://github.com/chembl/chembl_webservices

### 🧪 DADOS DE LABORATÓRIO
9. **LOINC (Logical Observation Identifiers Names and Codes)**
   - Códigos de exames laboratoriais
   - Testes diagnósticos específicos

10. **Human Metabolome Database (HMDB)**
    - Biomarcadores metabólicos
    - Perfis bioquímicos

### 🌍 DADOS EPIDEMIOLÓGICOS CPLP
11. **Prevalência por País CPLP**
    - Dados demográficos específicos
    - Estatísticas regionais
    - Brasil, Portugal, Angola, etc.

12. **Registros Nacionais de Doenças Raras**
    - RaDiCo (Brasil)
    - FEDERG (Portugal)
    - Registros africanos CPLP

### 📚 DADOS BIBLIOGRÁFICOS
13. **PubMed/MEDLINE**
    - Artigos científicos por doença
    - Literatura médica atualizada
    - APIs disponíveis

14. **ClinicalTrials.gov**
    - Ensaios clínicos em andamento
    - Terapias experimentais
    - GitHub: https://github.com/ctti-clinicaltrials/aact

### 🔬 DADOS ÔMICOS
15. **Protein Data Bank (PDB)**
    - Estruturas proteicas relacionadas
    - Alvos terapêuticos 3D

16. **UniProt**
    - Sequências e funções proteicas
    - Anotações funcionais
    - GitHub: https://github.com/uniprot/uniprot-rest-api

### 🏢 DADOS ORGANIZACIONAIS
17. **Centros de Referência**
    - Hospitais especializados CPLP
    - Especialistas por doença
    - Contatos e localização

18. **Organizações de Pacientes**
    - Associações por doença
    - Grupos de apoio CPLP
    - Recursos para famílias

### 📊 DADOS ESTRUTURADOS EXISTENTES
19. **Wikidata**
    - Dados estruturados sobre doenças
    - Múltiplos idiomas
    - API SPARQL disponível

20. **DBpedia**
    - Informações enciclopédicas
    - Dados em português
    - Links relacionados

## 🎯 PRIORIDADES SUGERIDAS (Ordem de Implementação)

### FASE 1: DADOS CLÍNICOS ESSENCIAIS
- ✅ HPO (fenótipos detalhados)
- ✅ GARD (informações clínicas)
- ✅ ICD-10/11 mappings

### FASE 2: DADOS GENÉTICOS
- ✅ ClinVar (variantes)
- ✅ OMIM (herança genética)
- ✅ UniProt (proteínas)

### FASE 3: DADOS FARMACOLÓGICOS
- ✅ DrugBank (medicamentos)
- ✅ ChEMBL (compostos bioativos)

### FASE 4: DADOS CPLP ESPECÍFICOS
- ✅ Prevalência por país
- ✅ Centros de referência
- ✅ Registros nacionais

### FASE 5: DADOS BIBLIOGRÁFICOS
- ✅ PubMed (literatura)
- ✅ ClinicalTrials (ensaios)

## 🛠️ IMPLEMENTAÇÃO TÉCNICA
- Criar tabelas específicas para cada fonte
- APIs automáticas para atualização
- Sistema de versionamento de dados
- Cache inteligente para performance
- Interface web para visualização

## 📈 IMPACTO ESPERADO
- Sistema mais completo para diagnóstico
- Melhor suporte à pesquisa CPLP
- Base robusta para IA/ML
- Plataforma única para doenças raras
