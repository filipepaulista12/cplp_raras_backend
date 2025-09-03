# 🚀 GUIA COMPLETO: MIGRAÇÃO PARA SERVIDOR

## 🎯 SITUAÇÃO ATUAL:
- ❌ SQLite local com problemas após reorganização
- ✅ Dados preservados no backup (105.835+ registros)
- 🎯 **OBJETIVO**: Migrar para MySQL/PostgreSQL no servidor

## 🔧 ARQUIVOS PREPARADOS:

### 1️⃣ `SCHEMA_SERVIDOR_MYSQL.sql`
- Schema completo para MySQL/PostgreSQL
- Otimizado para servidor de produção
- Índices de performance incluídos
- Views úteis para consultas
- Sistema CPLP completo

### 2️⃣ `export-to-server.js`  
- Exporta dados do SQLite para SQL padrão
- Gera arquivo INSERT para importação
- Preserva todos os dados HPO/Orphanet/DrugBank

## 🚀 PASSOS PARA MIGRAÇÃO:

### PASSO 1: Exportar Dados
```bash
# No seu computador local
cd "C:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras"
node scripts/06-maintenance/export-to-server.js
```

### PASSO 2: No MySQL Workbench do Servidor

1. **Criar Database:**
```sql
CREATE DATABASE cplp_raras 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE cplp_raras;
```

2. **Executar Schema:**
```sql
-- Copie e execute: database/SCHEMA_SERVIDOR_MYSQL.sql
```

3. **Importar Dados:**
```sql  
-- Copie e execute: database/EXPORT_SERVIDOR_CPLP_RARAS.sql
```

### PASSO 3: Configurar Aplicação

Criar arquivo `.env.production`:
```env
# SERVIDOR DE PRODUÇÃO
DATABASE_URL="mysql://usuario:senha@seu-servidor.com:3306/cplp_raras"

# OU PostgreSQL
DATABASE_URL="postgresql://usuario:senha@seu-servidor.com:5432/cplp_raras"

# Configurações de produção
NODE_ENV=production
IMPORT_BATCH_SIZE=5000
```

### PASSO 4: Schema Prisma para Servidor

Usar: `prisma/03-database-variants/schema.mysql.prisma` (será criado)

## 🎯 VANTAGENS DO SERVIDOR:

- ✅ **Performance**: MySQL/PostgreSQL muito mais rápido
- ✅ **Estabilidade**: Sem problemas de arquivo corrompido
- ✅ **Backup Automático**: Sistema do servidor
- ✅ **Concurrent Access**: Múltiplos usuários simultâneos
- ✅ **Escalabilidade**: Suporta milhões de registros
- ✅ **Workbench**: Interface visual para consultas

## 🔧 COMANDOS ÚTEIS NO SERVIDOR:

```sql
-- Verificar dados importados
SELECT * FROM v_cplp_statistics;

-- HPO Terms
SELECT COUNT(*) as hpo_terms FROM HPOTerm;

-- Orphanet Diseases  
SELECT COUNT(*) as orphanet_diseases FROM OrphanetDisorder;

-- DrugBank Drugs
SELECT COUNT(*) as drugs FROM DrugBankDrug;

-- Total geral
SELECT 
  (SELECT COUNT(*) FROM HPOTerm) +
  (SELECT COUNT(*) FROM OrphanetDisorder) + 
  (SELECT COUNT(*) FROM DrugBankDrug) as total_records;
```

## 🚨 TROUBLESHOOTING:

### Se der erro de charset:
```sql
ALTER DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Se der erro de tamanho:
```sql
SET global max_allowed_packet=1073741824;
```

### Se der timeout:
```sql
SET global wait_timeout=600;
SET global interactive_timeout=600;
```

## 🎉 RESULTADO ESPERADO:

- ✅ **105.835+ registros** no servidor
- ✅ **HPO**: 19.662 termos + 74.525 associações
- ✅ **Orphanet**: 11.000+ doenças raras
- ✅ **DrugBank**: 400+ medicamentos
- ✅ **Sistema multilíngue** PT/EN funcionando
- ✅ **Performance excelente** para consultas
- ✅ **Backup automático** do servidor

---
**🚀 DEPOIS DISSO, VOCÊ TERÁ UM SISTEMA PROFISSIONAL DE CLASSE MUNDIAL! 🌟**
