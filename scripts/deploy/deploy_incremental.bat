@echo off
:: CPLP-Raras Deploy Incremental Rápido
:: Só envia arquivos modificados - economiza tempo!

echo ========================================
echo   CPLP-Raras - Deploy Incremental
echo ========================================
echo.

:: Verificar se existe arquivo de configuração
if not exist "deploy_config.ps1" (
    echo ERRO: Configure primeiro o deploy_config.ps1
    echo.
    echo 1. Copie deploy_config.example.ps1 para deploy_config.ps1
    echo 2. Edite suas credenciais no arquivo
    echo 3. Execute este script novamente
    pause
    exit /b 1
)

echo 🚀 Iniciando deploy incremental...
echo.

:: Executar script PowerShell incremental
powershell -ExecutionPolicy Bypass -File "deploy_incremental.ps1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deploy incremental concluído!
    echo Site atualizado: https://ciis.fmrp.usp.br/filipe/
) else (
    echo.
    echo ❌ Erro no deploy incremental
    echo Verifique os logs acima
)

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
