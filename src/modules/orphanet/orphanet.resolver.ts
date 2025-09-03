/**
 * GraphQL Resolver para módulo Orphanet
 * Converte APIs REST em queries/mutations GraphQL
 */

import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { OrphanetService } from './orphanet.service';

// Types GraphQL (a serem criados)
import { OrphanetDiseaseType, OrphanetStatsType, OrphanetSearchResultType } from './types/orphanet.types';

@Resolver(() => OrphanetDiseaseType)
export class OrphanetResolver {
  constructor(private readonly orphanetService: OrphanetService) {}

  @Query(() => OrphanetSearchResultType, { 
    name: 'orphanetDiseases',
    description: 'Buscar doenças na base Orphanet com paginação' 
  })
  async getOrphanetDiseases(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('search', { type: () => String, nullable: true }) search?: string
  ): Promise<any> {
    try {
      const result = await this.orphanetService.findAll(page, limit);
      
      return {
        success: result.status === 'success',
        message: result.message,
        data: result.data,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('Erro em orphanetDiseases resolver:', error);
      throw error;
    }
  }

  @Query(() => OrphanetDiseaseType, {
    name: 'orphanetDisease',
    description: 'Buscar doença específica por ID'
  })
  async getOrphanetDisease(
    @Args('id', { type: () => String }) id: string
  ): Promise<any> {
    try {
      const result = await this.orphanetService.findOne(id);
      
      if (result.status === 'not_found') {
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('Erro em orphanetDisease resolver:', error);
      throw error;
    }
  }

  @Query(() => OrphanetStatsType, {
    name: 'orphanetStats',
    description: 'Estatísticas da base de dados Orphanet'
  })
  async getOrphanetStats(): Promise<any> {
    try {
      const result = await this.orphanetService.getStats();
      
      return result.data;
    } catch (error) {
      console.error('Erro em orphanetStats resolver:', error);
      throw error;
    }
  }
}
