# Plataforma de Dados Raros — Guia de Desenvolvimento (Checklist Copilot)

Este documento descreve a arquitetura, requisitos e prompts detalhados para a criação de uma **plataforma 5-Stars Open Data** voltada a **doenças raras**, consolidando dados clínicos, genéticos, epidemiológicos, jornadas de pacientes, surveys e rede de profissionais/pesquisadores.  
O formato foi pensado como **checklist para Copilot**: cada seção contém tarefas e entregáveis que podem ser marcados à medida que forem concluídos.

---

## 🎯 Objetivo Geral
Construir uma plataforma **open-source, modular e escalável** que:
- Integre terminologias/ontologias biomédicas (MONDO, ORDO, HPO, HGNC, ClinVar, LOINC, ICD, etc.).
- Armazene informações de doenças (clínicas, genéticas, epidemiológicas).  
- Permita coleta/armazenamento de dados **agregados de pacientes** (jornadas, exames, tratamentos, demografia, PROs/PRMs).  
- Incorpore **surveys passadas**.  
- Mapeie e registre **profissionais/pesquisadores** (ORCID, ROR, afiliações).  
- Publique datasets com aderência **5-Stars Open Data** e princípios FAIR.  

---

## 🏗️ Arquitetura Recomendada

- **CKAN**: catálogo/portal de dados com extensões (`ckanext-dcat`, `ckanext-scheming`, `ckanext-spatial`), armazenamento em **MinIO**.
- **GraphDB/Fuseki**: triple store RDF + endpoint **SPARQL público**.
- **HAPI FHIR**: ingestão/consulta de dados clínicos.
- **OMOP CDM (OHDSI)** em **PostgreSQL** para análises.
- **Airflow**: pipelines ETL.
- **Great Expectations**: qualidade de dados.
- **Frictionless Data** / **CSV-W**: descrição de dados tabulares.
- **Postgres/PostGIS**: base relacional e geográfica.
- **Keycloak**: segurança/autenticação (SSO, OAuth2/OIDC).
- **Docker Compose** (dev) + **Helm/Kubernetes** (prod).

---

## 📚 Terminologias e Ontologias

- **Doenças**: MONDO, ORDO (quando permitido).
- **Fenótipos**: HPO.
- **Genética**: HGNC, Ensembl, ClinVar.
- **Exames**: LOINC, UCUM.
- **Procedimentos**: ICHI, SNOMED (se licenciado).
- **Classificações**: ICD-10/ICD-11.
- **Metadados**: DCAT/DCAT-AP, Dublin Core, schema.org/health-lifesci.

**Crosswalks obrigatórios**: MONDO↔ORDO, HPO↔ICD/SNOMED, ClinVar↔HGNC.

---

## 🗂️ Modelo de Domínio

- **Disease**: identificação, códigos, relações.
- **PhenotypeTerm**: termos HPO ligados a doenças.
- **Gene**: HGNC/Ensembl associados a doenças.
- **Variant**: ClinVar ↔ gene ↔ doença.
- **EpidemiologyRecord**: prevalência/incidência.
- **ClinicalGuideline/Pathway**: diretrizes clínicas.
- **Provider/Researcher**: perfis (ORCID, ROR).
- **PatientJourney** (dados anonimizados/agrupados): marcos diagnósticos, exames, tratamentos, tempos.
- **SurveyInstrument** e **SurveyResponse** (anonimizados).  
- **Resource/DataSet**: datasets CKAN com PID, licença, formatos (CSV/JSON/RDF).

---

## 🌐 5-Stars Open Data (Checklist)

- [ ] **1★**: publicar na web com licença aberta (CC BY/ODbL).  
- [ ] **2★**: dados estruturados (CSV/JSON/Parquet) + dicionário.  
- [ ] **3★**: formatos não proprietários + cabeçalhos HTTP corretos.  
- [ ] **4★**: URIs persistentes e estáveis (e.g. `/id/disease/ORPHA:123`).  
- [ ] **5★**: Linked Data (JSON-LD/RDF/SPARQL endpoint público).  

---

## 🔄 Ingestões Iniciais (Fontes Abertas)

- [ ] HPO (termos + annotations)  
- [ ] MONDO (doenças)  
- [ ] HGNC (genes)  
- [ ] ClinVar (variantes clínicas)  
- [ ] Ensembl (genômica)  
- [ ] Orphanet/ORDO (se licença permitir; caso contrário, apenas links/metadados)  
- [ ] Epidemiologia Orphanet + literatura aberta  
- [ ] MeSH / classificações médicas  

Cada pipeline deve registrar **proveniência (PROV-O)**, versão e hash.

---

## ✅ Critérios de Aceitação

- [ ] CKAN funcional com datasets iniciais e DCAT.  
- [ ] GraphDB/Fuseki carregado com MONDO, HPO, HGNC, ClinVar.  
- [ ] SPARQL endpoint público com consultas de exemplo.  
- [ ] JSON-LD para cada recurso resolvendo via content negotiation.  
- [ ] HAPI FHIR configurado com perfis raras + exemplos de Conditions/Observations.  
- [ ] ETL para OMOP validado em amostras sintéticas.  
- [ ] Airflow DAGs rodando (HPO, MONDO, HGNC, ClinVar).  
- [ ] Great Expectations relatórios de qualidade.  
- [ ] Keycloak com papéis (public, contributor, curator, clinician, admin).  
- [ ] Documentação MkDocs completa (instalação, exemplos, políticas).  
- [ ] CI/CD configurado (lint, build, testes, imagens).  

---

## 🔐 Segurança e Ética

- [ ] Segregação: dados identificáveis nunca em CKAN público.  
- [ ] Apenas dados anonimizados/agrupados são publicados.  
- [ ] Políticas de acesso documentadas.  
- [ ] Keycloak para autenticação/autorização.  
- [ ] Trilhas de auditoria e backups.  

---

## 📦 Estrutura Esperada do Repositório

```
repo/
 ├── infra/            # Docker/Helm/Terraform
 ├── services/
 │    ├── ckan/
 │    ├── graphdb/
 │    ├── fhir/
 │    └── omop/
 ├── etl/              # pipelines Airflow
 ├── dq/               # Great Expectations
 ├── schemas/          # FHIR profiles, OMOP mappings, JSON-Schema, SHACL
 ├── docs/             # MkDocs
 └── README.md
```

---

## 🚀 Prompts Resumidos para Copilot

**Prompt Principal:**  
> Crie uma plataforma open-source modular com CKAN, GraphDB, HAPI FHIR, OMOP CDM, Airflow e Keycloak. Configure ingestões iniciais (HPO, MONDO, HGNC, ClinVar), publicando dados em formatos CSV/JSON/RDF com URIs persistentes e Linked Data (JSON-LD/SPARQL). Garanta anonimização, versionamento, metadados DCAT/DCAT-AP e aderência total ao modelo 5-Stars Open Data.

**Prompt de Checkpoint (para cada etapa):**  
> Verifique se [módulo X] está configurado, testado e validado segundo critérios de aceitação. Marque como concluído no checklist.  

---

## 📌 Notas
- Sempre respeitar licenças (especialmente Orphanet/SNOMED/LOINC/ICD).  
- Dados sensíveis só em camadas restritas.  
- Documentação bilíngue PT-PT/PT-BR recomendada.  
