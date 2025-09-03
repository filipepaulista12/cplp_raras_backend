import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class OrphadataService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Primeiro, vamos verificar quais tabelas existem no banco
      const tables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE '%orphanet%' OR name LIKE '%orpha%'
        ORDER BY name
      ` as any[];

      return {
        status: 'success',
        message: 'Tabelas Orphanet encontradas',
        data: {
          page,
          limit,
          tables: tables,
          totalTables: tables.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar dados Orphanet',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async findOne(id: string) {
    try {
      // Buscar por ID em diferentes tabelas possíveis
      return {
        status: 'success',
        message: `Busca por ID: ${id}`,
        data: { id },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar doença específica',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      // Get database statistics
      const allTables = await this.prisma.$queryRaw`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      ` as any[];

      const orphanetTables = allTables.filter((table: any) => 
        table.name.toLowerCase().includes('orpha') || 
        table.name.toLowerCase().includes('disease') ||
        table.name.toLowerCase().includes('rare')
      );

      return {
        status: 'success',
        message: 'Estatísticas do banco de dados Orphanet',
        data: {
          totalTables: allTables.length,
          orphanetTables: orphanetTables.length,
          tables: orphanetTables,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao obter estatísticas',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
