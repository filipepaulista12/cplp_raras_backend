/**
 * GraphQL Resolver básico para módulo DrugBank
 */

import { Resolver, Query } from '@nestjs/graphql';
import { DrugbankService } from './drugbank.service';

@Resolver()
export class DrugbankResolver {
  constructor(private readonly drugbankService: DrugbankService) {}

  @Query(() => String, { name: 'drugbankTest' })
  async getDrugbankTest(): Promise<string> {
    const result = await this.drugbankService.findAll(1, 5);
    return JSON.stringify(result);
  }
}
