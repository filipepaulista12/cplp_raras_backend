/**
 * Teste Direto de Conectividade - Debug CI/CD
 */

const { spawn } = require('child_process');
const fs = require('fs');

async function testDirectConnection() {
  console.log('🔍 TESTE DIRETO DE CONECTIVIDADE');
  console.log('='.repeat(40));
  
  // 1. Verificar se compilado existe
  if (fs.existsSync('dist/main.js')) {
    console.log('✅ dist/main.js existe');
  } else {
    console.log('❌ dist/main.js não encontrado');
    console.log('🔨 Compilando...');
    
    try {
      await new Promise((resolve, reject) => {
        const build = spawn('npm', ['run', 'build'], { stdio: 'pipe', shell: true });
        
        build.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Compilação OK');
            resolve();
          } else {
            reject(new Error(`Build falhou: ${code}`));
          }
        });
      });
    } catch (error) {
      console.log('❌ Erro na compilação:', error.message);
      return;
    }
  }

  // 2. Tentar iniciar servidor na porta 3003
  console.log('🚀 Tentando iniciar servidor na porta 3003...');
  
  const serverProcess = spawn('node', ['dist/main'], {
    stdio: 'pipe',
    env: { ...process.env, PORT: '3003' },
    shell: true
  });

  let serverOutput = '';
  let errorOutput = '';
  
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    serverOutput += output;
    console.log('📤 STDOUT:', output.trim());
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString();
    errorOutput += error;
    console.log('⚠️ STDERR:', error.trim());
  });

  serverProcess.on('error', (error) => {
    console.log('❌ Process Error:', error.message);
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`🏁 Processo finalizou: código ${code}, sinal ${signal}`);
    console.log('📝 Output completo:', serverOutput);
    if (errorOutput) {
      console.log('⚠️ Erros:', errorOutput);
    }
  });

  // 3. Aguardar um tempo e tentar conectar
  setTimeout(async () => {
    console.log('🔗 Tentando conectar...');
    
    try {
      const fetch = await import('node-fetch');
      const response = await fetch.default('http://localhost:3003/health', {
        timeout: 5000
      });
      
      if (response.ok) {
        console.log('✅ SUCESSO! Servidor respondeu:', response.status);
        const text = await response.text();
        console.log('📄 Resposta:', text);
      } else {
        console.log('⚠️ Servidor respondeu mas com erro:', response.status);
      }
    } catch (error) {
      console.log('❌ Falha na conexão:', error.message);
    }
    
    // Matar processo
    serverProcess.kill('SIGTERM');
    setTimeout(() => process.exit(0), 2000);
    
  }, 10000);

  // Timeout de segurança
  setTimeout(() => {
    console.log('⏰ Timeout - matando processo');
    serverProcess.kill('SIGKILL');
    process.exit(1);
  }, 15000);
}

testDirectConnection().catch(console.error);
