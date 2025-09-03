import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { DatabaseService } from './simple-db.service';

@Global()
@Module({
  providers: [PrismaService, DatabaseService],
  exports: [PrismaService, DatabaseService],
})
export class DatabaseModule {}
