import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../shared/database/simple-db.service';

@Injectable()
export class OrphanetService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Query real: buscar dados de doenças raras
      const diseases = this.db.query(`
        SELECT DISTINCT name as tableName, sql as schema
        FROM sqlite_master 
        WHERE type='table' 
        AND (name LIKE '%orpha%' OR name LIKE '%disease%' OR name LIKE '%rare%')
        LIMIT ? OFFSET ?
      `, [limit, skip]);

      // Tentar obter dados reais da primeira tabela encontrada
      let realData = [];
      if (diseases.length > 0) {
        const firstTable = diseases[0].tableName;
        try {
          // Query genérica para obter dados da primeira tabela
          const tableData = this.db.query(`
            SELECT * FROM "${firstTable}" LIMIT ?
          `, [limit]);
          realData = tableData;
        } catch (tableError) {
          console.log('Erro ao consultar tabela específica:', tableError);
        }
      }

      // Contar total de registros disponíveis
      const totalTables = this.db.query(`
        SELECT COUNT(*) as total
        FROM sqlite_master 
        WHERE type='table' 
        AND (name LIKE '%orpha%' OR name LIKE '%disease%' OR name LIKE '%rare%')
      `);

      return {
        status: 'success',
        message: `Dados Orphanet - Página ${page}`,
        data: {
          tables: diseases,
          sampleData: realData,
          pagination: {
            page,
            limit,
            total: totalTables[0]?.total || 0,
            pages: Math.ceil((totalTables[0]?.total || 0) / limit)
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro em findAll:', error);
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
      // Primeiro, encontrar tabelas que possam conter dados da doença
      const possibleTables = this.db.query(`
        SELECT name 
        FROM sqlite_master 
        WHERE type='table' 
        AND (name LIKE '%orpha%' OR name LIKE '%disease%' OR name LIKE '%rare%')
        ORDER BY name
      `);

      let foundData = null;
      let searchedTables = [];

      // Buscar o ID em diferentes tabelas
      for (const table of possibleTables) {
        try {
          // Tentar diferentes padrões de busca
          const patterns = [
            `SELECT * FROM "${table.name}" WHERE id = '${id}' LIMIT 1`,
            `SELECT * FROM "${table.name}" WHERE orpha_id = '${id}' LIMIT 1`, 
            `SELECT * FROM "${table.name}" WHERE orphanet_id = '${id}' LIMIT 1`,
            `SELECT * FROM "${table.name}" WHERE code = '${id}' LIMIT 1`,
            `SELECT * FROM "${table.name}" WHERE name LIKE '%${id}%' LIMIT 5`
          ];

          for (const pattern of patterns) {
            try {
              const result = this.db.query(pattern);
              if (result && result.length > 0) {
                foundData = result;
                searchedTables.push({ table: table.name, pattern, found: true });
                break;
              }
            } catch (patternError) {
              // Continuar tentando outros padrões
            }
          }

          if (foundData) break;
          searchedTables.push({ table: table.name, found: false });

        } catch (tableError) {
          searchedTables.push({ table: table.name, error: tableError.message });
        }
      }

      if (foundData && (foundData as any[]).length > 0) {
        return {
          status: 'success',
          message: `Doença encontrada: ${id}`,
          data: {
            id,
            records: foundData,
            searchInfo: {
              tablesSearched: searchedTables.length,
              foundIn: searchedTables.find(t => t.found)?.table
            }
          },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          status: 'not_found',
          message: `Doença não encontrada: ${id}`,
          data: {
            id,
            searchInfo: {
              tablesSearched: possibleTables.length,
              tablesChecked: searchedTables
            }
          },
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error('Erro em findOne:', error);
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
      // Estatísticas detalhadas do banco
      const allTables = this.db.query(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
      `);

      const rareDiseasesTables = allTables.filter((table: any) => 
        table.name.toLowerCase().includes('orpha') || 
        table.name.toLowerCase().includes('disease') ||
        table.name.toLowerCase().includes('rare') ||
        table.name.toLowerCase().includes('hpo') ||
        table.name.toLowerCase().includes('drug') ||
        table.name.toLowerCase().includes('gene')
      );

      // Contar registros em tabelas principais
      const tableStats = [];
      for (const table of rareDiseasesTables.slice(0, 10)) { // Primeiras 10 tabelas
        try {
          const count = this.db.query(`
            SELECT COUNT(*) as total FROM "${table.name}"
          `);
          tableStats.push({
            tableName: table.name,
            recordCount: count[0]?.total || 0,
            hasData: count[0]?.total > 0
          });
        } catch (countError) {
          tableStats.push({
            tableName: table.name,
            recordCount: 0,
            error: 'Erro ao contar registros'
          });
        }
      }

      // Estatísticas gerais
      const totalRecords = tableStats.reduce((sum, table) => 
        sum + (table.recordCount || 0), 0
      );

      const activeConnections = this.db.query(`
        PRAGMA database_list
      `);

      return {
        status: 'success',
        message: 'Estatísticas completas do módulo Orphanet',
        data: {
          database: {
            totalTables: allTables.length,
            rareDiseasesTables: rareDiseasesTables.length,
            totalRecords,
            connections: activeConnections.length
          },
          tableDetails: tableStats,
          categories: {
            orphanet: rareDiseasesTables.filter(t => 
              t.name.toLowerCase().includes('orpha')).length,
            diseases: rareDiseasesTables.filter(t => 
              t.name.toLowerCase().includes('disease')).length,
            hpo: rareDiseasesTables.filter(t => 
              t.name.toLowerCase().includes('hpo')).length,
            drugs: rareDiseasesTables.filter(t => 
              t.name.toLowerCase().includes('drug')).length,
            genes: rareDiseasesTables.filter(t => 
              t.name.toLowerCase().includes('gene')).length
          },
          sampleTables: rareDiseasesTables.slice(0, 5).map(t => t.name),
          lastUpdated: new Date().toISOString(),
          version: 'CPLP-Raras v1.0.0'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro em getStats:', error);
      return {
        status: 'error',
        message: 'Erro ao obter estatísticas',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
