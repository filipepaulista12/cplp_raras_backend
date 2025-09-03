# Script para diagnosticar o problema no servidor
$ServerIP = "200.144.254.4"
$Username = "ubuntu"
$Password = "vFpyJS4FA"

$diagnosticScript = @"
option batch abort
option confirm off
open sftp://$Username`:$Password@$ServerIP`:22 -hostkey="ssh-ed25519 255 dVYv4u/CG+Vjgr+j7xyZ/1LVtDQZtYCXAS4sJh5C23k"
call ls -la /var/www/html/
call ls -la /var/www/
call systemctl status apache2
call systemctl status nginx
call cat /etc/apache2/sites-enabled/000-default.conf
close
exit
"@

$scriptFile = "diagnostic.txt"
$diagnosticScript | Out-File -FilePath $scriptFile -Encoding ASCII

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
