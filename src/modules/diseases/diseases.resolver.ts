/**
 * GraphQL Resolver básico para módulo Diseases
 */

import { Resolver, Query } from '@nestjs/graphql';
import { DiseasesService } from './diseases.service';

@Resolver()
export class DiseasesResolver {
  constructor(private readonly diseasesService: DiseasesService) {}

  @Query(() => String, { name: 'diseasesTest' })
  async getDiseasesTest(): Promise<string> {
    const result = await this.diseasesService.findAll();
    return JSON.stringify(result);
  }
}
