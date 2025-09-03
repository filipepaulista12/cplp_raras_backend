# Script para verificar configuração do Apache
$ServerIP = "200.144.254.4"
$Username = "ubuntu"
$Password = "vFpyJS4FA"

$configScript = @"
option batch abort
option confirm off
open sftp://$Username`:$Password@$ServerIP`:22 -hostkey="ssh-ed25519 255 dVYv4u/CG+Vjgr+j7xyZ/1LVtDQZtYCXAS4sJh5C23k"
call echo "=== CONFIGURAÇÃO ATUAL ==="
call cat /etc/apache2/sites-enabled/000-default.conf
call echo "=== SITES DISPONÍVEIS ==="
call ls -la /etc/apache2/sites-available/
call echo "=== SITES HABILITADOS ==="
call ls -la /etc/apache2/sites-enabled/
call echo "=== TESTE DIRETO COM IP ==="
call curl -I http://localhost/
close
exit
"@

$scriptFile = "check_config.txt"
$configScript | Out-File -FilePath $scriptFile -Encoding ASCII

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
