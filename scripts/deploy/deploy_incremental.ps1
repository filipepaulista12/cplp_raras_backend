# CPLP-Raras Deploy Incremental para SFTP
# Script otimizado que so envia arquivos modificados
# Servidor: ciis.fmrp.usp.br
# Data: 02/08/2025

param(
    [switch]$BuildOnly = $false,
    [switch]$UploadOnly = $false,
    [switch]$Force = $false,
    [switch]$FullSync = $false  # Forca envio completo
)

# Carregar configuracoes do arquivo separado (nao versionado)
if (Test-Path "deploy_config.ps1") {
    . .\deploy_config.ps1
    Write-Host "Configuracoes carregadas de deploy_config.ps1" -ForegroundColor Green
} else {
    Write-Host "ERRO: Arquivo deploy_config.ps1 nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para usar este script, voce precisa:" -ForegroundColor Yellow
    Write-Host "1. Copiar deploy_config.example.ps1 para deploy_config.ps1" -ForegroundColor White
    Write-Host "2. Editar deploy_config.ps1 com suas credenciais" -ForegroundColor White
    Write-Host "3. Executar este script novamente" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verificar se as configuracoes foram definidas
if ($ServerIP -eq "SEU_SERVIDOR_IP" -or $Username -eq "SEU_USUARIO" -or $Password -eq "SUA_SENHA") {
    Write-Host "ERRO: Configure suas credenciais em deploy_config.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CPLP-Raras - Deploy SFTP Incremental " -ForegroundColor Cyan
Write-Host "  Servidor: ciis.fmrp.usp.br           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Arquivo para armazenar checksums
$checksumFile = ".deploy_checksums.json"

# Funcao para mostrar progresso
function Show-Progress {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[INFO] $Message" -ForegroundColor $Color
}

# Funcao para mostrar erro
function Show-Error {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor Red
}

# Funcao para calcular hash de arquivo
function Get-FileHashMD5 {
    param([string]$FilePath)
    try {
        $hash = Get-FileHash -Path $FilePath -Algorithm MD5
        return $hash.Hash
    } catch {
        return $null
    }
}

# Funcao para carregar checksums anteriores
function Load-PreviousChecksums {
    if (Test-Path $checksumFile) {
        try {
            $content = Get-Content $checksumFile -Raw | ConvertFrom-Json
            return $content
        } catch {
            Show-Progress "Arquivo de checksums corrompido, sera recriado" "Yellow"
            return @{}
        }
    }
    return @{}
}

# Funcao para salvar checksums
function Save-Checksums {
    param([hashtable]$Checksums)
    $Checksums | ConvertTo-Json -Depth 10 | Out-File $checksumFile -Encoding UTF8
}

# Funcao para obter arquivos modificados
function Get-ModifiedFiles {
    param([string]$BuildPath)
    
    Show-Progress "Analisando arquivos modificados..."
    
    $previousChecksums = Load-PreviousChecksums
    $currentChecksums = @{}
    $modifiedFiles = @()
    $newFiles = @()
    $totalFiles = 0
    
    if (Test-Path $BuildPath) {
        $allFiles = Get-ChildItem -Path $BuildPath -Recurse -File
        $totalFiles = $allFiles.Count
        
        Show-Progress "Verificando $totalFiles arquivos..."
        
        foreach ($file in $allFiles) {
            $relativePath = $file.FullName.Substring($BuildPath.Length + 1)
            $currentHash = Get-FileHashMD5 -FilePath $file.FullName
            $currentChecksums[$relativePath] = $currentHash
            
            if ($previousChecksums.PSObject.Properties.Name -contains $relativePath) {
                if ($previousChecksums.$relativePath -ne $currentHash) {
                    $modifiedFiles += $file
                    Write-Host "  Modificado: $relativePath" -ForegroundColor Yellow
                }
            } else {
                $newFiles += $file
                Write-Host "  Novo: $relativePath" -ForegroundColor Green
            }
        }
        
        # Salvar checksums atuais
        Save-Checksums -Checksums $currentChecksums
    }
    
    $changedFiles = $modifiedFiles + $newFiles
    
    if ($changedFiles.Count -eq 0 -and -not $FullSync) {
        Show-Progress "Nenhum arquivo foi modificado!" "Green"
        return @()
    }
    
    if ($FullSync) {
        Show-Progress "Modo Full Sync ativado - enviando todos os arquivos" "Cyan"
        return $allFiles
    }
    
    Show-Progress "Resumo das mudancas:" "Cyan"
    Show-Progress "  Arquivos novos: $($newFiles.Count)" "Green"
    Show-Progress "  Arquivos modificados: $($modifiedFiles.Count)" "Yellow"
    Show-Progress "  Total a enviar: $($changedFiles.Count) de $totalFiles" "Cyan"
    
    return $changedFiles
}

# Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Show-Error "Node.js nao encontrado. Instale o Node.js primeiro."
    exit 1
}

$nodeVersion = node --version
Show-Progress "Node.js versao: $nodeVersion"

# Etapa 1: Build (se nao for UploadOnly)
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
    
    # Instalar dependencias
    Show-Progress "Instalando dependencias..."
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Falha na instalacao de dependencias."
        exit 1
    }
    
    # Build
    Show-Progress "Gerando build estatico..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Show-Error "Falha no build. Verifique os erros acima."
        exit 1
    }
    
    Show-Progress "Build concluido com sucesso!" "Green"
}

