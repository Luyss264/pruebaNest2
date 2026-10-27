import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'An unexpected error occurred.';

    // Normalize framework and database failures into one stable contract. Database constraint
    // codes are translated here so uniqueness and relation conflicts are never reported as HTTP 500.
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') message = payload;
      else if (payload && typeof payload === 'object' && 'message' in payload) {
        const candidate = (payload as { message?: string | string[] }).message;
        message = candidate ?? exception.message;
      } else message = exception.message;
    } else if (exception && typeof exception === 'object' && 'driverError' in exception) {
      const driverError = (exception as { driverError?: { code?: string; constraint?: string }; message?: string; stack?: string }).driverError;
      if (driverError?.code === '23505') {
        statusCode = HttpStatus.CONFLICT;
        message = 'A record with the same unique value already exists.';
      } else if (driverError?.code === '23503') {
        statusCode = HttpStatus.CONFLICT;
        message = 'The operation conflicts with an existing related record.';
      } else if (driverError?.code === '23514' || driverError?.code === '22P02' || driverError?.code === '23502') {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'The supplied data violates a database constraint.';
      } else {
        this.logger.error((exception as { message?: string }).message, (exception as { stack?: string }).stack);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
