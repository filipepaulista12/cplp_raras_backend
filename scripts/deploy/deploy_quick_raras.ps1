# Script rápido para fazer deploy para raras-cplp.org
# Executa o deploy completo com as configurações corretas

Write-Host "🚀 Iniciando deploy para raras-cplp.org..." -ForegroundColor Cyan
Write-Host ""

# Executar o script de deploy específico
if (Test-Path "deploy_raras.ps1") {
    .\deploy_raras.ps1
} else {
    Write-Host "❌ Script deploy_raras.ps1 não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host "🌐 Verifique em: https://raras-cplp.org/" -ForegroundColor Cyan
