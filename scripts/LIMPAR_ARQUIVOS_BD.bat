@echo off
REM ==============================================================================
REM SCRIPT DE LIMPEZA - REMOVER ARQUIVOS JÁ COPIADOS PARA BACKEND
REM Remove TODOS os arquivos de BD que já foram separados
REM ==============================================================================

echo 🧹 INICIANDO LIMPEZA DO PROJETO NEXT.JS...
echo ⚠️ Removendo arquivos já copiados para backend...
echo.

echo 💾 Removendo bancos de dados...
del "database\gard_dev.db" 2>nul
del "database\database.db" 2>nul
echo ✅ Bancos removidos!

echo 📋 Removendo pasta prisma COMPLETA...
rmdir "prisma" /S /Q 2>nul
echo ✅ Prisma removido!

echo ⚙️ Removendo scripts de população...
rmdir "scripts\01-imports" /S /Q 2>nul
rmdir "scripts\02-population" /S /Q 2>nul  
rmdir "scripts\03-translations" /S /Q 2>nul
rmdir "scripts\04-hpo-system" /S /Q 2>nul
echo ✅ Scripts de população removidos!

echo 📊 Removendo scripts de análise...
rmdir "scripts\05-analysis-reports" /S /Q 2>nul
del "scripts\check-*.js" 2>nul
del "scripts\verify-*.js" 2>nul
del "scripts\simple-*.js" 2>nul
del "scripts\ultimate-*.js" 2>nul
echo ✅ Scripts de análise removidos!

echo 📦 Removendo dados fonte...
rmdir "database\orphadata-sources" /S /Q 2>nul
rmdir "database\hpo-official" /S /Q 2>nul
rmdir "database\drugbank" /S /Q 2>nul
rmdir "database\gard-data" /S /Q 2>nul
echo ✅ Dados fonte removidos!

echo 💾 Removendo backups...
del "backups\*.db" 2>nul
del "backups\*.zip" 2>nul
del "backups\*.sql" 2>nul
echo ✅ Backups removidos!

echo 🔧 Removendo scripts de suporte...
del "scripts\parse-*.js" 2>nul
del "scripts\process-*.js" 2>nul
del "scripts\populate-*.js" 2>nul
del "scripts\setup-*.js" 2>nul
del "scripts\import-*.js" 2>nul
del "scripts\download-*.js" 2>nul
del "scripts\extract-*.js" 2>nul
del "scripts\complete-*.js" 2>nul
del "scripts\debug-*.js" 2>nul
del "scripts\massive-*.js" 2>nul
del "scripts\recover-*.js" 2>nul
del "scripts\force-*.js" 2>nul
del "scripts\translate-*.js" 2>nul
echo ✅ Scripts de suporte removidos!

echo 📄 Removendo outros arquivos...
del "package.backend.json" 2>nul
del "README_BACKEND.md" 2>nul
del "LISTA_ARQUIVOS_BD_COMPLETA.json" 2>nul
echo ✅ Outros arquivos removidos!

echo 📚 Removendo documentação específica de BD...
del "*GARD*.md" 2>nul
del "*DATABASE*.md" 2>nul
del "*BACKEND*.md" 2>nul
del "SOLUÇÃO-ERRO-PRISMA.md" 2>nul
del "FEEDBACK_SYSTEM_README.md" 2>nul
echo ✅ Documentação de BD removida!

echo.
echo 🎯 ================================
echo 🎯 LIMPEZA COMPLETA FINALIZADA!
echo 🎯 ================================
echo.
echo ✅ Projeto Next.js agora contém APENAS frontend!
echo ✅ Todos arquivos de BD foram movidos para backend separado!
echo.
echo 📁 Pastas que permaneceram:
echo   📂 src\           - Código React/Next.js
echo   📂 public\        - Assets estáticos  
echo   📂 pages\         - Páginas Next.js (se existir)
echo   📂 .next\         - Build Next.js
echo.
echo ⚠️ Se algum arquivo importante foi removido por engano,
echo    ele está salvo no projeto backend separado!
echo.

pause
