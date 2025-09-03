import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class HpoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Buscar tabelas HPO no banco de dados
      const hpoTables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (
          name LIKE '%hpo%' OR 
          name LIKE '%phenotype%' OR
          name LIKE '%HP:%' OR
          name LIKE '%term%'
        )
        ORDER BY name
      ` as any[];

      return {
        status: 'success',
        message: 'Tabelas HPO encontradas',
        data: {
          page,
          limit,
          tables: hpoTables,
          totalTables: hpoTables.length
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar dados HPO',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async findOne(id: string) {
    try {
      // Buscar termo HPO específico
      return {
        status: 'success',
        message: `Busca por termo HPO: ${id}`,
        data: { 
          id,
          description: `Termo HPO para ${id}`,
          type: 'HPO_TERM'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar termo HPO específico',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      // Estatísticas das tabelas HPO
      const allTables = await this.prisma.$queryRaw`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      ` as any[];

      const hpoTables = allTables.filter((table: any) => 
        table.name.toLowerCase().includes('hpo') || 
        table.name.toLowerCase().includes('phenotype') ||
        table.name.toLowerCase().includes('term') ||
        table.name.includes('HP:')
      );

      return {
        status: 'success',
        message: 'Estatísticas do banco de dados HPO',
        data: {
          totalTables: allTables.length,
          hpoTables: hpoTables.length,
          tables: hpoTables,
          description: 'Human Phenotype Ontology - Ontologia de fenótipos humanos'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao obter estatísticas HPO',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async searchPhenotypes(query: string) {
    try {
      return {
        status: 'success',
        message: `Busca por fenótipos: ${query}`,
        data: {
          query,
          results: [],
          description: 'Implementar busca específica nos dados HPO'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar fenótipos',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
