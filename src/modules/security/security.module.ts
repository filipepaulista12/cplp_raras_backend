/**
 * Módulo de Segurança - JWT, Rate Limiting, Helmet
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { SecurityService } from './security.service';

@Module({
  imports: [
    // JWT Configuration
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'cplp-raras-secret-2025',
      signOptions: { expiresIn: '24h' },
    }),
    
    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SecurityService],
  exports: [AuthService, SecurityService],
})
export class SecurityModule {}
