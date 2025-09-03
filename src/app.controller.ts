import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Página inicial do sistema' })
  getHomePage(@Res() res: Response) {
    try {
      const htmlPath = path.join(process.cwd(), 'public', 'index.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).send('Erro ao carregar página inicial');
    }
  }

  @Get('api/hello')
  @ApiOperation({ summary: 'API welcome message' })
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

  @Get('health')
  @ApiOperation({ summary: 'Health check for deployment services' })
  healthCheck() {
    return this.appService.getHealthCheck();
  }
}
