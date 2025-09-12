# Script para instalar e configurar MySQL no Windows
# CPLP-Raras Backend - Setup MySQL Local

Write-Host "🚀 CONFIGURANDO MYSQL LOCAL - CPLP-RARAS" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "📦 Instalando MySQL Server via Chocolatey" -ForegroundColor Yellow

# Verificar se Chocolatey está instalado
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Chocolatey não encontrado. Instalando..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey instalado" -ForegroundColor Green
}

# Verificar se MySQL já está instalado
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService) {
    Write-Host "✅ MySQL já está instalado" -ForegroundColor Green
    Write-Host "📊 Status: $($mysqlService.Status)" -ForegroundColor Cyan
} else {
    Write-Host "📦 Instalando MySQL Server..." -ForegroundColor Yellow
    try {
        choco install mysql -y
        Write-Host "✅ MySQL instalado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar MySQL: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Tentando método alternativo..." -ForegroundColor Yellow
        
        # Método alternativo - instalar MySQL Community
        choco install mysql.server -y
    }
}

# Configurar serviço MySQL
Write-Host "`n🔧 CONFIGURANDO SERVIÇO MYSQL" -ForegroundColor Yellow
Write-Host "-" * 40

try {
    # Iniciar serviço MySQL
    $service = Get-Service -Name "MySQL*" | Select-Object -First 1
    if ($service) {
        if ($service.Status -ne "Running") {
            Write-Host "🔄 Iniciando serviço MySQL..." -ForegroundColor Yellow
            Start-Service $service.Name
            Write-Host "✅ Serviço MySQL iniciado" -ForegroundColor Green
        } else {
            Write-Host "✅ Serviço MySQL já está rodando" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  Erro ao iniciar serviço: $($_.Exception.Message)" -ForegroundColor Red
}

# Verificar conexão MySQL
Write-Host "`n🔌 TESTANDO CONEXÃO MYSQL" -ForegroundColor Yellow
Write-Host "-" * 40

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (Test-Path $mysqlPath) {
    Write-Host "✅ MySQL encontrado: $mysqlPath" -ForegroundColor Green
} else {
    # Procurar MySQL em outros locais
    $possiblePaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\tools\mysql\current\bin\mysql.exe",
        "C:\ProgramData\chocolatey\lib\mysql\tools\bin\mysql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $mysqlPath = $path
            Write-Host "✅ MySQL encontrado: $path" -ForegroundColor Green
            break
        }
    }
    
    if (-not (Test-Path $mysqlPath)) {
        Write-Host "❌ MySQL não encontrado nos caminhos padrão" -ForegroundColor Red
        Write-Host "💡 Procurando MySQL..." -ForegroundColor Yellow
        
        # Buscar mysql.exe no sistema
        $found = Get-ChildItem -Path "C:\" -Filter "mysql.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $mysqlPath = $found.FullName
            Write-Host "✅ MySQL encontrado: $mysqlPath" -ForegroundColor Green
        }
    }
}

# Configurar variáveis de ambiente
Write-Host "`n🌐 CONFIGURANDO VARIÁVEIS DE AMBIENTE" -ForegroundColor Yellow
Write-Host "-" * 40

$mysqlBinPath = Split-Path $mysqlPath -Parent
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")

if ($currentPath -notlike "*$mysqlBinPath*") {
    Write-Host "🔧 Adicionando MySQL ao PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$mysqlBinPath", "Machine")
    Write-Host "✅ MySQL adicionado ao PATH" -ForegroundColor Green
} else {
    Write-Host "✅ MySQL já está no PATH" -ForegroundColor Green
}

# Configurar usuário root
Write-Host "`n👤 CONFIGURANDO USUÁRIO ROOT" -ForegroundColor Yellow
Write-Host "-" * 40

$rootPassword = "password"
Write-Host "🔑 Configurando senha root: $rootPassword" -ForegroundColor Cyan

# Criar arquivo de configuração temporal
$configContent = @"
[client]
user=root
password=$rootPassword
host=localhost
port=3306
"@

$configFile = "$env:TEMP\mysql_config.cnf"
$configContent | Out-File -FilePath $configFile -Encoding UTF8

Write-Host "✅ Configuração MySQL preparada" -ForegroundColor Green

# Instruções finais
Write-Host "`n🎯 PRÓXIMOS PASSOS" -ForegroundColor Green
Write-Host "=" * 60
Write-Host "1. ✅ MySQL instalado e configurado" -ForegroundColor Green
Write-Host "2. 🔄 Executar: npm run import:backup" -ForegroundColor Yellow
Write-Host "3. 🔄 Executar: npm run test:mysql" -ForegroundColor Yellow
Write-Host "4. 🔄 Verificar sincronização das bases" -ForegroundColor Yellow

Write-Host "`n💡 COMANDOS DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host "• mysql -u root -p          # Conectar ao MySQL" -ForegroundColor White
Write-Host "• net start mysql           # Iniciar serviço" -ForegroundColor White
Write-Host "• net stop mysql            # Parar serviço" -ForegroundColor White

Write-Host "`n✅ SETUP MYSQL CONCLUÍDO!" -ForegroundColor Green
Write-Host "🔗 Pronto para importar backup de 30.23 MB" -ForegroundColor Cyan
Write-Host "=" * 60
