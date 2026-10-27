import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersDao } from '../users/dao/users.dao';
import { UserRole } from '../../common/types/enums';
import { PasswordService } from '../../common/services/password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditsService } from '../audits/audits.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly auditsService: AuditsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersDao.findByEmail(dto.email);
    if (existing) throw new ConflictException('An account with this email already exists.');
    // Public registration deliberately creates TECHNICIAN accounts only; ADMIN assignment is restricted to administrators.
    const user = await this.usersDao.create({
      name: dto.name.trim(), email: dto.email.trim().toLowerCase(),
      passwordHash: await this.passwordService.hash(dto.password), role: UserRole.TECHNICIAN, isActive: true,
    });
    await this.auditsService.record('USER_REGISTERED', 'USER', user.id, user.id, { role: user.role });
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersDao.findByEmail(dto.email, true);
    if (!user || !user.isActive || !user.passwordHash || !(await this.passwordService.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    return this.issueToken(user);
  }

  private async issueToken(user: { id: number; email: string; name: string; role: UserRole; mechanic?: { id: number } | null }) {
    const payload = { sub: user.id, email: user.email, name: user.name, role: user.role, mechanicId: user.mechanic?.id ?? null };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, mechanicId: payload.mechanicId },
    };
  }
}
