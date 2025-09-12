# SETUP MYSQL LOCAL - CPLP-RARAS
Write-Host "Configurando MySQL local..." -ForegroundColor Green

# 1. Verificar se MySQL esta instalado
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$mysqlService = Get-Service -Name "*mysql*" -ErrorAction SilentlyContinue

if (Test-Path $mysqlPath) {
    Write-Host "MySQL encontrado!" -ForegroundColor Green
    
    # 2. Iniciar servico se nao estiver rodando
    if ($mysqlService -and $mysqlService.Status -ne "Running") {
        Start-Service $mysqlService.Name
        Write-Host "Servico MySQL iniciado" -ForegroundColor Green
    }
    
    # 3. Criar database
    Write-Host "Criando database cplp_raras..." -ForegroundColor Yellow
    & $mysqlPath -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS cplp_raras CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database criado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "PROXIMO PASSO:"
        Write-Host "node scripts/populate-from-dumps.js" -ForegroundColor Cyan
    } else {
        Write-Host "Erro ao criar database" -ForegroundColor Red
    }
    
} else {
    Write-Host "MySQL nao encontrado!" -ForegroundColor Red
    Write-Host "Por favor instale MySQL Server 8.0" -ForegroundColor Yellow
    Write-Host "URL: https://dev.mysql.com/downloads/installer/" -ForegroundColor Cyan
}
