# Script para download dos XMLs Orphadata
# Execute no PowerShell

# Phenotypes (product4)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product4.xml" -OutFile "database/orphadata-sources/en_product4.xml"

# Genes (product6)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product6.xml" -OutFile "database/orphadata-sources/en_product6.xml"

# Epidemiology (product9_prev)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product9_prev.xml" -OutFile "database/orphadata-sources/en_product9_prev.xml"

# Natural History (product9_ages)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product9_ages.xml" -OutFile "database/orphadata-sources/en_product9_ages.xml"

# Classifications Neurology (product3_181)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product3_181.xml" -OutFile "database/orphadata-sources/en_product3_181.xml"

# Classifications Genetics (product3_156)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product3_156.xml" -OutFile "database/orphadata-sources/en_product3_156.xml"

# Alignments + Definitions (product1)
Invoke-WebRequest -Uri "https://www.orphadata.com/data/xml/en_product1.xml" -OutFile "database/orphadata-sources/en_product1.xml"

Write-Host "Downloads concluídos!"