/**
 * Serviço de Autenticação JWT
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'researcher' | 'readonly';
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  // Demo users - Em produção usar banco de dados
  private readonly users: User[] = [
    {
      id: 1,
      email: 'admin@cplp-raras.org',
      role: 'admin',
      name: 'Administrador CPLP-Raras'
    },
    {
      id: 2,
      email: 'researcher@cplp-raras.org', 
      role: 'researcher',
      name: 'Pesquisador'
    },
    {
      id: 3,
      email: 'public@cplp-raras.org',
      role: 'readonly', 
      name: 'Usuário Público'
    }
  ];

  private readonly passwords = new Map([
    ['admin@cplp-raras.org', '$2a$10$example.hash.for.admin'],
    ['researcher@cplp-raras.org', '$2a$10$example.hash.for.researcher'],
    ['public@cplp-raras.org', '$2a$10$example.hash.for.public']
  ]);

  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = this.users.find(u => u.email === email);
    if (!user) return null;

    // Em produção, usar hash real do bcrypt
    const isValidPassword = email.includes('admin') && password === 'admin2025' ||
                           email.includes('researcher') && password === 'research2025' ||
                           email.includes('public') && password === 'public2025';

    if (!isValidPassword) return null;

    const { ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: User }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user
    };
  }

  async validateToken(payload: any): Promise<User> {
    const user = this.users.find(u => u.id === payload.sub);
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }
    return user;
  }

  generateApiKey(userId: number): string {
    const payload = { sub: userId, type: 'api_key' };
    return this.jwtService.sign(payload, { expiresIn: '365d' });
  }
}
