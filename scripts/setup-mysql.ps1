#!/usr/bin/env powershell
# =====================================================================================
# SETUP MYSQL LOCAL - CPLP-RARAS
# =====================================================================================
# Script para configurar MySQL local como espelho do servidor
# =====================================================================================

Write-Host "🚀 CONFIGURANDO MYSQL LOCAL PARA CPLP-RARAS" -ForegroundColor Green
Write-Host "=" * 60

# 1. Verificar se MySQL está instalado
Write-Host "🔍 Verificando MySQL..." -ForegroundColor Yellow

try {
    $mysqlVersion = mysql --version 2>$null
    if ($mysqlVersion) {
        Write-Host "✅ MySQL encontrado: $mysqlVersion" -ForegroundColor Green
    } else {
        throw "MySQL não encontrado"
    }
} catch {
    Write-Host "❌ MySQL não está instalado!" -ForegroundColor Red
    Write-Host "📥 Baixe e instale MySQL em: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Yellow
    Write-Host "⚙️ Configure com usuário 'root' e senha 'password'" -ForegroundColor Yellow
    exit 1
}

# 2. Testar conexão MySQL
Write-Host "🔌 Testando conexão MySQL..." -ForegroundColor Yellow

try {
    $testConnection = mysql -u root -ppassword -e "SELECT 1;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexão MySQL estabelecida" -ForegroundColor Green
    } else {
        throw "Falha na conexão"
    }
} catch {
    Write-Host "❌ Erro na conexão MySQL!" -ForegroundColor Red
    Write-Host "⚙️ Verifique se o MySQL está rodando e as credenciais estão corretas" -ForegroundColor Yellow
    Write-Host "🔧 Usuário esperado: root" -ForegroundColor Yellow
    Write-Host "🔑 Senha esperada: password" -ForegroundColor Yellow
    exit 1
}

# 3. Criar database
Write-Host "🗄️ Criando database cplp_raras..." -ForegroundColor Yellow

try {
    mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    Write-Host "✅ Database criado/verificado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar database!" -ForegroundColor Red
    exit 1
}

# 4. Instalar dependências Node.js
Write-Host "📦 Instalando dependências Node.js..." -ForegroundColor Yellow

try {
    npm install mysql2 --save
    Write-Host "✅ mysql2 instalado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# 5. Gerar client Prisma
Write-Host "🔧 Gerando Prisma client..." -ForegroundColor Yellow

try {
    npx prisma generate
    Write-Host "✅ Prisma client gerado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao gerar Prisma client!" -ForegroundColor Red
    exit 1
}

# 6. Executar migração Prisma
Write-Host "📋 Criando tabelas via Prisma..." -ForegroundColor Yellow

try {
    npx prisma db push
    Write-Host "✅ Tabelas criadas" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Aviso: Algumas tabelas podem já existir" -ForegroundColor Yellow
}

# 7. Executar sincronização dos dumps
Write-Host "🔄 Sincronizando dados dos dumps..." -ForegroundColor Yellow

if (Test-Path "scripts/sync-mysql-dumps.js") {
    try {
        node scripts/sync-mysql-dumps.js
        Write-Host "✅ Dados sincronizados" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro na sincronização dos dados!" -ForegroundColor Red
        Write-Host "🔧 Execute manualmente: node scripts/sync-mysql-dumps.js" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Script de sincronização não encontrado" -ForegroundColor Yellow
}

# 8. Verificar instalação
Write-Host "🔍 Verificando instalação..." -ForegroundColor Yellow

try {
    $countriesCount = mysql -u root -ppassword -D cplp_raras -e "SELECT COUNT(*) as count FROM cplp_countries;" --skip-column-names 2>$null
    $diseasesCount = mysql -u root -ppassword -D cplp_raras -e "SELECT COUNT(*) as count FROM orpha_diseases;" --skip-column-names 2>$null
    
    Write-Host "📊 Países CPLP: $countriesCount registros" -ForegroundColor Green
    Write-Host "📊 Doenças Orphanet: $diseasesCount registros" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Não foi possível verificar dados" -ForegroundColor Yellow
}

# 9. Testar API
Write-Host "🧪 Testando configuração da API..." -ForegroundColor Yellow

try {
    $env:DATABASE_URL = "mysql://root:password@localhost:3306/cplp_raras"
    npx prisma db seed 2>$null
    Write-Host "✅ Configuração da API OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Aviso: Verificar configuração da API" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 CONFIGURAÇÃO MYSQL CONCLUÍDA!" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "🗄️ Database: cplp_raras" -ForegroundColor Cyan
Write-Host "🔗 URL: mysql://root:password@localhost:3306/cplp_raras" -ForegroundColor Cyan
Write-Host "🚀 Para iniciar a API: npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. Verifique se os dados foram importados corretamente" -ForegroundColor White
Write-Host "   2. Inicie a API com: npm run dev" -ForegroundColor White
Write-Host "   3. Teste os endpoints da API" -ForegroundColor White
Write-Host "   4. Configure o frontend para consumir a API local" -ForegroundColor White
Write-Host ""
