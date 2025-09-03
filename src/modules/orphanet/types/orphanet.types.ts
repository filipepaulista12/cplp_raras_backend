/**
 * GraphQL Types para módulo Orphanet
 * Definições de tipos simples para schema GraphQL
 */

import { ObjectType, Field, Int } from '@nestjs/graphql';

// Tipos básicos
@ObjectType()
export class PaginationType {
  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  pages: number;
}

@ObjectType()
export class DatabaseTableType {
  @Field()
  tableName: string;

  @Field({ nullable: true })
  schema?: string;
}

@ObjectType()
export class GenericDataType {
  @Field()
  key: string;

  @Field()
  value: string;
}

@ObjectType()
export class OrphanetDiseaseType {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  code?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  synonyms?: string[];

  @Field()
  timestamp: string;
}

// Tipos para dados de busca
@ObjectType()
export class OrphanetSearchDataType {
  @Field(() => [DatabaseTableType])
  tables: DatabaseTableType[];

  @Field(() => [GenericDataType], { nullable: true })
  sampleData?: GenericDataType[];

  @Field(() => PaginationType)
  pagination: PaginationType;
}

@ObjectType()
export class OrphanetSearchResultType {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => OrphanetSearchDataType)
  data: OrphanetSearchDataType;

  @Field()
  timestamp: string;
}

// Tipos para estatísticas (simplificados)
@ObjectType()
export class OrphanetStatsType {
  @Field(() => Int)
  totalTables: number;

  @Field(() => Int)
  rareDiseasesTables: number;

  @Field(() => Int)
  totalRecords: number;

  @Field()
  lastUpdated: string;

  @Field()
  version: string;
}
