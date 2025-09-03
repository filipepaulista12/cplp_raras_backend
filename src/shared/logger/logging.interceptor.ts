import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from './custom-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const { method, url, headers } = request;
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.logApiRequest(method, url, statusCode, responseTime, userAgent);

        // Log específico por módulo
        if (url.includes('/api/orphanet')) {
          this.logger.logOrphanetAccess(url, request.query);
        } else if (url.includes('/api/hpo')) {
          this.logger.logHpoAccess(url, request.query.q);
        } else if (url.includes('/api/cplp')) {
          this.logger.logCplpAccess(request.params.code, url);
        }
      }),
    );
  }
}
