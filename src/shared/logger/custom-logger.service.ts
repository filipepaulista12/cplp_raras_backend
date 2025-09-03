import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logDir = 'logs';
  private readonly logFile = join(this.logDir, 'cplp-raras.log');

  constructor() {
    // Criar diretório de logs se não existir
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message: any, context?: string) {
    this.writeLog('LOG', message, context);
    console.log(`[${new Date().toISOString()}] [LOG] ${context || 'Application'}: ${message}`);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeLog('ERROR', message, context, trace);
    console.error(`[${new Date().toISOString()}] [ERROR] ${context || 'Application'}: ${message}${trace ? `\n${trace}` : ''}`);
  }

  warn(message: any, context?: string) {
    this.writeLog('WARN', message, context);
    console.warn(`[${new Date().toISOString()}] [WARN] ${context || 'Application'}: ${message}`);
  }

  debug(message: any, context?: string) {
    this.writeLog('DEBUG', message, context);
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] ${context || 'Application'}: ${message}`);
    }
  }

  verbose(message: any, context?: string) {
    this.writeLog('VERBOSE', message, context);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] [VERBOSE] ${context || 'Application'}: ${message}`);
    }
  }

  private writeLog(level: string, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: context || 'Application',
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      trace: trace || null
    };

    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      writeFileSync(this.logFile, logLine, { flag: 'a' });
    } catch (error) {
      console.error('Erro ao escrever no arquivo de log:', error);
    }
  }

  // Métodos específicos para a aplicação CPLP-Raras
  logApiRequest(method: string, url: string, statusCode: number, responseTime: number, userAgent?: string) {
    const logData = {
      type: 'API_REQUEST',
      method,
      url,
      statusCode,
      responseTime,
      userAgent
    };
    this.log(logData, 'API');
  }

  logDatabaseQuery(query: string, duration: number, success: boolean) {
    const logData = {
      type: 'DATABASE_QUERY',
      query,
      duration,
      success
    };
    this.log(logData, 'DATABASE');
  }

  logOrphanetAccess(endpoint: string, params?: any) {
    const logData = {
      type: 'ORPHANET_ACCESS',
      endpoint,
      params
    };
    this.log(logData, 'ORPHANET');
  }

  logHpoAccess(endpoint: string, searchTerm?: string) {
    const logData = {
      type: 'HPO_ACCESS',
      endpoint,
      searchTerm
    };
    this.log(logData, 'HPO');
  }

  logCplpAccess(country?: string, endpoint?: string) {
    const logData = {
      type: 'CPLP_ACCESS',
      country,
      endpoint
    };
    this.log(logData, 'CPLP');
  }
}
