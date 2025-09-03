# CPLP-Raras Deploy Script para o novo domínio raras-cplp.org
# Data: 03/08/2025

param(
    [switch]$BuildOnly = $false,
    [switch]$UploadOnly = $false,
    [switch]$Force = $false
)

# Carregar configurações do novo domínio
if (Test-Path "deploy_config_raras.ps1") {
    . .\deploy_config_raras.ps1
    Write-Host "✅ Configurações carregadas para raras-cplp.org" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Arquivo deploy_config_raras.ps1 não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CPLP-Raras - Deploy para raras-cplp.org  " -ForegroundColor Cyan
Write-Host "  Novo domínio sem /filipe             " -ForegroundColor Cyan
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
    Show-Progress "Preparando build para raras-cplp.org..."
    
    # Backup da configuração atual
    if (Test-Path "next.config.ts") {
        Copy-Item "next.config.ts" "next.config.backup.ts" -Force
        Show-Progress "Backup da configuração criado"
    }
    
    # Usar configuração de produção sem basePath
    Copy-Item "next.config.production.ts" "next.config.ts" -Force
    Show-Progress "Configuração de produção aplicada (sem /filipe)"
    
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
        # Restaurar configuração original
        if (Test-Path "next.config.backup.ts") {
            Copy-Item "next.config.backup.ts" "next.config.ts" -Force
        }
        exit 1
    }
    
    # Build
    Show-Progress "Gerando build estático para raras-cplp.org..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Falha no build. Verifique os erros acima."
        # Restaurar configuração original
        if (Test-Path "next.config.backup.ts") {
            Copy-Item "next.config.backup.ts" "next.config.ts" -Force
        }
        exit 1
    }
    
    # Restaurar configuração original para desenvolvimento
    if (Test-Path "next.config.backup.ts") {
        Copy-Item "next.config.backup.ts" "next.config.ts" -Force
        Remove-Item "next.config.backup.ts" -Force
        Show-Progress "Configuração de desenvolvimento restaurada"
    }
    
    Show-Progress "Build concluído com sucesso para o novo domínio!" "Green"
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
if (Test-Path "out") {
    Show-Progress "Iniciando upload para raras-cplp.org..."
    
    # Verificar se WinSCP está disponível
    $winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
    if (-not (Test-Path $winscpPath)) {
        $winscpPath = "WinSCP.com"  # Tentar WinSCP no PATH
    }
    
    # Criar script WinSCP com aceitação automática da chave SSH
    $winscpScript = @"
option batch abort
option confirm off
open sftp://$Username`:$Password@$ServerIP`:$ServerPort -hostkey="ssh-ed25519 255 dVYv4u/CG+Vjgr+j7xyZ/1LVtDQZtYCXAS4sJh5C23k"
call mkdir -p /home/ubuntu/upload
call rm -rf /home/ubuntu/upload/*
lcd "out"
cd "/home/ubuntu/upload"
synchronize remote . .
call sudo rm -rf /var/www/html/*
call sudo cp -r /home/ubuntu/upload/* /var/www/html/
call sudo chown -R www-data:www-data /var/www/html/*
close
exit
"@
    
    $scriptFile = "upload_raras.txt"
    $winscpScript | Out-File -FilePath $scriptFile -Encoding ASCII
    
    try {
        Show-Progress "Fazendo upload via SFTP para $RemotePath..."
        & $winscpPath /script=$scriptFile
        
        if ($LASTEXITCODE -eq 0) {
            Show-Progress "Upload concluído com sucesso!" "Green"
            Show-Progress "Site disponível em: $FinalURL" "Cyan"
            
            # Log do deploy
            $logEntry = "$(Get-Date) - Deploy para raras-cplp.org concluído com sucesso"
            $logEntry | Add-Content "deploy_raras.log"
            
        } else {
            Show-Error "Falha no upload. Código de erro: $LASTEXITCODE"
            exit 1
        }
    }
    catch {
        Show-Error "Erro durante o upload: $($_.Exception.Message)"
        exit 1
    }
    finally {
        # Limpar arquivo de script
        if (Test-Path $scriptFile) {
            Remove-Item $scriptFile -Force
        }
    }
} else {
    Show-Error "Pasta 'out' não encontrada. Execute o build primeiro."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy para raras-cplp.org CONCLUÍDO  " -ForegroundColor Green
Write-Host "  URL: $FinalURL                        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
