# Instalar MySQL no Windows
Write-Host "🛠️ INSTALANDO MYSQL LOCAL - CONFIGURAÇÃO RÁPIDA" -ForegroundColor Green
Write-Host "═" * 55 -ForegroundColor Yellow

# Verificar se já existe MySQL instalado
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (Test-Path $mysqlPath) {
    Write-Host "✅ MySQL já está instalado em: $mysqlPath" -ForegroundColor Green
    
    # Tentar iniciar serviço
    $services = Get-Service | Where-Object {$_.DisplayName -like "*MySQL*"}
    if ($services) {
        Write-Host "🔄 Serviços MySQL encontrados:" -ForegroundColor Yellow
        $services | ForEach-Object {
            Write-Host "   - $($_.Name): $($_.Status)" -ForegroundColor Cyan
            if ($_.Status -eq "Stopped") {
                Write-Host "🚀 Iniciando serviço $($_.Name)..." -ForegroundColor Yellow
                try {
                    Start-Service $_.Name
                    Write-Host "✅ Serviço $($_.Name) iniciado!" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Erro ao iniciar $($_.Name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }
        }
    }
} else {
    Write-Host "❌ MySQL não encontrado. Baixando instalador..." -ForegroundColor Red
    
    # Baixar MySQL Installer
    $installerUrl = "https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-community-8.0.39.0.msi"
    $installerPath = "$env:TEMP\mysql-installer.msi"
    
    Write-Host "⬇️ Baixando MySQL Installer..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ Download concluído!" -ForegroundColor Green
        
        Write-Host "🚀 Iniciando instalação..." -ForegroundColor Yellow
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet" -Wait
        
        Write-Host "✅ Instalação concluída!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro no download: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Solução alternativa: Use XAMPP ou instale manualmente" -ForegroundColor Yellow
    }
}

Write-Host "`n🔍 VERIFICANDO STATUS FINAL..." -ForegroundColor Green
Write-Host "─" * 35 -ForegroundColor Yellow

# Verificar serviços MySQL
$mysqlServices = Get-Service | Where-Object {$_.DisplayName -like "*MySQL*"}
if ($mysqlServices) {
    Write-Host "✅ Serviços MySQL encontrados:" -ForegroundColor Green
    $mysqlServices | ForEach-Object {
        $status = if ($_.Status -eq "Running") { "🟢" } else { "🔴" }
        Write-Host "   $status $($_.Name): $($_.Status)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Nenhum serviço MySQL encontrado" -ForegroundColor Red
}

# Verificar porta 3306
Write-Host "`n🔌 Verificando porta 3306..." -ForegroundColor Yellow
$port3306 = netstat -an | Select-String ":3306"
if ($port3306) {
    Write-Host "✅ Porta 3306 em uso (MySQL provavelmente rodando)" -ForegroundColor Green
    Write-Host "$port3306" -ForegroundColor Cyan
} else {
    Write-Host "❌ Porta 3306 livre (MySQL não está rodando)" -ForegroundColor Red
}

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "─" * 25 -ForegroundColor Yellow
Write-Host "1. Se MySQL instalou: Configurar senha root" -ForegroundColor White
Write-Host "2. Executar: node configurar-mysql-completo.js" -ForegroundColor White
Write-Host "3. Importar backup completo do servidor" -ForegroundColor White

Write-Host "`n💡 ALTERNATIVAS SE FALHAR:" -ForegroundColor Yellow
Write-Host "─" * 35 -ForegroundColor Yellow  
Write-Host "• Instalar XAMPP (inclui MySQL)" -ForegroundColor White
Write-Host "• Usar PostgreSQL (mais simples)" -ForegroundColor White
Write-Host "• Continuar apenas com Prisma/SQLite" -ForegroundColor White
