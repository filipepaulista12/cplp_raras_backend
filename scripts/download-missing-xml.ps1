# Download dos arquivos XML faltando ou corrompidos

Write-Host "🔄 DOWNLOAD ARQUIVOS XML FALTANDO" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# URLs dos produtos Orphadata
$urls = @{
    "en_product9_prev.xml" = "https://www.orphadata.org/data/xml/en_product9_prev.xml"
    "en_product9_ages.xml" = "https://www.orphadata.org/data/xml/en_product9_ages.xml" 
    "en_product3_156.xml" = "https://www.orphadata.org/data/xml/en_product3_156.xml"
    "en_product3_181.xml" = "https://www.orphadata.org/data/xml/en_product3_181.xml"
}

# Diretório de destino
$destDir = "database/orphadata-sources"

foreach ($file in $urls.Keys) {
    $url = $urls[$file]
    $destPath = "$destDir/$file"
    
    Write-Host "`n📁 Baixando $file..." -ForegroundColor Yellow
    Write-Host "   URL: $url" -ForegroundColor Gray
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $destPath -UseBasicParsing
        $size = [Math]::Round((Get-Item $destPath).Length/1MB, 2)
        Write-Host "   ✅ Sucesso! Tamanho: ${size} MB" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Download completo!" -ForegroundColor Green
