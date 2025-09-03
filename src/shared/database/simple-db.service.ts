import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as Database from 'better-sqlite3';
import { join } from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;

  async onModuleInit() {
    const dbPath = join(process.cwd(), 'database', 'gard_dev.db');
    this.db = new (Database as any)(dbPath, { readonly: false });
    console.log('🔌 SQLite connected to database');
  }

  async onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  query(sql: string, params: any[] = []): any[] {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params);
    } catch (error) {
      throw error;
    }
  }

  queryFirst(sql: string, params: any[] = []): any {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.get(params);
    } catch (error) {
      throw error;
    }
  }
}
