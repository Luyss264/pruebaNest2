import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersDao } from './dao/users.dao';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { PasswordService } from '../../common/services/password.service';
import { AuditsService } from '../audits/audits.service';

@Injectable()
export class UsersService {
  constructor(private readonly usersDao: UsersDao, private readonly passwordService: PasswordService, private readonly auditsService: AuditsService) {}

  list() { return this.usersDao.list(); }

  async create(dto: CreateUserDto, actorId: number) {
    if (await this.usersDao.findByEmail(dto.email)) throw new ConflictException('An account with this email already exists.');
    const user = await this.usersDao.create({
      name: dto.name.trim(), email: dto.email.trim().toLowerCase(),
      passwordHash: await this.passwordService.hash(dto.password), role: dto.role, isActive: true,
    });
    await this.auditsService.record('USER_CREATED', 'USER', user.id, actorId, { role: user.role });
    return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt };
  }

  async update(id: number, dto: UpdateUserDto, actorId: number) {
    const existing = await this.usersDao.findById(id);
    if (!existing) throw new NotFoundException(`User ${id} was not found.`);
    if (id === actorId && dto.isActive === false) throw new ConflictException('You cannot deactivate your own account.');
    const updated = await this.usersDao.update(id, dto);
    await this.auditsService.record('USER_UPDATED', 'USER', id, actorId, { changedFields: Object.keys(dto) });
    return { id: updated.id, name: updated.name, email: updated.email, role: updated.role, isActive: updated.isActive, updatedAt: updated.updatedAt };
  }
}
