import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MechanicEntity } from '../../../database/entities/mechanic.entity';
import { UserEntity } from '../../../database/entities/user.entity';
import { MechanicStatus } from '../../../common/types/enums';

export interface MechanicCreateInput {
  name: string;
  email: string;
  specialty: string;
  status?: MechanicStatus;
  userId?: number | null;
}

export interface MechanicUpdateInput {
  name?: string;
  email?: string;
  specialty?: string;
  status?: MechanicStatus;
  userId?: number | null;
}

@Injectable()
export class MechanicsDao {
  constructor(@InjectRepository(MechanicEntity) private readonly repository: Repository<MechanicEntity>) {}

  findById(id: number): Promise<MechanicEntity | null> {
    return this.repository.findOne({ where: { id }, relations: { user: true } });
  }

  findByUserId(userId: number): Promise<MechanicEntity | null> {
    return this.repository.findOne({ where: { user: { id: userId } }, relations: { user: true } });
  }

  findByEmail(email: string): Promise<MechanicEntity | null> {
    return this.repository.createQueryBuilder('mechanic').leftJoinAndSelect('mechanic.user', 'user')
      .where('LOWER(mechanic.email) = LOWER(:email)', { email }).getOne();
  }

  async create(input: MechanicCreateInput): Promise<MechanicEntity> {
    const { userId, ...fields } = input;
    const entity = this.repository.create(fields);
    if (userId !== undefined) entity.user = userId === null ? null : ({ id: userId } as UserEntity);
    const saved = await this.repository.save(entity);
    const created = await this.findById(saved.id);
    if (!created) throw new Error('Mechanic disappeared after creation.');
    return created;
  }

  async update(id: number, input: MechanicUpdateInput): Promise<MechanicEntity> {
    const existing = await this.repository.findOne({ where: { id } });
    if (!existing) throw new Error('Mechanic disappeared before update.');
    const { userId, ...fields } = input;
    this.repository.merge(existing, fields);
    if (Object.prototype.hasOwnProperty.call(input, 'userId')) {
      existing.user = userId == null ? null : ({ id: userId } as UserEntity);
    }
    await this.repository.save(existing);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Mechanic disappeared after update.');
    return updated;
  }

  list(): Promise<MechanicEntity[]> {
    return this.repository.find({ relations: { user: true }, order: { id: 'ASC' } });
  }
}
