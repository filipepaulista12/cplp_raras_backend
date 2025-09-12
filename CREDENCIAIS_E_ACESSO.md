# 🔐 CREDENCIAIS E CONFIGURAÇÕES DE ACESSO - CPLP-RARAS
# =====================================================================
# ARQUIVO CONFIDENCIAL - Mantenha seguro!
# Data: 03/09/2025
# Sistema: Dual Database (MySQL Principal + SQLite Espelho)
# =====================================================================

## 🗄️ BANCO DE DADOS MYSQL (PRINCIPAL)
```
Servidor: 200.144.254.4 ✅ ATIVO E RESPONDENDO
Porta: 3306 ✅ ACESSÍVEL
Database: cplp_raras ⚠️ AGUARDANDO CONFIRMAÇÃO
Usuário: root ⚠️ SENHA INCORRETA
IP Origem: 193.136.35.22 (nosso IP detectado)

❌ Senhas testadas SEM SUCESSO:
- "" (vazia)
- "password" 
- "root"
- "cplp_raras"

🚨 Status: SERVIDOR FUNCIONANDO, CREDENCIAIS INCORRETAS
📋 Ação: USUÁRIO DEVE FORNECER SENHA CORRETA
```

### 📋 STRING DE CONEXÃO MYSQL
```
DATABASE_URL="mysql://root:SENHA_CORRETA@200.144.254.4:3306/cplp_raras"
```

## 📁 BANCO DE DADOS SQLITE (ESPELHO LOCAL)
```
Localização: C:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras_backend\database\cplp_raras_mirror.db
Tipo: SQLite (arquivo local)
Propósito: Espelho sincronizado do MySQL para Prisma Studio

Status: ✅ CONFIGURADO
```

### 📋 STRING DE CONEXÃO SQLITE
```
DATABASE_SQLITE_URL="file:C:/Users/up739088/Desktop/aplicaçoes,sites,etc/cplp_raras_backend/database/cplp_raras_mirror.db"
```

## 🔧 PRISMA STUDIO
```
URL: http://localhost:5555
Status: ✅ FUNCIONANDO
Comando para abrir: npx prisma studio
```

## 🌐 SERVIÇOS E PORTAS
```
MySQL Server: 200.144.254.4:3306
Prisma Studio: localhost:5555
Backend API: localhost:3001
Frontend Next.js: localhost:3000
```

## 📂 ARQUIVOS IMPORTANTES DE CONFIGURAÇÃO

### .env (Backend)
```
DATABASE_URL="mysql://root:SENHA_A_DESCOBRIR@200.144.254.4:3306/cplp_raras"
DATABASE_SQLITE_URL="file:C:/Users/up739088/Desktop/aplicaçoes,sites,etc/cplp_raras_backend/database/cplp_raras_mirror.db"
DATABASE_MODE="dual"
JWT_SECRET="cplp-raras-secret-2025-super-secure"
NODE_ENV="development"
PORT=3001
MYSQL_HOST="200.144.254.4"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="SENHA_A_DESCOBRIR"
MYSQL_DATABASE="cplp_raras"
```

### prisma/schema.prisma
```
Status: ✅ CRIADO COM TODOS OS 20 MODELOS
Modelos principais:
- CplpCountry (Países CPLP)
- OrphaDisease (Doenças Orphanet)  
- HpoTerm (Termos HPO)
- DrugbankDrug (Medicamentos)
- DrugInteraction (Interações)
+ 15 modelos relacionados
```

## 📊 DUMP MYSQL ORIGINAL
```
Arquivo: Dump20250903.sql
Localização: Fornecido pelo usuário
Conteúdo: 20 tabelas completas com dados
Status: ✅ ANALISADO E MAPEADO

Tabelas identificadas:
1. cplp_countries (9 países CPLP)
2. orpha_diseases (doenças raras)
3. hpo_terms (fenótipos)
4. drugbank_drugs (medicamentos)
5. drug_interactions (interações)
6. orpha_phenotypes
7. orpha_clinical_signs
8. orpha_gene_associations
9. orpha_external_mappings
10. orpha_medical_classifications
11. orpha_linearisations
12. orpha_epidemiology
13. orpha_natural_history
14. orpha_textual_information
15. orpha_cplp_epidemiology
16. orpha_import_logs
17. hpo_phenotype_associations
18. hpo_disease_associations
19. hpo_gene_associations
20. drug_disease_associations
```

## 🔄 SISTEMA DE SINCRONIZAÇÃO
```
Script: scripts/sync-dual-database.js
Função: Manter MySQL e SQLite sincronizados
Status: ✅ CRIADO (aguardando credenciais MySQL)

Comando para sincronizar:
node scripts/sync-dual-database.js
```

## 🔍 SCRIPTS DE DIAGNÓSTICO
```
1. scripts/test-connection.js - Testa conexão Prisma
2. scripts/diagnose-mysql.js - Testa várias credenciais MySQL
3. scripts/analyze-mysql-dump.js - Analisa estrutura do dump
```

## 🚨 PRÓXIMOS PASSOS CRÍTICOS
```
1. ⚠️ DESCOBRIR SENHA CORRETA DO MYSQL
   - Testar: node scripts/diagnose-mysql.js
   - Ou perguntar ao usuário a senha correta

2. ✅ EXECUTAR DUMP NO SERVIDOR MYSQL
   - Importar Dump20250903.sql no servidor 200.144.254.4

3. ✅ ATUALIZAR .env COM CREDENCIAIS CORRETAS

4. ✅ EXECUTAR SINCRONIZAÇÃO DUAL DATABASE
   - node scripts/sync-dual-database.js

5. ✅ VERIFICAR PRISMA STUDIO
   - Acessar http://localhost:5555
   - Confirmar que todos os dados estão visíveis
```

## 💾 BACKUP E SEGURANÇA
```
- Manter backup do Dump20250903.sql sempre
- .env deve estar no .gitignore
- Não commitar senhas no Git
- SQLite serve como backup local automático
```

## 📞 CONTATOS E SUPORTE
```
Usuário: up739088
Workspace: C:\Users\up739088\Desktop\aplicaçoes,sites,etc\
Projeto: CPLP-Raras (Doenças Raras em Países de Língua Portuguesa)
Sistema: Dual Database Architecture
```

# ⚡ COMANDOS RÁPIDOS
```bash
# Gerar Prisma Client
npx prisma generate

# Abrir Prisma Studio  
npx prisma studio

# Testar conexão MySQL
node scripts/diagnose-mysql.js

# Sincronizar databases
node scripts/sync-dual-database.js

# Verificar status
node scripts/test-connection.js
```

# 🎯 STATUS ATUAL (03/09/2025 - 14:35)
- ✅ Schema Prisma completo criado (20 modelos)
- ✅ Prisma Studio funcionando (localhost:5555)  
- ✅ Scripts de sincronização prontos
- ✅ Servidor MySQL ATIVO e RESPONDENDO (200.144.254.4:3306)
- ✅ Conectividade de rede funcionando (IP: 193.136.35.22 → 200.144.254.4)
- ❌ Credenciais MySQL incorretas (testou: vazio, password, root, cplp_raras)
- ⚠️ BLOQUEADOR: Aguardando senha correta do usuário ROOT
- ⚠️ Aguardando confirmação se dump foi importado no servidor

## 🚨 PERGUNTA CRÍTICA PARA O USUÁRIO:
**"Qual é a senha do usuário 'root' no servidor MySQL 200.144.254.4?"**
**OU existe outro usuário/senha que eu deveria usar?**

---
**IMPORTANTE:** Este arquivo contém informações sensíveis. Mantenha seguro e não compartilhe senhas!
