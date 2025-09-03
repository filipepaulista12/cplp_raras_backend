import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CplpService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Buscar tabelas CPLP no banco de dados
      const cplpTables = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND (
          name LIKE '%cplp%' OR 
          name LIKE '%country%' OR
          name LIKE '%brasil%' OR
          name LIKE '%portugal%' OR
          name LIKE '%angola%' OR
          name LIKE '%mozambique%'
        )
        ORDER BY name
      ` as any[];

      return {
        status: 'success',
        message: 'Dados CPLP encontrados',
        data: {
          page,
          limit,
          tables: cplpTables,
          totalTables: cplpTables.length,
          description: 'Comunidade dos Países de Língua Portuguesa - Dados de doenças raras'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar dados CPLP',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getCountries() {
    try {
      // Lista dos países da CPLP
      const cplpCountries = [
        { code: 'BR', name: 'Brasil', population: '215000000' },
        { code: 'PT', name: 'Portugal', population: '10300000' },
        { code: 'AO', name: 'Angola', population: '35000000' },
        { code: 'MZ', name: 'Moçambique', population: '33000000' },
        { code: 'GW', name: 'Guiné-Bissau', population: '2000000' },
        { code: 'CV', name: 'Cabo Verde', population: '600000' },
        { code: 'ST', name: 'São Tomé e Príncipe', population: '230000' },
        { code: 'TL', name: 'Timor-Leste', population: '1300000' },
        { code: 'GQ', name: 'Guiné Equatorial', population: '1500000' }
      ];

      return {
        status: 'success',
        message: 'Países da CPLP',
        data: {
          countries: cplpCountries,
          totalCountries: cplpCountries.length,
          description: 'Comunidade dos Países de Língua Portuguesa'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao obter países CPLP',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async findByCountry(countryCode: string) {
    try {
      return {
        status: 'success',
        message: `Dados de doenças raras para: ${countryCode}`,
        data: {
          countryCode,
          diseases: [],
          description: 'Implementar busca específica por país'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao buscar dados por país',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getStats() {
    try {
      // Estatísticas gerais CPLP
      const allTables = await this.prisma.$queryRaw`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      ` as any[];

      const cplpTables = allTables.filter((table: any) => 
        table.name.toLowerCase().includes('cplp') || 
        table.name.toLowerCase().includes('country') ||
        table.name.toLowerCase().includes('brasil') ||
        table.name.toLowerCase().includes('portugal')
      );

      return {
        status: 'success',
        message: 'Estatísticas CPLP',
        data: {
          totalTables: allTables.length,
          cplpTables: cplpTables.length,
          tables: cplpTables,
          totalCountries: 9,
          description: 'Rede CPLP-Raras - Comunidade dos Países de Língua Portuguesa para Doenças Raras'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Erro ao obter estatísticas CPLP',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
