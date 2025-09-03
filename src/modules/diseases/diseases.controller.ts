import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('diseases')
@Controller('api/diseases')
export class DiseasesController {
  @Get()
  @ApiOperation({ summary: 'Listar doenças' })
  findAll() {
    return {
      status: 'success',
      message: 'Diseases controller funcionando',
      data: [],
      timestamp: new Date().toISOString()
    };
  }
}
