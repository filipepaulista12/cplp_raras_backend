# Script para corrigir a configuração do Apache
$ServerIP = "200.144.254.4"
$Username = "ubuntu"
$Password = "vFpyJS4FA"

$fixConfigScript = @"
option batch abort
option confirm off
open sftp://$Username`:$Password@$ServerIP`:22 -hostkey="ssh-ed25519 255 dVYv4u/CG+Vjgr+j7xyZ/1LVtDQZtYCXAS4sJh5C23k"
call echo "=== CORRIGINDO CONFIGURAÇÃO ==="
call sudo sed -i 's|/var/www/html/filipe/|/var/www/html/|g' /etc/apache2/sites-available/raras-cplp.conf
call sudo sed -i 's|/var/www/html/filipe/|/var/www/html/|g' /etc/apache2/sites-available/raras-cplp-le-ssl.conf
call sudo sed -i 's|/var/www/html/filipe/|/var/www/html/|g' /etc/apache2/sites-available/www.raras-cplp.conf
call sudo sed -i 's|/var/www/html/filipe/|/var/www/html/|g' /etc/apache2/sites-available/www.raras-cplp-le-ssl.conf
call echo "=== VERIFICANDO NOVA CONFIGURAÇÃO ==="
call cat /etc/apache2/sites-available/raras-cplp-le-ssl.conf
call echo "=== RECARREGANDO APACHE ==="
call sudo systemctl reload apache2
call echo "=== TESTANDO ==="
call curl -I -H "Host: raras-cplp.org" https://localhost/
close
exit
"@

$scriptFile = "fix_config.txt"
$fixConfigScript | Out-File -FilePath $scriptFile -Encoding ASCII

try {
    $winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
    if (-not (Test-Path $winscpPath)) {
        $winscpPath = "WinSCP.com"
    }
    
    & $winscpPath /script=$scriptFile
}
finally {
    if (Test-Path $scriptFile) {
        Remove-Item $scriptFile -Force
    }
}
