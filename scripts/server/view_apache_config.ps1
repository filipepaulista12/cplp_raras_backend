# Script para verificar conteúdo das configurações
$ServerIP = "200.144.254.4"
$Username = "ubuntu"
$Password = "vFpyJS4FA"

$viewConfigScript = @"
option batch abort
option confirm off
open sftp://$Username`:$Password@$ServerIP`:22 -hostkey="ssh-ed25519 255 dVYv4u/CG+Vjgr+j7xyZ/1LVtDQZtYCXAS4sJh5C23k"
call echo "=== CONFIGURAÇÃO raras-cplp.conf ==="
call cat /etc/apache2/sites-available/raras-cplp.conf
call echo "=== CONFIGURAÇÃO SSL ==="
call cat /etc/apache2/sites-available/raras-cplp-le-ssl.conf
call echo "=== TESTE raras-cplp.org ==="
call curl -I -H "Host: raras-cplp.org" http://localhost/
call echo "=== RELOAD APACHE ==="
call sudo systemctl reload apache2
close
exit
"@

$scriptFile = "view_config.txt"
$viewConfigScript | Out-File -FilePath $scriptFile -Encoding ASCII

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
