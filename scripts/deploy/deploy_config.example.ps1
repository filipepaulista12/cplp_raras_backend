# Exemplo de Configurações do Servidor SFTP
# Copie este arquivo para deploy_config.ps1 e configure com suas credenciais

# Configurações do servidor
$ServerIP = "SEU_SERVIDOR_IP"
$ServerPort = "22"
$Username = "SEU_USUARIO"
$Password = "SUA_SENHA"
$RemotePath = "/var/www/html/SEU_DIRETORIO"
$FinalURL = "https://seudominio.com/"

# INSTRUÇÕES:
# 1. Copie este arquivo: copy deploy_config.example.ps1 deploy_config.ps1
# 2. Edite deploy_config.ps1 com suas credenciais reais
# 3. Execute: .\deploy_sftp.ps1
#
# IMPORTANTE: deploy_config.ps1 está no .gitignore e não será commitado
