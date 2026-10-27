import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtUser } from '../types/jwt-user';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // authentication is required by default, only handlers explicitly marked @Public() bypass JWT checks.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('A valid Bearer token is required.');
    }

    // Signature, expiry, and payload validation are performed before claims reach controllers.
    try {
      request.user = await this.jwtService.verifyAsync<JwtUser>(authorization.slice(7));
      if (!request.user?.sub || !request.user?.role) {
        throw new UnauthorizedException('The access token payload is invalid.');
      }
      return true;
    } catch {
      throw new UnauthorizedException('The access token is invalid or has expired.');
    }
  }
}
