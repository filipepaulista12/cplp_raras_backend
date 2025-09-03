# CPLP-Raras Deploy Script
# Versão: 2.0
# Data: 02/08/2025

param(
    [string]$FtpServer = "",
    [string]$FtpUser = "",
    [string]$FtpPassword = "",
    [string]$FtpPath = "/public_html",
    [switch]$BuildOnly = $false,
    [switch]$UploadOnly = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "      CPLP-Raras - Deploy Automático   " -ForegroundColor Cyan
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

# Etapa 2: Upload via FTP (se configurado)
if ($FtpServer -and $FtpUser -and $FtpPassword -and -not $BuildOnly) {
    Show-Progress "Iniciando upload via FTP..."
    
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
        
        # Criar script temporário para WinSCP
        $scriptContent = @"
open ftp://$FtpUser`:$FtpPassword@$FtpServer
cd $FtpPath
lcd out
put -transfer=binary *
exit
"@
        
        $scriptFile = "winscp_script.txt"
        $scriptContent | Out-File -FilePath $scriptFile -Encoding ASCII
        
        try {
            & $winscpPath /script=$scriptFile
            
            if ($LASTEXITCODE -eq 0) {
                Show-Progress "Upload concluído com sucesso!" "Green"
            } else {
                Show-Error "Falha no upload via WinSCP."
            }
        } finally {
            # Limpar arquivo de script
            if (Test-Path $scriptFile) {
                Remove-Item $scriptFile
            }
        }
    } else {
        Show-Error "WinSCP não encontrado. Instale WinSCP ou faça upload manual."
        Show-Progress "Download: https://winscp.net/"
    }
} elseif (-not $BuildOnly) {
    # Upload manual
    Show-Progress "Para upload manual:"
    Write-Host "1. Abra seu cliente FTP (WinSCP/FileZilla)" -ForegroundColor Yellow
    Write-Host "2. Conecte ao servidor: $FtpServer" -ForegroundColor Yellow
    Write-Host "3. Navegue até: $FtpPath" -ForegroundColor Yellow
    Write-Host "4. Faça upload de TODOS os arquivos da pasta 'out\'" -ForegroundColor Yellow
    Write-Host "5. Mantenha a estrutura de pastas" -ForegroundColor Yellow
    
    if (Test-Path "out") {
        Start-Process "out"
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "           DEPLOY CONCLUÍDO!            " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Estatísticas do build
if (Test-Path "out") {
    $files = Get-ChildItem -Recurse "out" | Where-Object { -not $_.PSIsContainer }
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "Estatísticas do build:" -ForegroundColor Green
    Write-Host "- Total de arquivos: $($files.Count)" -ForegroundColor White
    Write-Host "- Tamanho total: $totalSizeMB MB" -ForegroundColor White
    Write-Host "- Pasta de destino: out\" -ForegroundColor White
}

Write-Host ""
Write-Host "Para mais informações, consulte DEPLOY_INSTRUCTIONS.md" -ForegroundColor Cyan

# Exemplos de uso
Write-Host ""
Write-Host "Exemplos de uso:" -ForegroundColor Yellow
Write-Host ".\deploy.ps1 -BuildOnly                    # Apenas build" -ForegroundColor Gray
Write-Host ".\deploy.ps1 -FtpServer ftp.exemplo.com -FtpUser usuario -FtpPassword senha" -ForegroundColor Gray
