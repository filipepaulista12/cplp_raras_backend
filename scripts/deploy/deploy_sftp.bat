@echo off
echo ========================================
echo   CPLP-Raras - Deploy SFTP Automatico
echo   Servidor: ciis.fmrp.usp.br
echo ========================================
echo.

REM Verificar se o Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado. Instale o Node.js primeiro.
    pause
    exit /b 1
)

echo [INFO] Iniciando processo de build...
echo.

REM Limpar builds anteriores
if exist "out" (
    echo [INFO] Removendo build anterior...
    rmdir /s /q "out"
)

if exist ".next" (
    echo [INFO] Limpando cache do Next.js...
    rmdir /s /q ".next"
)

echo [INFO] Instalando dependencias...
call npm install

echo [INFO] Gerando build estatico...
call npm run build

if errorlevel 1 (
    echo [ERRO] Falha no build. Verifique os erros acima.
    pause
    exit /b 1
)

echo.
echo ========================================
echo           BUILD CONCLUIDO!
echo ========================================
echo.
echo Os arquivos para upload estao na pasta 'out\'
echo.
echo CONFIGURACOES DO SERVIDOR SFTP:
echo ATENCAO: Configure suas credenciais em deploy_config.ps1
echo Consulte deploy_config.example.ps1 para modelo
echo URL Final: [Configure em deploy_config.ps1]
echo.
echo Proximos passos:
echo 1. Use WinSCP ou FileZilla para conectar via SFTP
echo 2. Navegue ate /var/www/html/filipe no servidor
echo 3. Faca upload de TODOS os arquivos da pasta 'out\'
echo 4. Mantenha a estrutura de pastas
echo 5. Acesse: https://ciis.fmrp.usp.br/filipe/
echo.

REM Abrir pasta out no explorer
if exist "out" (
    start "" "out"
)

REM Tentar executar o script PowerShell automatico
echo Deseja tentar upload automatico via PowerShell? (S/N)
set /p choice=
if /i "%choice%"=="S" (
    powershell -ExecutionPolicy Bypass -File "deploy_sftp.ps1"
)

pause
