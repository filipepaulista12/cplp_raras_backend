import { Injectable } from '@nestjs/common';

@Injectable()
export class DiseasesService {
  findAll() {
    return {
      status: 'success',
      message: 'Diseases service funcionando',
      timestamp: new Date().toISOString()
    };
  }
}
