/**
 * GraphQL Resolver básico para módulo HPO
 */

import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { HpoService } from './hpo.service';

@Resolver()
export class HpoResolver {
  constructor(private readonly hpoService: HpoService) {}

  @Query(() => String, { name: 'hpoTest' })
  async getHpoTest(): Promise<string> {
    const result = await this.hpoService.findAll(1, 5);
    return JSON.stringify(result);
  }
}
