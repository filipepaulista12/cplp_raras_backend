/**
 * Controller de Segurança - Autenticação e API Keys
 */
import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService, LoginDto } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Autenticação')
@Controller('api/auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login com email/senha' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('api-key')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar chave de API' })
  @ApiResponse({ status: 200, description: 'Chave de API gerada' })
  async generateApiKey(@Request() req) {
    const apiKey = this.authService.generateApiKey(req.user.id);
    return {
      api_key: apiKey,
      message: 'Chave de API gerada com sucesso. Guarde em local seguro.',
      expires_in: '365 days'
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Informações do usuário' })
  async getProfile(@Request() req) {
    return {
      user: req.user,
      permissions: this.getPermissions(req.user.role)
    };
  }

  @Get('demo-credentials')
  @ApiOperation({ summary: 'Credenciais de demonstração' })
  @ApiResponse({ 
    status: 200, 
    description: 'Credenciais para teste (apenas em desenvolvimento)' 
  })
  getDemoCredentials() {
    return {
      message: 'Credenciais de demonstração - apenas para desenvolvimento',
      users: [
        {
          email: 'admin@cplp-raras.org',
          password: 'admin2025',
          role: 'admin',
          permissions: 'Acesso completo - administração'
        },
        {
          email: 'researcher@cplp-raras.org', 
          password: 'research2025',
          role: 'researcher',
          permissions: 'Acesso a dados de pesquisa'
        },
        {
          email: 'public@cplp-raras.org',
          password: 'public2025', 
          role: 'readonly',
          permissions: 'Apenas leitura de dados públicos'
        }
      ],
      note: 'Use POST /api/auth/login com esses dados para obter token JWT'
    };
  }

  private getPermissions(role: string): string[] {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'admin', 'export'];
      case 'researcher':
        return ['read', 'export', 'limited_write'];
      case 'readonly':
        return ['read'];
      default:
        return [];
    }
  }
}
