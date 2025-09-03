/**
 * CI/CD Inteligente - Inicia próprio servidor para testes
 * Solução para ECONNREFUSED: servidor próprio para validação
 */
import { spawn, ChildProcess } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

interface SystemCheck {
  component: string;
  status: 'OK' | 'FAIL' | 'WARNING' | 'SKIP';
  message: string;
  timestamp: string;
}

class SmartCPLPTestRunner {
  private results: TestResult[] = [];
  private systemChecks: SystemCheck[] = [];
  private serverProcess: ChildProcess | null = null;
  private serverPort = 3002; // Porta diferente para não conflitar

  async runFullSuite(): Promise<void> {
    console.log('🚀 CPLP-Raras CI/CD Inteligente Iniciado');
    console.log('=' .repeat(50));

    let serverStarted = false;

    try {
      await this.startTestServer();
      serverStarted = true;
      
      await this.checkSystemHealth();
      await this.verifyDatabase();
      await this.testEndpoints();
      await this.runUnitTests();
      
    } catch (error: any) {
      console.error('❌ Erro durante execução:', error.message);
      this.addSystemCheck('EXECUTION', 'FAIL', `Falha na execução: ${error.message}`);
    } finally {
      if (serverStarted) {
        await this.stopTestServer();
      }
      await this.generateReport();
    }
  }

