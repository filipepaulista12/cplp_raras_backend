# 🗂️ Prisma Schemas Organizados - CPLP Raras

## 📁 Estrutura Lógica das Pastas

### ⚡ 01-active-schemas/
Schemas ativos e principais em uso:
- **schema.prisma**: Schema principal ativo do projeto
- **schema-complete-pt.prisma**: Schema completo com suporte português
- **schema-expanded.prisma**: Schema expandido com todas as funcionalidades

### 💾 02-backups/
Backups e versões anteriores preservadas:
- **schema-backup-before-pt.prisma**: Backup antes da implementação multilíngue
- **schema-backup.prisma**: Backup geral do schema
- **schema.postgresql.backup**: Backup específico do PostgreSQL

### 🔀 03-database-variants/
Variantes para diferentes sistemas de database:
- **schema.sqlite.prisma**: Versão adaptada para SQLite
- **schema.orphanet.prisma**: Schema específico para dados Orphanet

### 🛠️ 04-development-dbs/
Databases de desenvolvimento e teste:
- **gard_dev.db**: Database de desenvolvimento GARD (SQLite)

## 🎯 Schema Principal Atual:
```bash
# Schema ativo principal
prisma/01-active-schemas/schema.prisma

# Schema com português (nossa conquista multilíngue!)
prisma/01-active-schemas/schema-complete-pt.prisma
```

## 🏆 Funcionalidades Preservadas:
- ✅ **Sistema HPO**: 4 tabelas integradas
- ✅ **Multilíngue**: Suporte PT/EN completo
- ✅ **4 Databases**: GARD, Orphanet, DrugBank, HPO
- ✅ **Backups Seguros**: Versões anteriores preservadas
- ✅ **Variants**: Suporte SQLite e PostgreSQL

## 📋 Como Usar:
```bash
# Aplicar schema principal
npx prisma db push --schema=01-active-schemas/schema.prisma

# Gerar cliente Prisma
npx prisma generate --schema=01-active-schemas/schema.prisma

# Visualizar database
npx prisma studio --schema=01-active-schemas/schema.prisma

# Usar schema português (multilíngue)
npx prisma db push --schema=01-active-schemas/schema-complete-pt.prisma
```

## 🔧 Comandos Úteis:
```bash
# Ver diferenças entre schemas
diff 01-active-schemas/schema.prisma 02-backups/schema-backup.prisma

# Restaurar backup se necessário
cp 02-backups/schema-backup.prisma 01-active-schemas/schema.prisma

# Testar com SQLite
npx prisma db push --schema=03-database-variants/schema.sqlite.prisma
```

## 🎉 Conquistas do Sistema:
- **105.835+ registros** preservados
- **Schema multilíngue** funcionando
- **4 sistemas integrados** (GARD, Orphanet, DrugBank, HPO)
- **Backups seguros** mantidos
- **Organização profissional** implementada

---
*Organizado em 02/09/2025, 14:37:57 - Schemas Prisma Organizados! 🎯*
