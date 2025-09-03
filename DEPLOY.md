# 🚀 Deploy CPLP-Raras Backend - Guia Rápido

## 📋 **Status do Sistema**
- ✅ Backend NestJS + TypeScript funcionando
- ✅ Base de dados SQLite (40MB) com dados reais
- ✅ 19.657 termos HPO + 11.340 doenças Orphanet
- ✅ APIs REST + GraphQL + Open Data (5-Star)
- ✅ 12/12 testes passando
- ✅ Pronto para deploy

## 🌐 **Opções de Deploy Online**

### 1. **Railway** (Recomendado - Gratuito)
```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
railway up
```

### 2. **Render** (Alternativa gratuita)
1. Conectar ao GitHub
2. Criar novo Web Service
3. Configurações:
   - Build: `npm run build`
   - Start: `npm run start:prod`
   - Port: 3001

### 3. **Heroku** (Clássico)
```bash
# 1. Instalar Heroku CLI
# 2. Login
heroku login

# 3. Criar app
heroku create cplp-raras-api

# 4. Deploy
git push heroku main
```

## ⚡ **Deploy Rápido - Railway**

1. **Acesse**: https://railway.app
2. **Login** com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Selecione** este repositório
5. **Deploy** automático!

## 🔧 **Configurações de Produção**

### Variáveis de Ambiente:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./database/gard_dev.db"
JWT_SECRET=cplp-raras-jwt-secret-key-production
CORS_ORIGIN=*
```

### Scripts Disponíveis:
- `npm run build` - Build de produção
- `npm run start:prod` - Inicia em produção
- `npm run test:e2e` - Testes completos

## 📊 **Endpoints da API**

### 🏠 **Base URLs (após deploy):**
- **Railway**: `https://cplp-raras-backend.railway.app`
- **Render**: `https://cplp-raras-api.onrender.com`
- **Heroku**: `https://cplp-raras-api.herokuapp.com`

### 🎯 **Endpoints Principais:**
- `/api` - Documentação Swagger completa
- `/api/orphanet/stats` - Estatísticas de doenças raras
- `/api/cplp/countries` - Países da CPLP
- `/api/hpo/stats` - Ontologia de fenótipos
- `/opendata` - Portal de dados abertos
- `/graphql` - Interface GraphQL

## 🎉 **Demonstração Rápida**

Após deploy, compartilhe estes links:

1. **📚 API Completa**: `{URL}/api`
2. **📊 Dados Reais**: `{URL}/api/orphanet/stats`
3. **🌍 Países CPLP**: `{URL}/api/cplp/countries`
4. **🌟 Open Data**: `{URL}/opendata`

---

**Pronto para produção!** 🚀
Base de dados real + APIs funcionais + Documentação completa
