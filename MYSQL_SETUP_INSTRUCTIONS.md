# 🚨 INSTRUÇÕES PARA CONFIGURAR MYSQL LOCAL - CPLP-RARAS

## 📋 PRÉ-REQUISITOS

Você precisa ter o MySQL instalado e rodando no seu sistema. Siga os passos abaixo:

### 1. INSTALAR MYSQL

**Windows:**
1. Baixe o MySQL Installer: https://dev.mysql.com/downloads/installer/
2. Execute o instalador e escolha "Developer Default"
3. Configure com:
   - **Usuário**: `root`
   - **Senha**: `password`
   - **Porta**: `3306`

**Verificar se está rodando:**
```bash
# Abrir serviços do Windows (services.msc)
# Procurar por "MySQL80" ou "MySQL"
# Garantir que está "Running"
```

### 2. TESTAR MYSQL

Abra um terminal e teste:
```bash
mysql -u root -ppassword
```

Se aparecer `mysql>` então está funcionando!

### 3. CRIAR DATABASE

No MySQL:
```sql
CREATE DATABASE cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4. CONFIGURAR PROJETO

No terminal do projeto:
```bash
# 1. Gerar Prisma client
npx prisma generate

# 2. Criar tabelas
npx prisma db push

# 3. Testar conexão
node scripts/test-mysql-connection.js

# 4. Popular dados
node scripts/sync-mysql-dumps.js

# 5. Verificar dados
npm run check
```

### 5. INICIAR API

```bash
npm run dev
```

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Erro "Can't reach database server"
- ✅ MySQL está rodando?
- ✅ Usuário e senha estão corretos?
- ✅ Porta 3306 está disponível?

### Erro "Access denied"
- ✅ Senha do root está correta?
- ✅ Usuário root existe?

### Erro "Database doesn't exist"
- ✅ Executou `CREATE DATABASE cplp_raras`?

## 📊 VERIFICAR SE FUNCIONOU

Após configurar tudo, você deve ver:
- ✅ MySQL conectado
- ✅ Prisma conectado  
- ✅ Países CPLP: 9 registros
- ✅ Doenças Orphanet: XXX registros
- ✅ Medicamentos: XXX registros

## 🚀 PRÓXIMOS PASSOS

1. **API Local funcionando**: http://localhost:3001
2. **GraphQL Playground**: http://localhost:3001/graphql
3. **Prisma Studio**: `npx prisma studio`

---

⚠️ **SE TUDO FALHAR**: Use SQLite temporariamente mudando o .env:
```env
DATABASE_URL="file:./database/cplp_raras_local.db"
```

E no schema.prisma:
```prisma
datasource db {
  provider = "sqlite"  
  url      = env("DATABASE_URL")
}
```
