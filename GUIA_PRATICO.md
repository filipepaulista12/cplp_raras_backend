# 📋 GUIA PRÁTICO - CPLP-RARAS BACKEND

## 🚀 COMO USAR O SISTEMA (AGORA)

### 1. Iniciar o Servidor
```bash
npm run build
npm start
```
**Servidor roda em:** `http://localhost:3001`

### 2. Visualizar Dados do Banco
```bash
node scripts/analise-banco.js
```
**Resultado:** Mostra todas as tabelas e dados no banco SQLite (40MB com +19k termos HPO, +11k doenças Orphanet)

### 3. Testar APIs
- **Status:** `GET http://localhost:3001/api/status`
- **Orphanet:** `GET http://localhost:3001/api/orphanet/stats` 
- **HPO:** `GET http://localhost:3001/api/hpo/stats`
- **Open Data:** `GET http://localhost:3001/opendata`
- **Documentação:** `GET http://localhost:3001/api`

### 4. Autenticação
```bash
# Login demo:
POST http://localhost:3001/api/auth/login
{
  "email": "admin@cplp-raras.org",
  "password": "admin2025"
}
```

### 5. Verificar Qualidade
```bash
npm run ci:full
```

## ✅ O QUE ESTÁ FUNCIONANDO
- ✅ Banco SQLite com 40MB de dados reais
- ✅ 5 módulos API (Orphanet, HPO, DrugBank, CPLP, Diseases)
- ✅ Sistema 5-Star Open Data
- ✅ Segurança JWT + Rate Limiting
- ✅ Documentação Swagger automática
- ✅ GraphQL básico
- ✅ Sistema de logs

## ❌ PROBLEMAS IDENTIFICADOS
1. **Conexão Prisma** - Erro no caminho do banco
2. **1 endpoint falhando** - /api/db-test retorna erro 500

## 🔧 SOLUÇÃO RÁPIDA
O sistema funciona sem Prisma, usando queries SQL diretas via better-sqlite3.

**Status:** PRONTO PARA USO em desenvolvimento.
