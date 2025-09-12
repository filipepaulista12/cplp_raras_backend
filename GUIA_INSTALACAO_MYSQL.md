# 🐬 GUIA COMPLETO: INSTALAÇÃO MYSQL LOCAL NO WINDOWS

## 📋 **MÉTODO 1: MYSQL INSTALLER (RECOMENDADO)**

### 🔗 **Passo 1: Download**
```powershell
# Abrir PowerShell como ADMINISTRADOR
Start-Process powershell -Verb RunAs

# Navegar para pasta Downloads
cd $env:USERPROFILE\Downloads

# Baixar MySQL Installer
Invoke-WebRequest -Uri "https://dev.mysql.com/get/Downloads/MySQLInstaller/mysql-installer-community-8.0.39.0.msi" -OutFile "mysql-installer.msi"
```

### 📦 **Passo 2: Instalação**
```powershell
# Executar o instalador
Start-Process "mysql-installer.msi" -Wait

# OU fazer download manual:
# https://dev.mysql.com/downloads/installer/
```

### ⚙️ **Passo 3: Configuração do Installer**
1. **Setup Type**: Escolher "Developer Default"
2. **Requirements**: Instalar .NET Framework se necessário
3. **Installation**: Aguardar instalação completa
4. **Product Configuration**: Configurar MySQL Server

### 🔧 **Passo 4: Configuração do Servidor**
```
Type and Networking:
- Config Type: Development Computer
- Connectivity: TCP/IP, Port 3306
- Named Pipe: Habilitado

Authentication Method:
- Use Strong Password Encryption (RECOMMENDED)

Accounts and Roles:
- Root Password: IamSexyAndIKnowIt#2025(*)
- Create User: cplp_user / password: cplp_2025

Windows Service:
- Configure MySQL Server as Windows Service
- Service Name: MySQL80
- Start at System Startup: ✅
```

---

## 📋 **MÉTODO 2: DOCKER (ALTERNATIVO)**

### 🐳 **Passo 1: Instalar Docker Desktop**
```powershell
# Download Docker Desktop para Windows
# https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

# Instalar Docker Desktop
Start-Process "Docker Desktop Installer.exe" -Wait

# Reiniciar o computador se necessário
```

### 🚀 **Passo 2: Criar Container MySQL**
```powershell
# Criar container MySQL
docker run --name mysql-cplp `
  -e MYSQL_ROOT_PASSWORD=IamSexyAndIKnowIt#2025(*) `
  -e MYSQL_DATABASE=cplp_raras `
  -e MYSQL_USER=cplp_user `
  -e MYSQL_PASSWORD=cplp_2025 `
  -p 3306:3306 `
  -d mysql:8.0

# Verificar se está rodando
docker ps
```

---

## 📋 **MÉTODO 3: SCOOP (PACKAGE MANAGER)**

### 📥 **Passo 1: Instalar Scoop**
```powershell
# Instalar Scoop
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### 🐬 **Passo 2: Instalar MySQL via Scoop**
```powershell
# Adicionar bucket
scoop bucket add extras

# Instalar MySQL
scoop install mysql

# Inicializar MySQL
mysqld --initialize-insecure --user=mysql
```

---

## 🔧 **CONFIGURAÇÃO PÓS-INSTALAÇÃO**

### 📊 **Passo 1: Testar Conexão**
```powershell
# Testar conexão MySQL
mysql -u root -p
# Senha: IamSexyAndIKnowIt#2025(*)

# Dentro do MySQL:
CREATE DATABASE IF NOT EXISTS cplp_raras;
USE cplp_raras;
SHOW TABLES;
```

### 📂 **Passo 2: Importar Backup**
```powershell
# Navegar para pasta do projeto
cd "C:\Users\up739088\Desktop\aplicaçoes,sites,etc\cplp_raras_backend"

# Importar backup MySQL
mysql -u root -p cplp_raras < backup_cplp_raras_20250908.sql
```

### 🔗 **Passo 3: Configurar Conexão no Projeto**
```javascript
// Criar arquivo: mysql-local-config.js
const mysql = require('mysql2/promise');

const localConfig = {
    host: 'localhost',
    user: 'root',
    password: 'IamSexyAndIKnowIt#2025(*)',
    database: 'cplp_raras',
    port: 3306
};

module.exports = localConfig;
```

---

## 🎯 **TESTE FINAL**

### ✅ **Verificar Instalação**
```powershell
# Testar serviço MySQL
Get-Service MySQL80

# Testar conexão
mysql -u root -p -e "SELECT VERSION();"

# Testar base de dados
mysql -u root -p -e "USE cplp_raras; SHOW TABLES; SELECT COUNT(*) FROM cplp_countries;"
```

---

## 🚨 **TROUBLESHOOTING**

### ❌ **Problema: Porta 3306 ocupada**
```powershell
# Verificar porta
netstat -an | findstr 3306

# Parar outros serviços MySQL
net stop MySQL80
```

### ❌ **Problema: Permissões**
```powershell
# Executar como Administrador
Start-Process powershell -Verb RunAs
```

### ❌ **Problema: .NET Framework**
```powershell
# Instalar .NET Framework 4.8
# https://dotnet.microsoft.com/download/dotnet-framework/net48
```

---

## 📈 **PRÓXIMOS PASSOS APÓS INSTALAÇÃO**

1. ✅ **Importar backup** (123K registros)
2. ✅ **Testar conexão** local
3. ✅ **Sincronizar com SQLite**
4. ✅ **Configurar APIs** para usar MySQL
5. ✅ **Backup automático**

---

## 💡 **RECOMENDAÇÃO**

**🎯 MÉTODO 1 (MySQL Installer)** é o mais simples e confiável para Windows.

Se tiver problemas, use **MÉTODO 2 (Docker)** que é isolado e fácil de gerenciar.
