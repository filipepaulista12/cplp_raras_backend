@echo off
echo ========================================
echo      CPLP-Raras - Deploy Automatico
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
echo Proximos passos:
echo 1. Acesse seu cliente FTP (WinSCP/FileZilla)
echo 2. Conecte ao seu servidor
echo 3. Navegue ate o diretorio publico (/public_html)
echo 4. Faca upload de TODOS os arquivos da pasta 'out\'
echo 5. Mantenha a estrutura de pastas
echo.
echo Para mais detalhes, consulte DEPLOY_INSTRUCTIONS.md
echo.

REM Abrir pasta out no explorer
if exist "out" (
    start "" "out"
)

pause
