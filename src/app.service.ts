import { Injectable } from '@nestjs/common';
import { DatabaseService } from './shared/database/simple-db.service';
import { CustomLoggerService } from './shared/logger/custom-logger.service';

@Injectable()
export class AppService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: CustomLoggerService,
  ) {}

  getHello(): string {
    this.logger.log('Endpoint de boas-vindas acessado', 'AppService');
    return 'Bem-vindo à API CPLP-Raras! O sistema está no ar. Acesse /api-docs para a documentação.';
  }

  getStatus() {
    this.logger.log('Status do sistema solicitado', 'AppService');
    return {
      status: 'OK',
      message: 'CPLP-Raras Backend API está funcionando!',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  async testDatabase() {
    const startTime = Date.now();
    try {
      this.logger.log('Iniciando teste de conexão com banco de dados', 'AppService');
      
      const result = this.db.query("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
      const tablesList = this.db.query("SELECT name FROM sqlite_master WHERE type='table' LIMIT 5");
      
      const duration = Date.now() - startTime;
      this.logger.logDatabaseQuery('SELECT COUNT(*) as count FROM sqlite_master WHERE type=\'table\'', duration, true);
      
      return {
        status: 'OK',
        message: 'Conexão com banco de dados funcionando!',
        database: 'Connected',
        tablesCount: result[0]?.count || 0,
        sampleTables: tablesList.map((t: any) => t.name),
        responseTime: `${duration}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.logDatabaseQuery('SELECT COUNT(*) as count FROM sqlite_master WHERE type=\'table\'', duration, false);
      this.logger.error(`Erro na conexão com banco de dados: ${error.message}`, error.stack, 'AppService');
      
      return {
        status: 'ERROR',
        message: 'Erro na conexão com banco de dados',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
