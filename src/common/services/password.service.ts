import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  async hash(password: string): Promise<string> {
    const configuredRounds = Number(this.configService.get<string>('BCRYPT_ROUNDS') ?? 12);
    const rounds = Number.isInteger(configuredRounds) && configuredRounds >= 10 && configuredRounds <= 15
      ? configuredRounds
      : 12;
    return bcrypt.hash(password, rounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
