/**
 * Testes E2E principais - Verificação completa do sistema
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CPLP-Raras Backend (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('🔥 TESTES CRÍTICOS DO SISTEMA', () => {
    it('✅ Servidor deve estar funcionando', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(/CPLP-Raras/);
    });

    it('✅ API Status deve retornar dados', () => {
      return request(app.getHttpServer())
        .get('/api/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'OK');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('✅ Teste de conexão com banco', () => {
      return request(app.getHttpServer())
        .get('/api/db-test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('database');
        });
    });
  });

  describe('🔬 MÓDULO ORPHANET', () => {
    it('✅ Deve retornar dados Orphanet', () => {
      return request(app.getHttpServer())
        .get('/api/orphanet')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'success');
          expect(res.body).toHaveProperty('data');
        });
    });

    it('✅ Estatísticas Orphanet devem funcionar', () => {
      return request(app.getHttpServer())
        .get('/api/orphanet/stats')
        .expect(200);
    });
  });

  describe('🧬 MÓDULO HPO', () => {
    it('✅ Deve retornar dados HPO', () => {
      return request(app.getHttpServer())
        .get('/api/hpo')
        .expect(200);
    });

    it('✅ Busca HPO deve funcionar', () => {
      return request(app.getHttpServer())
        .get('/api/hpo/search?term=pain')
        .expect(200);
    });
  });

  describe('💊 MÓDULO DRUGBANK', () => {
    it('✅ Deve retornar dados DrugBank', () => {
      return request(app.getHttpServer())
        .get('/api/drugbank')
        .expect(200);
    });

    it('✅ Estatísticas DrugBank devem funcionar', () => {
      return request(app.getHttpServer())
        .get('/api/drugbank/stats')
        .expect(200);
    });
  });

  describe('🌍 MÓDULO CPLP', () => {
    it('✅ Deve retornar países CPLP', () => {
      return request(app.getHttpServer())
        .get('/api/cplp/countries')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.countries)).toBe(true);
          expect(res.body.data.countries.length).toBeGreaterThan(0);
        });
    });
  });

  describe('📊 MÓDULO DISEASES', () => {
    it('✅ Endpoint diseases deve funcionar', () => {
      return request(app.getHttpServer())
        .get('/api/diseases')
        .expect(200);
    });
  });

  describe('🌟 OPEN DATA (se implementado)', () => {
    it('🔄 Portal Open Data (se existir)', async () => {
      const response = await request(app.getHttpServer())
        .get('/opendata');
      
      // Se existir, deve ser 200, senão 404 é OK
      expect([200, 404]).toContain(response.status);
    });
  });
});
