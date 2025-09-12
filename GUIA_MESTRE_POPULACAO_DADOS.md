# 🚨 GUIA MESTRE - POPULAÇÃO DE DADOS CPLP-RARAS 🚨
**ARQUIVO DE ORIENTAÇÃO DEFINITIVO - LEIA ANTES DE FAZER QUALQUER MERDA**

---

## 📋 RESUMO EXECUTIVO

### BANCOS DE DADOS IDENTIFICADOS
1. **PostgreSQL (PRODUÇÃO)** - Frontend (cplp_raras/)
2. **SQLite (DESENVOLVIMENTO)** - Backend (cplp_raras_backend/)

### REGRA DE OURO
⚠️ **NUNCA USE `prisma:reset` EM PRODUÇÃO** ⚠️  
⚠️ **SEMPRE USE SCRIPTS ESPECÍFICOS POR TABELA** ⚠️  

---

## 🗄️ ESTRUTURA DE TABELAS E FONTES DE DADOS

### 1. **FRONTEND (PostgreSQL) - Schema Complexo**
**Localização**: `c:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras\prisma\schema.prisma`

#### TABELAS PRINCIPAIS:

##### 🏥 **Disease** (Tabela Central)
**Colunas esperadas**:
- `id`: UUID único
- `gardBrId`: ID único brasileiro (ex: GARD-BR-0001)
- `gardOriginalId`: ID do GARD original americano
- `namePt`: Nome em português
- `nameEn`: Nome em inglês
- `synonyms`: Array de sinônimos
- `orphaCode`: Código Orphanet (ex: ORPHA:558)
- `icd10Codes`: Códigos ICD-10
- `prevalenceValue`: Valor de prevalência
- `genesInvolved`: Genes envolvidos

