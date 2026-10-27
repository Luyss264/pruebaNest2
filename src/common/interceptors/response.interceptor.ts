import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    // Wrap every successful controller result in the public API response envelope.
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>();
        return {
          success: true,
          statusCode: response.statusCode,
          data: data ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
