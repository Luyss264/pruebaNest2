import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MechanicStatus } from '../../common/types/enums';
import { MechanicsDao } from './dao/mechanics.dao';
import type { MechanicUpdateInput } from './dao/mechanics.dao';
import { UsersDao } from '../users/dao/users.dao';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { AuditsService } from '../audits/audits.service';

@Injectable()
export class MechanicsService {
  constructor(private readonly mechanicsDao: MechanicsDao, private readonly usersDao: UsersDao, private readonly auditsService: AuditsService) {}

  list() { return this.mechanicsDao.list(); }

  async findById(id: number) {
    const mechanic = await this.mechanicsDao.findById(id);
    if (!mechanic) throw new NotFoundException(`Mechanic ${id} was not found.`);
    return mechanic;
  }

  async create(dto: CreateMechanicDto, actorId: number) {
    if (await this.mechanicsDao.findByEmail(dto.email)) throw new ConflictException(`Mechanic email ${dto.email} is already registered.`);
    let linkedUserId: number | undefined;
    if (dto.userId !== undefined) {
      const found = await this.usersDao.findActiveTechnicianById(dto.userId);
      if (!found) throw new ConflictException('The linked user must be an active TECHNICIAN account.');
      if (found.mechanic) throw new ConflictException('This user already has a mechanic profile.');
      linkedUserId = found.id;
    }
    const mechanic = await this.mechanicsDao.create({
      name: dto.name.trim(), email: dto.email.trim().toLowerCase(), specialty: dto.specialty.trim(),
      status: dto.status ?? MechanicStatus.ACTIVE,
      userId: linkedUserId,
    });
    await this.auditsService.record('MECHANIC_CREATED', 'MECHANIC', mechanic.id, actorId, { email: mechanic.email, userId: linkedUserId ?? null });
    return mechanic;
  }

  async update(id: number, dto: UpdateMechanicDto, actorId: number) {
    const existing = await this.findById(id);
    if (dto.email) {
      const other = await this.mechanicsDao.findByEmail(dto.email);
      if (other && other.id !== id) throw new ConflictException(`Mechanic email ${dto.email} is already registered.`);
    }
    const changes: MechanicUpdateInput = {
      name: dto.name?.trim(),
      email: dto.email?.trim().toLowerCase(),
      specialty: dto.specialty?.trim(),
      status: dto.status,
    };
    if (dto.userId !== undefined && dto.userId !== existing.userId) {
      const found = await this.usersDao.findActiveTechnicianById(dto.userId);
      if (!found) throw new ConflictException('The linked user must be an active TECHNICIAN account.');
      if (found.mechanic && found.mechanic.id !== id) throw new ConflictException('This user already has a mechanic profile.');
      changes.userId = found.id;
    }
    const updated = await this.mechanicsDao.update(id, changes);
    await this.auditsService.record('MECHANIC_UPDATED', 'MECHANIC', id, actorId, { changedFields: Object.keys(dto) });
    return updated;
  }

  async setStatus(id: number, status: MechanicStatus, actorId: number) {
    const mechanic = await this.findById(id);
    const updated = await this.mechanicsDao.update(id, { status });
    await this.auditsService.record(status === MechanicStatus.ACTIVE ? 'MECHANIC_ACTIVATED' : 'MECHANIC_INACTIVATED', 'MECHANIC', id, actorId, { previousStatus: mechanic.status, status });
    return updated;
  }
}
