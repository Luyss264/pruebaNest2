import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../types/enums';
import { JwtUser } from '../types/jwt-user';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // authorization is opt-in per controller/handler through @Roles(...).
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    if (!request.user || !roles.includes(request.user.role)) {
      throw new ForbiddenException('Your role is not allowed to perform this operation.');
    }
    return true;
  }
}
