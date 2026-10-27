import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../database/entities/user.entity';
import { UserRole } from '../../../common/types/enums';

@Injectable()
export class UsersDao {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<UserEntity | null> {
    const query = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.mechanic', 'mechanic');

    if (includePassword) {
      query.addSelect('user.passwordHash');
    }

    return query
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async findById(id: number): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: { mechanic: true },
    });
  }

  async findByIdWithPassword(id: number): Promise<UserEntity | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.mechanic', 'mechanic')
      .where('user.id = :id', { id })
      .getOne();
  }

  async create(input: Partial<UserEntity>): Promise<UserEntity> {
    const entity = this.repository.create(input);
    return this.repository.save(entity);
  }

  async update(
    id: number,
    input: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing) {
      throw new Error('User disappeared before update.');
    }

    // Ignore undefined values to preserve existing entity fields.
    const changes = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );

    Object.assign(existing, changes);

    // Saving the loaded entity avoids QueryDeepPartialEntity type conflicts.
    await this.repository.save(existing);

    const updated = await this.findById(id);

    if (!updated) {
      throw new Error('User disappeared after update.');
    }

    return updated;
  }

  async list(): Promise<UserEntity[]> {
    return this.repository.find({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { id: 'ASC' },
    });
  }

  async findActiveTechnicianById(
    id: number,
  ): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        role: UserRole.TECHNICIAN,
        isActive: true,
      },
      relations: { mechanic: true },
    });
  }
}