# Se for apenas build, parar aqui
if ($BuildOnly) {
    Show-Progress "Build concluido. Use os arquivos da pasta 'out' para upload manual."
    if (Test-Path "out") {
        Start-Process "out"
    }
    exit 0
}

# Etapa 2: Upload Incremental via SFTP
if (-not $BuildOnly) {
    Show-Progress "Iniciando analise incremental..."
    
    # Obter apenas arquivos modificados
    $filesToUpload = Get-ModifiedFiles -BuildPath (Resolve-Path "out").Path
    
    if ($filesToUpload.Count -eq 0) {
        Write-Host ""
        Write-Host "NADA PARA ATUALIZAR!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Todos os arquivos estao sincronizados." -ForegroundColor Green
        Write-Host "Site disponivel em: $FinalURL" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Dica: Use -FullSync para forcar envio completo se necessario" -ForegroundColor Yellow
        exit 0
    }
    
    Show-Progress "Iniciando upload incremental para $ServerIP..."
    
    # Verificar se WinSCP esta instalado
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
        Show-Progress "Usando WinSCP para upload incremental: $winscpPath"
        
        # Criar script para upload incremental
        $scriptLines = @()
        $scriptLines += "# Conectar via SFTP"
        $scriptLines += "open sftp://$Username`:$Password@$ServerIP`:$ServerPort -hostkey=*"
        $scriptLines += ""
        $scriptLines += "# Navegar para o diretorio correto"
        $scriptLines += "cd $RemotePath"
        $scriptLines += "lcd out"
        $scriptLines += ""
        
        # Adicionar comandos para cada arquivo modificado
        foreach ($file in $filesToUpload) {
            $relativePath = $file.FullName.Substring((Resolve-Path "out").Path.Length + 1)
            $remoteDir = Split-Path $relativePath -Parent
            
            if ($remoteDir -and $remoteDir -ne ".") {
                $remoteDirFormatted = $remoteDir -replace "\\", "/"
                $scriptLines += "# Criar diretorio se necessario: $remoteDirFormatted"
                $scriptLines += "call mkdir -p `"$remoteDirFormatted`" 2>/dev/null || true"
            }
            
            $relativePathFormatted = $relativePath -replace "\\", "/"
            $scriptLines += "put `"$relativePath`" `"$relativePathFormatted`""
        }
        
        $scriptLines += ""
        $scriptLines += "# Sair"
        $scriptLines += "exit"
        
        $scriptContent = $scriptLines -join "`n"
        $scriptFile = "sftp_incremental_deploy.txt"
        $scriptContent | Out-File -FilePath $scriptFile -Encoding ASCII
        
        try {
            Show-Progress "Conectando ao servidor SFTP..."
            Show-Progress "Enviando $($filesToUpload.Count) arquivos modificados para: $RemotePath"
            
            & $winscpPath /script=$scriptFile /log=sftp_incremental.log
            
            if ($LASTEXITCODE -eq 0) {
                Show-Progress "Upload incremental concluido com sucesso!" "Green"
                Write-Host ""
                Write-Host "DEPLOY INCREMENTAL REALIZADO!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Estatisticas do deploy:" -ForegroundColor Cyan
                Write-Host "  Arquivos enviados: $($filesToUpload.Count)" -ForegroundColor White
                Write-Host "  Tempo economizado: ~$([math]::Round((159 - $filesToUpload.Count) / 159 * 100))%" -ForegroundColor Green
                Write-Host "  Servidor: ciis.fmrp.usp.br" -ForegroundColor White
                Write-Host "  URL: $FinalURL" -ForegroundColor White
                Write-Host ""
                
                # Tentar abrir a URL no navegador
                try {
                    Start-Process $FinalURL
                } catch {
                    Write-Host "Nao foi possivel abrir automaticamente. Acesse: $FinalURL"
                }
            } else {
                Show-Error "Falha no upload incremental via SFTP."
                if (Test-Path "sftp_incremental.log") {
                    Show-Progress "Verificando log de erro..."
                    Get-Content "sftp_incremental.log" | Select-Object -Last 10
                }
            }
        } finally {
            # Limpar arquivos temporarios
            if (Test-Path $scriptFile) {
                Remove-Item $scriptFile
            }
        }
    } else {
        Show-Error "WinSCP nao encontrado."
        Write-Host ""
        Write-Host "Para usar deploy incremental, instale WinSCP:" -ForegroundColor Yellow
        Write-Host "https://winscp.net/download/WinSCP-6.1.2-Setup.exe" -ForegroundColor Cyan
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       DEPLOY INCREMENTAL COMPLETO     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "1. Acesse: $FinalURL" -ForegroundColor Cyan
Write-Host "2. Teste as funcionalidades modificadas" -ForegroundColor Cyan
Write-Host "3. Verifique se tudo esta funcionando" -ForegroundColor Cyan

Write-Host ""
Write-Host "Comandos uteis:" -ForegroundColor Yellow
Write-Host "  .\deploy_incremental.ps1                    # Deploy so mudancas" -ForegroundColor White
Write-Host "  .\deploy_incremental.ps1 -FullSync         # Deploy completo" -ForegroundColor White
Write-Host "  .\deploy_incremental.ps1 -BuildOnly        # So build" -ForegroundColor White
Write-Host "  .\deploy_incremental.ps1 -UploadOnly       # So upload" -ForegroundColor White

Write-Host ""
Write-Host "Para suporte, consulte DEPLOY_INSTRUCTIONS.md" -ForegroundColor Gray
