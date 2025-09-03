import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/status')
  @ApiOperation({ summary: 'API status endpoint' })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('api/db-test')
  @ApiOperation({ summary: 'Database connection test' })
  testDatabase() {
    return this.appService.testDatabase();
  }
}
