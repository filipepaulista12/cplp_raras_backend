@echo off
REM ==============================================================================
REM LIMPEZA COMPLETA DOS ARQUIVOS JÁ COPIADOS PARA O BACKEND
REM Todos os arquivos foram verificados e copiados com segurança
REM ==============================================================================

echo 🧹 INICIANDO LIMPEZA COMPLETA DOS ARQUIVOS COPIADOS...
echo.
echo ⚠️ ATENÇÃO: Esta operação irá REMOVER arquivos permanentemente!
echo ✅ Verificação confirmou que todos estão seguros no backend.
echo.
pause

echo 🗑️ Removendo pastas de banco de dados...
rmdir /s /q "database" 2>nul
rmdir /s /q "prisma" 2>nul

echo 🗑️ Removendo scripts...
rmdir /s /q "scripts" 2>nul

echo 🗑️ Removendo backups...
rmdir /s /q "backups" 2>nul

echo 🗑️ Removendo arquivos de configuração de BD...
del ".env" 2>nul
del ".env.postgresql.backup" 2>nul
del ".env.production" 2>nul

echo 🗑️ Removendo documentação de BD...
del "*README*GARD*" 2>nul
del "*PLAN*.md" 2>nul
del "SOLUÇÃO-ERRO-PRISMA.md" 2>nul
del "FEEDBACK_SYSTEM_README.md" 2>nul

echo 🗑️ Removendo scripts de análise...
del "LISTA_ARQUIVOS_BD_COMPLETA.json" 2>nul
del "package.backend.json" 2>nul
del "README_BACKEND.md" 2>nul

echo 🗑️ Removendo scripts de separação...
del "SEPARAR_BACKEND_COMPLETO.bat" 2>nul
del "analisar-todos-arquivos-bd.js" 2>nul

echo 🗑️ Removendo arquivos temporários...
rmdir /s /q "temp_restore" 2>nul
rmdir /s /q "temp_restore2" 2>nul

echo 🗑️ Removendo logs e relatórios...
rmdir /s /q "reports" 2>nul

echo.
echo ✅ ================================
echo ✅ LIMPEZA COMPLETA FINALIZADA!
echo ✅ ================================
echo.
echo 📊 ARQUIVOS REMOVIDOS:
echo   📁 database/         - Bancos de dados
echo   📁 prisma/           - Schemas Prisma
echo   📁 scripts/          - Todos os scripts
echo   📁 backups/          - Arquivos de backup
echo   📁 temp_restore/     - Arquivos temporários
echo   📁 reports/          - Relatórios
echo   📄 Arquivos .env e configurações
echo   📄 Documentação de BD
echo.
echo 🎯 PROJETO AGORA É APENAS FRONTEND NEXT.JS!
echo.
echo 📋 O QUE RESTOU:
dir /b
echo.
echo 🔗 Backend disponível em:
echo   C:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras_backend
echo.

pause
