/**
 * Serviço de Segurança - Validações, Sanitização, Rate Limiting
 */
import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class SecurityService {
  
  /**
   * Sanitiza input do usuário removendo caracteres perigosos
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>]/g, '') // Remove < >
      .replace(/script/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limite de 1000 caracteres
  }

  /**
   * Valida se o IP está na whitelist (para APIs críticas)
   */
  isIpWhitelisted(ip: string): boolean {
    const whitelist = [
      '127.0.0.1',
      '::1',
      'localhost'
    ];
    
    return whitelist.includes(ip);
  }

  /**
   * Gera hash seguro para senhas
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 12);
  }

  /**
   * Valida força da senha
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve ter pelo menos uma letra maiúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve ter pelo menos uma letra minúscula');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Senha deve ter pelo menos um número');
    }
    
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
      errors.push('Senha deve ter pelo menos um caractere especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Log de atividade suspeita
   */
  logSuspiciousActivity(req: Request, activity: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      activity,
      headers: req.headers
    };
    
    console.warn('🚨 ATIVIDADE SUSPEITA:', logData);
    // Em produção, enviar para sistema de log centralizado
  }

  /**
   * Rate limiting personalizado por usuário
   */
  checkRateLimit(userId: number, action: string): {
    allowed: boolean;
    resetTime?: Date;
  } {
    // Implementação básica - em produção usar Redis
    const key = `${userId}_${action}`;
    const now = new Date();
    
    // Simula rate limiting
    return {
      allowed: true,
      resetTime: new Date(now.getTime() + 60000) // 1 minuto
    };
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Gera token CSRF
   */
  generateCsrfToken(): string {
    return Math.random().toString(36).substring(2) + 
           Date.now().toString(36);
  }

  /**
   * Headers de segurança recomendados
   */
  getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
  }
}
