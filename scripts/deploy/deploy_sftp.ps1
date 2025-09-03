# CPLP-Raras Deploy Script para SFTP
# Servidor: ciis.fmrp.usp.br
# Data: 02/08/2025

param(
    [switch]$BuildOnly = $false,
    [switch]$UploadOnly = $false,
    [switch]$Force = $false
)

# Carregar configurações do arquivo separado (não versionado)
if (Test-Path "deploy_config.ps1") {
    . .\deploy_config.ps1
    Write-Host "✅ Configurações carregadas de deploy_config.ps1" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Arquivo deploy_config.ps1 não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para usar este script, você precisa:" -ForegroundColor Yellow
    Write-Host "1. Copiar deploy_config.example.ps1 para deploy_config.ps1" -ForegroundColor White
    Write-Host "2. Editar deploy_config.ps1 com suas credenciais" -ForegroundColor White
    Write-Host "3. Executar este script novamente" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verificar se as configurações foram definidas
if ($ServerIP -eq "SEU_SERVIDOR_IP" -or $Username -eq "SEU_USUARIO" -or $Password -eq "SUA_SENHA") {
    Write-Host "❌ ERRO: Configure suas credenciais em deploy_config.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CPLP-Raras - Deploy SFTP Automático  " -ForegroundColor Cyan
Write-Host "  Servidor: ciis.fmrp.usp.br           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Função para mostrar progresso
function Show-Progress {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

# Função para mostrar erro
function Show-Error {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Show-Error "Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
}

$nodeVersion = node --version
Show-Progress "Node.js versão: $nodeVersion"

# Etapa 1: Build (se não for UploadOnly)
if (-not $UploadOnly) {
    Show-Progress "Iniciando processo de build..."
    
    # Limpar builds anteriores
    if (Test-Path "out") {
        Show-Progress "Removendo build anterior..."
        Remove-Item -Recurse -Force "out"
    }
    
    if (Test-Path ".next") {
        Show-Progress "Limpando cache do Next.js..."
        Remove-Item -Recurse -Force ".next"
    }
    
    # Instalar dependências
    Show-Progress "Instalando dependências..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Falha na instalação de dependências."
        exit 1
    }
    
    # Build
    Show-Progress "Gerando build estático..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Falha no build. Verifique os erros acima."
        exit 1
    }
    
    Show-Progress "Build concluído com sucesso!" "Green"
}

# Se for apenas build, parar aqui
if ($BuildOnly) {
    Show-Progress "Build concluído. Use os arquivos da pasta 'out' para upload manual."
    if (Test-Path "out") {
        Start-Process "out"
    }
    exit 0
}

# Etapa 2: Upload via SFTP
if (-not $BuildOnly) {
    Show-Progress "Iniciando upload via SFTP para $ServerIP..."
    
    # Verificar se WinSCP está instalado
    $winscpPath = ""
    $possiblePaths = @(
        "C:\Program Files (x86)\WinSCP\WinSCP.com",
        "C:\Program Files\WinSCP\WinSCP.com",
        "$env:ProgramFiles\WinSCP\WinSCP.com",
        "${env:ProgramFiles(x86)}\WinSCP\WinSCP.com"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $winscpPath = $path
            break
        }
    }
    
    if ($winscpPath) {
        Show-Progress "Usando WinSCP para upload: $winscpPath"
        
        # Criar script temporário para WinSCP (SFTP)
        $scriptContent = @"
# Conectar via SFTP
open sftp://$Username`:$Password@$ServerIP`:$ServerPort -hostkey=*

# Navegar para o diretório correto
cd $RemotePath

# Fazer backup se existir (opcional)
# call mv index.html index.html.backup 2>/dev/null || true

# Navegar para pasta local
lcd out

# Upload recursivo de todos os arquivos
put -transfer=binary *

# Sair
exit
"@
        
        $scriptFile = "sftp_deploy_script.txt"
        $scriptContent | Out-File -FilePath $scriptFile -Encoding ASCII
        
        try {
            Show-Progress "Conectando ao servidor SFTP..."
            Show-Progress "Fazendo upload para: $RemotePath"
            
            & $winscpPath /script=$scriptFile /log=sftp_deploy.log
            
            if ($LASTEXITCODE -eq 0) {
                Show-Progress "Upload concluído com sucesso!" "Green"
                Write-Host ""
                Write-Host "🎉 DEPLOY REALIZADO COM SUCESSO! 🎉" -ForegroundColor Green
                Write-Host ""
                Write-Host "Seu site está disponível em:" -ForegroundColor Yellow
                Write-Host "$FinalURL" -ForegroundColor Cyan
                Write-Host ""
                
                # Tentar abrir a URL no navegador
                try {
                    Start-Process $FinalURL
                } catch {
                    Write-Host "Não foi possível abrir automaticamente. Acesse manualmente: $FinalURL"
                }
            } else {
                Show-Error "Falha no upload via SFTP."
                if (Test-Path "sftp_deploy.log") {
                    Show-Progress "Verificando log de erro..."
                    Get-Content "sftp_deploy.log" | Select-Object -Last 10
                }
            }
        } finally {
            # Limpar arquivos temporários
            if (Test-Path $scriptFile) {
                Remove-Item $scriptFile
            }
        }
    } else {
        Show-Error "WinSCP não encontrado. Instalando WinSCP ou fazendo upload manual..."
        
        # Oferecer download do WinSCP
        Write-Host ""
        Write-Host "Opções:" -ForegroundColor Yellow
        Write-Host "1. Baixar WinSCP: https://winscp.net/download/WinSCP-6.1.2-Setup.exe" -ForegroundColor Cyan
        Write-Host "2. Usar FileZilla: https://filezilla-project.org/download.php" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Configurações para cliente manual:" -ForegroundColor Yellow
        Write-Host "Protocolo: SFTP" -ForegroundColor White
        Write-Host "Host: $ServerIP" -ForegroundColor White
        Write-Host "Porta: $ServerPort" -ForegroundColor White
        Write-Host "Usuário: $Username" -ForegroundColor White
        Write-Host "Senha: $Password" -ForegroundColor White
        Write-Host "Diretório remoto: $RemotePath" -ForegroundColor White
        Write-Host "Pasta local: out\" -ForegroundColor White
        
        if (Test-Path "out") {
            Start-Process "out"
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           INFORMAÇÕES FINAIS           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Estatísticas do build
if (Test-Path "out") {
    $files = Get-ChildItem -Recurse "out" | Where-Object { -not $_.PSIsContainer }
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "Estatísticas do deploy:" -ForegroundColor Green
    Write-Host "- Total de arquivos: $($files.Count)" -ForegroundColor White
    Write-Host "- Tamanho total: $totalSizeMB MB" -ForegroundColor White
    Write-Host "- Servidor: ciis.fmrp.usp.br" -ForegroundColor White
    Write-Host "- Diretório: $RemotePath" -ForegroundColor White
    Write-Host "- URL: $FinalURL" -ForegroundColor White
}

Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: $FinalURL" -ForegroundColor Cyan
Write-Host "2. Teste todas as funcionalidades" -ForegroundColor Cyan
Write-Host "3. Verifique responsividade mobile" -ForegroundColor Cyan
Write-Host "4. Teste seletor de idiomas" -ForegroundColor Cyan

Write-Host ""
Write-Host "Para suporte, consulte DEPLOY_INSTRUCTIONS.md" -ForegroundColor Gray