**FONTE OFICIAL**: 
- **PRIMÁRIA**: Orphanet Database (https://www.orpha.net)
- **SECUNDÁRIA**: GARD Database (rarediseases.info.nih.gov)
- **COMPLEMENTAR**: Manual (pesquisadores CPLP)

**SCRIPT SEGURO**: 
```bash
# USAR APENAS ESTE COMANDO:
npm run seed:diseases-orphanet
```

##### 🌍 **CPLPCountry** (Países CPLP)
**Colunas esperadas**:
- `id`: Incremental
- `code`: Código país (BR, PT, AO, MZ, CV, GW, ST, TL, GQ)
- `name`: Nome do país
- `flagEmoji`: Emoji da bandeira
- `population`: População total
- `healthcareSystem`: Sistema de saúde
- `rareDiseasePolicy`: Política de doenças raras

**FONTE OFICIAL**: 
- **FIXA**: Lista oficial CPLP (9 países apenas)

**DADOS FIXOS**:
```
Brasil (BR), Portugal (PT), Angola (AO), 
Moçambique (MZ), Cabo Verde (CV), 
Guiné-Bissau (GW), São Tomé e Príncipe (ST), 
Timor-Leste (TL), Guiné Equatorial (GQ)
```

**SCRIPT SEGURO**: 
```bash
npm run seed:cplp-countries
```

##### 📚 **DiseasePublication** (Publicações)
**Colunas esperadas**:
- `pubmedId`: ID PubMed
- `doi`: DOI da publicação
- `title`: Título
- `authors`: Array de autores
- `journal`: Revista científica
- `publicationDate`: Data de publicação

**FONTE OFICIAL**: 
- **PRIMÁRIA**: PubMed API (https://pubmed.ncbi.nlm.nih.gov/)
- **TERMOS DE BUSCA**: "rare diseases" + país CPLP

**SCRIPT SEGURO**: 
```bash
npm run seed:publications-pubmed
```

##### 👨‍⚕️ **DiseaseSpecialist** (Especialistas)
**Colunas esperadas**:
- `name`: Nome completo
- `specialty`: Especialidade médica
- `contactInfo`: JSON com contatos
- `countryId`: Referência ao país CPLP
- `verificationStatus`: Status de verificação

**FONTE OFICIAL**: 
- **MANUAL**: Lista fornecida pela coordenação CPLP-Raras
- **COMPLEMENTAR**: ORCID API para validação

**SCRIPT SEGURO**: 
```bash
npm run seed:specialists-manual
```

---

### 2. **BACKEND (SQLite) - Schema Simplificado**
**Localização**: `c:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras_backend\prisma\schema.prisma`

#### TABELAS PRINCIPAIS:

##### 🌍 **CplpCountry** (Versão Simplificada)
**Colunas esperadas**:
- `code`: Código do país
- `name`: Nome em inglês
- `name_pt`: Nome em português
- `flag_emoji`: Emoji da bandeira
- `population`: População como string
- `health_system`: Sistema de saúde
- `rare_disease_policy`: Política de doenças raras

**FONTE OFICIAL**: Mesma do frontend
**SCRIPT SEGURO**: 
```bash
npm run populate:cplp-countries
```

##### 🦠 **OrphaDisease** (Doenças Orphanet)
**Colunas esperadas**:
- `orphacode`: Código Orphanet único
- `name`: Nome original (inglês)
- `name_pt`: Nome traduzido português
- `definition`: Definição original
- `definition_pt`: Definição traduzida
- `prevalence`: Dados de prevalência
- `inheritance`: Padrão de herança
- `icd10_codes`: Códigos ICD-10

**FONTE OFICIAL**: 
- **ÚNICA**: Orphanet XML API (https://www.orphanet.org/cgi-bin/ORPHAxml.php)

**SCRIPT SEGURO**: 
```bash
npm run populate:orphanet
```

##### 🧬 **OrphaGeneAssociation** (Associações Genéticas)
**Colunas esperadas**:
- `disease_id`: Referência à doença
- `gene_symbol`: Símbolo do gene (ex: CFTR)
- `gene_name`: Nome completo do gene
- `association_type`: Tipo de associação
- `hgnc_id`: ID HGNC do gene

**FONTE OFICIAL**: 
- **PRIMÁRIA**: Orphanet Gene Associations
- **COMPLEMENTAR**: HGNC Database

**SCRIPT SEGURO**: 
```bash
npm run populate:gene-associations
```

---

## 🔗 APIs IDENTIFICADAS E SUAS FONTES

### APIs BACKEND (NestJS)
**Localização**: `c:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras_backend\src\modules\`

#### Módulos Identificados:
- **`orphanet/`**: Consome Orphanet XML API
- **`hpo/`**: Consome Human Phenotype Ontology API
- **`drugbank/`**: Dados de medicamentos
- **`cplp/`**: Dados específicos dos países CPLP
- **`diseases/`**: Gestão de doenças raras

### APIs EXTERNAS CONSUMIDAS:
1. **Orphanet API**: `https://www.orphanet.org/cgi-bin/ORPHAxml.php`
2. **PubMed API**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`
3. **HPO API**: `https://hpo.jax.org/api/`
4. **HGNC API**: `https://rest.genenames.org/`

---

## 🚨 COMANDOS DE POPULAÇÃO SEGURA

### SCRIPTS SEGUROS (NÃO ZERAМ OUTRAS TABELAS):

#### Frontend (PostgreSQL):
```bash
# Países CPLP apenas
npm run seed:countries

# Doenças do Orphanet
npm run seed:diseases -- --source=orphanet

# Publicações do PubMed
npm run seed:publications -- --incremental

# Especialistas (manual)
npm run seed:specialists -- --verify
```

#### Backend (SQLite):
```bash
# Orphanet completo
npm run populate:orphanet

# HPO (fenótipos)
npm run populate:hpo

# Associações genéticas
npm run populate:gene-associations
```

### SCRIPTS PERIGOSOS (EVITAR):
```bash
# ❌ NUNCA USAR EM PRODUÇÃO
npm run prisma:reset

# ❌ ZERA TUDO
npx prisma db push --force-reset

# ❌ APAGA TODOS OS DADOS
DELETE FROM diseases;
```

---

## 📊 FONTE DE DADOS POR TABELA

| Tabela | Fonte Oficial | API/Método | Script Seguro | Frequência |
|--------|---------------|------------|---------------|------------|
| **CPLPCountry** | Lista CPLP fixa | Manual | `seed:countries` | Uma vez |
| **Disease** | Orphanet | XML API | `seed:diseases` | Mensal |
| **DiseasePublication** | PubMed | REST API | `seed:publications` | Semanal |
| **DiseaseSpecialist** | Manual CPLP | Cadastro | `seed:specialists` | Manual |
| **OrphaDisease** | Orphanet | XML API | `populate:orphanet` | Mensal |
| **OrphaGeneAssociation** | Orphanet+HGNC | REST API | `populate:genes` | Mensal |
| **OrphaPhenotype** | HPO | REST API | `populate:hpo` | Mensal |

---

## 🗂️ FONTES QUE PRECISAM SER FORNECIDAS

### 1. **Lista Oficial de Especialistas CPLP**
- Nome completo
- Especialidade médica
- Instituição
- País
- Email de contato
- ORCID (se disponível)

### 2. **Critérios de Seleção de Doenças**
- Quais doenças Orphanet incluir
- Critérios de prevalência
- Doenças específicas da região CPLP

### 3. **Lista de Instituições Participantes**
- Universidades
- Hospitais
- Centros de pesquisa
- Organizações de apoio

### 4. **Dados de Eventos Acadêmicos**
- Congressos de doenças raras
- Workshops CPLP
- Publicações da rede

---

## 🚫 FONTES A ELIMINAR (SE EXISTIREM)

- ❌ APIs genéricas de países (REST Countries)
- ❌ Dados demográficos externos desnecessários
- ❌ APIs de notícias ou mídia social
- ❌ Bancos de dados não acadêmicos
- ❌ Qualquer fonte que não seja específica do escopo CPLP-Raras
- ❌ APIs comerciais de medicamentos
- ❌ Dados de redes sociais ou marketing

---

## 🔧 COMANDOS DE DIAGNÓSTICO

### Verificar Estado das Tabelas:
```bash
# Backend
npm run check

# Frontend
npm run db:status
```

### Backup Antes de Mudanças:
```bash
# Backend
npm run backup

# Frontend  
npm run db:backup
```

### Testar Conexões:
```bash
npm run test:connection
```

---

## 📝 NOTAS IMPORTANTES

1. **SEMPRE fazer backup antes de qualquer alteração**
2. **NUNCA usar scripts que zerem múltiplas tabelas**
3. **Validar dados antes de importar**
4. **Usar apenas fontes oficiais e acadêmicas**
5. **Manter logs de todas as operações**
6. **Testar em ambiente de desenvolvimento primeiro**

---

## 🆘 EM CASO DE EMERGÊNCIA

### Se algo der errado:
1. **PARE** - não execute mais comandos
2. **Restore** do backup mais recente
3. **Verifique** os logs de erro
4. **Documente** o que aconteceu
5. **Use** apenas scripts específicos para corrigir

### Contatos de Emergência:
- **Coordenação CPLP-Raras**: [EMAIL_A_FORNECER]
- **Suporte Técnico**: [EMAIL_A_FORNECER]

---

**ÚLTIMA ATUALIZAÇÃO**: 2025-09-03  
**VERSÃO**: 1.0  
**RESPONSÁVEL**: Equipe CPLP-Raras  

⚠️ **ESTE DOCUMENTO É A FONTE DA VERDADE - SIGA SEMPRE** ⚠️
