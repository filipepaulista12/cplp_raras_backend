# =====================================================================================
# INSTALAÇÃO MYSQL AUTOMÁTICA - CPLP-RARAS
# =====================================================================================

Write-Host "🔄 INSTALANDO MYSQL SERVER..." -ForegroundColor Yellow
Write-Host "=" * 50

# 1. Download MySQL Installer
$url = "https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-community-8.0.39.0.msi"
$output = "$env:TEMP\mysql-installer.msi"

Write-Host "📥 Baixando MySQL Installer..." -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
    Write-Host "✅ Download concluído" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no download: $_" -ForegroundColor Red
    Write-Host "🔧 INSTALAÇÃO MANUAL NECESSÁRIA:" -ForegroundColor Yellow
    Write-Host "   1. Acesse: https://dev.mysql.com/downloads/installer/"
    Write-Host "   2. Baixe MySQL Installer Community"
    Write-Host "   3. Execute e instale com senha: password"
    Write-Host "   4. Execute este script novamente"
    exit 1
}

# 2. Instalar MySQL silenciosamente
Write-Host "🔧 Instalando MySQL Server..." -ForegroundColor Cyan
try {
    $installArgs = @(
        "/quiet",
        "/norestart",
        "ADDLOCAL=Server,Client,MYSQLPS",
        "MYSQL_ROOT_PASSWORD=password",
        "PORT=3306"
    )
    
    Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $output) + $installArgs -Wait -NoNewWindow
    Write-Host "✅ MySQL instalado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro na instalação: $_" -ForegroundColor Red
    Write-Host "🔧 Tentando instalação interativa..." -ForegroundColor Yellow
    Start-Process -FilePath $output -Wait
}

# 3. Aguardar inicialização
Write-Host "⏳ Aguardando MySQL inicializar..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# 4. Verificar serviço
$service = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "✅ Serviço MySQL encontrado: $($service.Name)" -ForegroundColor Green
    if ($service.Status -ne "Running") {
        Start-Service $service.Name
        Write-Host "🔄 Serviço MySQL iniciado" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️ Serviço MySQL não encontrado - instalação manual necessária" -ForegroundColor Yellow
}

# 5. Testar conexão
Write-Host "🔍 Testando conexão MySQL..." -ForegroundColor Cyan
try {
    & mysql -u root -ppassword -e "SELECT 'MySQL funcionando!' as status;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL funcionando corretamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro na conexão MySQL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Comando mysql não encontrado no PATH" -ForegroundColor Red
    Write-Host "🔧 Adicione MySQL ao PATH: C:\Program Files\MySQL\MySQL Server 8.0\bin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "   1. Verificar se MySQL está rodando"
Write-Host "   2. Executar: node scripts/setup-mysql-local.js"
Write-Host "   3. Popular dados: node scripts/populate-from-dumps.js"

Write-Host ""
Write-Host "💡 CREDENCIAIS MySQL:" -ForegroundColor Cyan
Write-Host "   User: root"
Write-Host "   Password: password"
Write-Host "   Port: 3306"
