/**
 * GraphQL Resolver básico para módulo CPLP
 */

import { Resolver, Query } from '@nestjs/graphql';
import { CplpService } from './cplp.service';

@Resolver()
export class CplpResolver {
  constructor(private readonly cplpService: CplpService) {}

  @Query(() => String, { name: 'cplpTest' })
  async getCplpTest(): Promise<string> {
    const result = await this.cplpService.findAll(1, 5);
    return JSON.stringify(result);
  }
}
