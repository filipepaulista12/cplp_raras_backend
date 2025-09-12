# 🐳 CONFIGURAÇÃO MySQL LOCAL VIA DOCKER

Write-Host "🐳 CONFIGURAÇÃO MySQL LOCAL VIA DOCKER" -ForegroundColor Cyan
Write-Host "═" * 50 -ForegroundColor Cyan

# Verificar se Docker está disponível
Write-Host "`n🔍 VERIFICANDO DOCKER:" -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker não encontrado" -ForegroundColor Red
    Write-Host "💡 Instale Docker Desktop: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Yellow
    exit 1
}

# Parar e remover container MySQL existente se houver
Write-Host "`n🧹 LIMPANDO CONTAINERS EXISTENTES:" -ForegroundColor Yellow
try {
    docker stop mysql-cplp 2>$null
    docker rm mysql-cplp 2>$null
    Write-Host "✅ Container anterior removido" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Nenhum container anterior encontrado" -ForegroundColor Blue
}

# Criar container MySQL
Write-Host "`n🚀 CRIANDO CONTAINER MySQL:" -ForegroundColor Yellow
$mysqlPassword = "IamSexyAndIKnowIt#2025(*)"

$dockerCommand = @"
docker run --name mysql-cplp ``
  -e MYSQL_ROOT_PASSWORD='$mysqlPassword' ``
  -e MYSQL_DATABASE=cplp_raras ``
  -e MYSQL_USER=cplp_user ``
  -e MYSQL_PASSWORD=cplp_2025 ``
  -p 3306:3306 ``
  -v mysql-cplp-data:/var/lib/mysql ``
  -d mysql:8.0
"@

try {
    Write-Host "🔧 Executando: docker run mysql:8.0..." -ForegroundColor Blue
    $containerId = Invoke-Expression $dockerCommand
    Write-Host "✅ Container criado: $containerId" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar container: $_" -ForegroundColor Red
    exit 1
}

# Aguardar MySQL inicializar
Write-Host "`n⏳ AGUARDANDO MySQL INICIALIZAR:" -ForegroundColor Yellow
Write-Host "🔄 Aguardando 30 segundos..." -ForegroundColor Blue

for ($i = 30; $i -gt 0; $i--) {
    Write-Host "⏱️  $i segundos restantes..." -ForegroundColor Gray
    Start-Sleep 1
}

# Verificar se MySQL está rodando
Write-Host "`n🔍 VERIFICANDO STATUS:" -ForegroundColor Yellow
try {
    $status = docker ps --filter "name=mysql-cplp" --format "table {{.Names}}`t{{.Status}}"
    Write-Host $status -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao verificar status" -ForegroundColor Red
}

# Testar conexão
Write-Host "`n🔗 TESTANDO CONEXÃO:" -ForegroundColor Yellow
try {
    $testResult = docker exec mysql-cplp mysql -u root -p"$mysqlPassword" -e "SELECT VERSION();"
    Write-Host "✅ MySQL respondendo:" -ForegroundColor Green
    Write-Host $testResult -ForegroundColor White
} catch {
    Write-Host "❌ Erro na conexão: $_" -ForegroundColor Red
    Write-Host "💡 Tente aguardar mais alguns segundos e testar novamente" -ForegroundColor Yellow
}

# Verificar database
Write-Host "`n📊 VERIFICANDO DATABASE:" -ForegroundColor Yellow
try {
    $dbResult = docker exec mysql-cplp mysql -u root -p"$mysqlPassword" -e "SHOW DATABASES;"
    Write-Host "✅ Databases disponíveis:" -ForegroundColor Green
    Write-Host $dbResult -ForegroundColor White
} catch {
    Write-Host "❌ Erro ao verificar databases: $_" -ForegroundColor Red
}

Write-Host "`n🎯 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "═" * 30 -ForegroundColor Cyan
Write-Host "1️⃣  Importar backup: docker exec -i mysql-cplp mysql -u root -p`"$mysqlPassword`" cplp_raras < database/backup_cplp_raras_20250908.sql" -ForegroundColor White
Write-Host "2️⃣  Testar conexão: docker exec -it mysql-cplp mysql -u root -p" -ForegroundColor White
Write-Host "3️⃣  Verificar dados: docker exec mysql-cplp mysql -u root -p`"$mysqlPassword`" -e `"USE cplp_raras; SHOW TABLES;`"" -ForegroundColor White

Write-Host "`n✨ CONFIGURAÇÃO DOCKER CONCLUÍDA!" -ForegroundColor Green
Write-Host "🐳 Container: mysql-cplp" -ForegroundColor White
Write-Host "🔌 Porta: 3306" -ForegroundColor White
Write-Host "👤 Usuário: root" -ForegroundColor White
Write-Host "🔑 Senha: $mysqlPassword" -ForegroundColor White
Write-Host "🗄️  Database: cplp_raras" -ForegroundColor White
