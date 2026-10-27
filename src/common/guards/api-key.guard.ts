import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Integration keys are loaded from the comma-separated environment variable, never hard-coded.
    const providedKey = request.header('x-api-key');
    const configuredKeys = (this.configService.get<string>('API_KEYS') ?? '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);

    if (!providedKey || configuredKeys.length === 0 || !configuredKeys.includes(providedKey)) {
      throw new UnauthorizedException('A valid x-api-key header is required.');
    }
    return true;
  }
}
