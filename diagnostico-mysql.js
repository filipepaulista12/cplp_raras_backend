console.log('🔍 DIAGNÓSTICO: MySQL Installation Status');
console.log('═'.repeat(50));

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📊 VERIFICANDO INSTALAÇÃO MySQL...');
console.log('─'.repeat(40));

// Verificar locais comuns de instalação MySQL
const commonPaths = [
    'C:\\Program Files\\MySQL',
    'C:\\Program Files (x86)\\MySQL',
    'C:\\ProgramData\\MySQL',
    'C:\\MySQL',
    process.env.PROGRAMFILES + '\\MySQL',
    process.env['PROGRAMFILES(X86)'] + '\\MySQL'
];

let mysqlFound = false;
let mysqlPaths = [];

console.log('🔍 Procurando MySQL em locais comuns...');
commonPaths.forEach(searchPath => {
    if (searchPath && fs.existsSync(searchPath)) {
        console.log(`✅ Encontrado: ${searchPath}`);
        mysqlPaths.push(searchPath);
        mysqlFound = true;
        
        // Listar subpastas
        try {
            const items = fs.readdirSync(searchPath);
            items.forEach(item => {
                console.log(`   📁 ${item}`);
            });
        } catch (err) {
            console.log(`   ⚠️  Erro ao ler conteúdo: ${err.message}`);
        }
    }
});

// Verificar serviços Windows
console.log('\n🔧 VERIFICANDO SERVIÇOS WINDOWS...');
console.log('─'.repeat(40));

try {
    const services = execSync('Get-Service | Where-Object { $_.DisplayName -like "*mysql*" } | Format-Table -AutoSize', {
        shell: 'powershell',
        encoding: 'utf8'
    });
    
    if (services.trim()) {
        console.log('✅ Serviços MySQL encontrados:');
        console.log(services);
    } else {
        console.log('❌ Nenhum serviço MySQL encontrado');
    }
} catch (error) {
    console.log('⚠️  Erro ao verificar serviços:', error.message);
}

// Verificar PATH
console.log('\n🛤️  VERIFICANDO PATH...');
console.log('─'.repeat(40));

try {
    const whereResult = execSync('where mysql', { encoding: 'utf8' });
    console.log('✅ MySQL encontrado no PATH:');
    console.log(whereResult);
} catch (error) {
    console.log('❌ MySQL não encontrado no PATH');
}

// Verificar portas
console.log('\n🔌 VERIFICANDO PORTAS...');
console.log('─'.repeat(40));

try {
    const netstat = execSync('netstat -an | findstr :3306', { encoding: 'utf8' });
    if (netstat.trim()) {
        console.log('✅ Porta 3306 em uso:');
        console.log(netstat);
    } else {
        console.log('❌ Porta 3306 não está em uso');
    }
} catch (error) {
    console.log('❌ Porta 3306 não está em uso');
}

// Conclusão e próximos passos
console.log('\n🎯 DIAGNÓSTICO FINAL:');
console.log('═'.repeat(50));

if (mysqlFound) {
    console.log('✅ MySQL foi encontrado no sistema');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('   1. Verificar se o serviço está configurado');
    console.log('   2. Iniciar o serviço MySQL');
    console.log('   3. Adicionar MySQL ao PATH se necessário');
    console.log('');
    console.log('🔧 COMANDOS PARA TESTAR:');
    mysqlPaths.forEach(mysqlPath => {
        const binPath = path.join(mysqlPath, 'MySQL Server 8.0', 'bin');
        if (fs.existsSync(binPath)) {
            console.log(`   "${binPath}\\mysql.exe" -u root -p`);
        }
    });
} else {
    console.log('❌ MySQL não foi encontrado');
    console.log('💡 OPÇÕES:');
    console.log('   1. Reinstalar MySQL usando MySQL Installer');
    console.log('   2. Usar Docker para MySQL');
    console.log('   3. Continuar apenas com SQLite');
    console.log('');
    console.log('🚀 RECOMENDAÇÃO IMEDIATA:');
    console.log('   Vamos prosseguir com SQLite e importar todos os dados do backup');
    console.log('   MySQL pode ser configurado depois');
}

console.log('\n📋 PRÓXIMA AÇÃO SUGERIDA:');
console.log('═'.repeat(50));
console.log('🎯 Importar dados completos do backup para SQLite');
console.log('   ✅ Garantir que SQLite tenha todos os 123,607 registros');
console.log('   ✅ Deixar SQLite idêntico ao servidor MySQL');
console.log('   ✅ MySQL local pode ser configurado posteriormente');