  private async startTestServer(): Promise<void> {
    console.log('🔧 Iniciando servidor de teste...');
    
    // Compilar primeiro
    console.log('🔨 Compilando projeto...');
    try {
      await this.runCommand('npm', ['run', 'build']);
      console.log('✅ Compilação concluída');
    } catch (error: any) {
      throw new Error(`Falha na compilação: ${error.message}`);
    }
    
    // Iniciar servidor na porta de teste
    console.log(`🚀 Iniciando servidor na porta ${this.serverPort}...`);
    
    return new Promise((resolve, reject) => {
      // Criar processo com porta específica
      const env = { 
        ...process.env, 
        PORT: this.serverPort.toString(),
        NODE_ENV: 'test'
      };
      
      this.serverProcess = spawn('node', ['dist/main'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env,
        cwd: process.cwd(),
        shell: true // Importante para Windows
      });

      let serverStarted = false;
      let serverOutput = '';
      
      const timeout = setTimeout(() => {
        if (!serverStarted) {
          console.log('🔍 Output do servidor:', serverOutput);
          reject(new Error(`Servidor não iniciou em 30s. Output: ${serverOutput}`));
        }
      }, 30000);

      this.serverProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        serverOutput += output;
        console.log('📤 Server:', output.trim());
        
        if (output.includes('Nest application successfully started') || 
            output.includes('CPLP-Raras Backend iniciado')) {
          serverStarted = true;
          clearTimeout(timeout);
          console.log('✅ Servidor de teste iniciado!');
          // Aguardar estabilização
          setTimeout(resolve, 3000);
        }
      });

      this.serverProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        serverOutput += error;
        console.log('⚠️ Server stderr:', error.trim());
      });

      this.serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Falha ao iniciar servidor: ${error.message}`));
      });

      this.serverProcess.on('exit', (code) => {
        if (!serverStarted && code !== 0) {
          clearTimeout(timeout);
          reject(new Error(`Servidor saiu com código ${code}. Output: ${serverOutput}`));
        }
      });
    });
  }

  private async stopTestServer(): Promise<void> {
    if (this.serverProcess) {
      console.log('⏹️ Parando servidor de teste...');
      this.serverProcess.kill('SIGTERM');
      
      // Aguardar processo finalizar
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.serverProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.serverProcess?.on('exit', () => {
          clearTimeout(timeout);
          console.log('✅ Servidor de teste parado');
          resolve();
        });
      });
    }
  }

  private async runCommand(command: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { 
        stdio: 'pipe',
        shell: true // Importante para Windows
      });
      
      let output = '';
      let error = '';
      
      proc.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      proc.stderr?.on('data', (data) => {
        error += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Comando '${command} ${args.join(' ')}' falhou (código ${code}): ${error || output}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Erro ao executar '${command}': ${err.message}`));
      });
    });
  }

  private async checkSystemHealth(): Promise<void> {
    console.log('🔍 Verificando saúde do sistema...');

    // Verificar se servidor está rodando
    try {
      const response = await this.makeRequest(`http://localhost:${this.serverPort}/health`);
      this.addSystemCheck('SERVER', 'OK', `Servidor teste respondendo na porta ${this.serverPort}`);
    } catch (error: any) {
      this.addSystemCheck('SERVER', 'FAIL', `Servidor teste não responde: ${error.message}`);
    }

    // Verificar arquivos críticos
    const criticalFiles = [
      'src/app.module.ts',
      'src/main.ts',
      'prisma/schema.prisma',
      'database/gard_dev.db',
      'public/index.html',
      'package.json',
      'tsconfig.json'
    ];

    criticalFiles.forEach(file => {
      if (existsSync(file)) {
        this.addSystemCheck('FILES', 'OK', `Arquivo crítico presente: ${file}`);
      } else {
        this.addSystemCheck('FILES', 'WARNING', `Arquivo não encontrado: ${file}`);
      }
    });

    // Verificar scripts do package.json
    try {
      const pkg = require(path.resolve('package.json'));
      const requiredScripts = ['build', 'start', 'dev', 'ci:full'];
      
      requiredScripts.forEach(script => {
        if (pkg.scripts && pkg.scripts[script]) {
          this.addSystemCheck('SCRIPTS', 'OK', `Script '${script}' configurado`);
        } else {
          this.addSystemCheck('SCRIPTS', 'FAIL', `Script '${script}' faltando`);
        }
      });
    } catch (error: any) {
      this.addSystemCheck('SCRIPTS', 'FAIL', `Erro ao verificar scripts: ${error.message}`);
    }
  }

  private async verifyDatabase(): Promise<void> {
    console.log('🗄️ Verificando banco de dados...');

    try {
      const response = await this.makeRequest(`http://localhost:${this.serverPort}/api/db-test`);
      this.addSystemCheck('DATABASE', 'OK', 'Conexão com banco funcional');
      
      // Verificar estatísticas
      try {
        const stats = await this.makeRequest(`http://localhost:${this.serverPort}/api/orphanet/stats`);
        this.addSystemCheck('DATABASE', 'OK', `Orphanet: ${stats.total || 0} registros`);
      } catch (e) {
        this.addSystemCheck('DATABASE', 'WARNING', 'Stats Orphanet indisponíveis');
      }
      
    } catch (error: any) {
      this.addSystemCheck('DATABASE', 'FAIL', `Erro no banco: ${error.message}`);
    }
  }

  private async testEndpoints(): Promise<void> {
    console.log('🔗 Testando endpoints principais...');

    const endpoints = [
      '/api/orphanet',
      '/api/orphanet/stats',
      '/api/hpo',
      '/api/hpo/stats',
      '/api/drugbank',
      '/api/drugbank/stats',
      '/api/cplp',
      '/api/cplp/countries',
      '/api/diseases',
      '/health',
      '/api/status'
    ];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      try {
        await this.makeRequest(`http://localhost:${this.serverPort}${endpoint}`);
        const duration = Date.now() - startTime;
        
        this.results.push({
          name: `Endpoint ${endpoint}`,
          status: 'PASS',
          duration
        });
        
        this.addSystemCheck('ENDPOINTS', 'OK', `${endpoint} funcionando`);
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        this.results.push({
          name: `Endpoint ${endpoint}`,
          status: 'FAIL',
          duration,
          error: error.message
        });
        
        this.addSystemCheck('ENDPOINTS', 'FAIL', `${endpoint} falhou: ${error.message}`);
      }
    }
  }

  private async runUnitTests(): Promise<void> {
    console.log('🧪 Executando verificações unitárias...');

    // Verificar se dist/ foi criado
    if (existsSync('dist/main.js')) {
      this.addSystemCheck('BUILD', 'OK', 'Build gerado com sucesso');
    } else {
      this.addSystemCheck('BUILD', 'FAIL', 'Arquivo dist/main.js não encontrado');
    }

    // Verificar módulos TypeScript
    const moduleFiles = [
      'src/modules/orphanet/orphanet.module.ts',
      'src/modules/hpo/hpo.module.ts',
      'src/modules/diseases/diseases.module.ts',
      'src/modules/cplp/cplp.module.ts',
      'src/modules/drugbank/drugbank.module.ts',
      'src/modules/opendata/opendata.module.ts',
      'src/modules/security/security.module.ts'
    ];

    let modulesOK = 0;
    moduleFiles.forEach(file => {
      if (existsSync(file)) {
        modulesOK++;
      }
    });

    if (modulesOK === moduleFiles.length) {
      this.addSystemCheck('MODULES', 'OK', `Todos os ${modulesOK} módulos presentes`);
    } else {
      this.addSystemCheck('MODULES', 'WARNING', `${modulesOK}/${moduleFiles.length} módulos encontrados`);
    }
  }

  private async makeRequest(url: string): Promise<any> {
    try {
      const fetch = await import('node-fetch');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch.default(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CPLP-Raras-Smart-CI/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Timeout: Servidor não respondeu em 10s`);
      }
      throw new Error(`Conexão falhou: ${error.code || error.message}`);
    }
  }

  private addSystemCheck(component: string, status: 'OK' | 'FAIL' | 'WARNING' | 'SKIP', message: string): void {
    this.systemChecks.push({
      component,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  }

  private async generateReport(): Promise<void> {
    console.log('📊 Gerando relatório...');

    const report = {
      timestamp: new Date().toISOString(),
      test_type: 'Smart CI/CD with dedicated test server',
      server_port: this.serverPort,
      summary: {
        total_checks: this.systemChecks.length,
        passed: this.systemChecks.filter(c => c.status === 'OK').length,
        failed: this.systemChecks.filter(c => c.status === 'FAIL').length,
        warnings: this.systemChecks.filter(c => c.status === 'WARNING').length
      },
      system_health: this.systemChecks,
      endpoint_tests: this.results,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.resolve('ci-cd-smart-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('=' .repeat(50));
    console.log('📋 RESUMO FINAL:');
    console.log(`✅ Passaram: ${report.summary.passed}`);
    console.log(`❌ Falharam: ${report.summary.failed}`);
    console.log(`⚠️  Avisos: ${report.summary.warnings}`);
    console.log(`📄 Relatório salvo em: ${reportPath}`);

    if (report.summary.failed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema está funcionando perfeitamente.');
      process.exit(0);
    } else {
      console.log('⚠️  ALGUNS PROBLEMAS ENCONTRADOS. Verifique o relatório.');
      process.exit(1);
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedChecks = this.systemChecks.filter(c => c.status === 'FAIL');
    
    if (failedChecks.some(c => c.component === 'SERVER')) {
      recommendations.push('Verificar configuração do servidor - problemas de inicialização');
    }
    
    if (failedChecks.some(c => c.component === 'DATABASE')) {
      recommendations.push('Verificar integridade do banco de dados SQLite');
    }
    
    if (failedChecks.some(c => c.component === 'ENDPOINTS')) {
      recommendations.push('Alguns endpoints falharam - verificar controllers');
    }

    if (failedChecks.some(c => c.component === 'BUILD')) {
      recommendations.push('Processo de build falhou - verificar tsconfig.build.json');
    }

    if (failedChecks.some(c => c.component === 'SCRIPTS')) {
      recommendations.push('Scripts do package.json incompletos - verificar configuração');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Sistema está funcionando perfeitamente!');
      recommendations.push('🚀 Pronto para deploy em produção');
      recommendations.push('📈 Considerar implementar monitoramento avançado');
    }

    return recommendations;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const runner = new SmartCPLPTestRunner();
  runner.runFullSuite().catch((error) => {
    console.error('❌ Erro crítico no CI/CD:', error.message);
    process.exit(1);
  });
}

export { SmartCPLPTestRunner };
